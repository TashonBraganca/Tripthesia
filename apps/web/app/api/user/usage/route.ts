import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { trips } from "@/lib/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get trips count for current month
    const tripsThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(trips)
      .where(
        eq(trips.userId, userId),
        gte(trips.createdAt, startOfMonth)
      );

    // Get recent trips for analysis
    const recentTrips = await db
      .select({
        id: trips.id,
        duration: trips.duration,
        createdAt: trips.createdAt,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(trips.createdAt)
      .limit(10);

    // Calculate average activities per day and days per trip
    let totalDays = 0;
    let totalActivities = 0;
    let tripCount = recentTrips.length;

    for (const trip of recentTrips) {
      totalDays += trip.duration || 3; // default to 3 days if not set
      // In a real implementation, you'd count activities from the itinerary
      totalActivities += (trip.duration || 3) * 8; // estimate 8 activities per day
    }

    const avgActivitiesPerDay = tripCount > 0 ? Math.round(totalActivities / totalDays) : 8;
    const avgDaysPerTrip = tripCount > 0 ? Math.round(totalDays / tripCount) : 3;

    const usage = {
      tripsThisMonth: tripsThisMonth[0]?.count || 0,
      tripsLimit: 3, // Free tier limit
      activitiesPerDay: avgActivitiesPerDay,
      daysPerTrip: avgDaysPerTrip,
      totalTrips: tripCount,
      period: {
        start: startOfMonth.toISOString(),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      },
    };

    return NextResponse.json(usage);

  } catch (error) {
    console.error('Failed to fetch usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}