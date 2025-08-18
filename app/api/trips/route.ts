import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips } from "@/lib/database/schema";
import { getCurrentUserProfile, incrementTripUsage } from "@/lib/auth/profile";
import { canCreateTrip } from "@/lib/subscription/config";
import { eq, desc } from "drizzle-orm";

const createTripSchema = z.object({
  title: z.string().min(1).max(160),
  destinations: z.array(z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
  })).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tripType: z.enum(['leisure', 'business', 'adventure', 'cultural']),
  budgetTotal: z.number().int().positive().optional(),
  budgetCurrency: z.enum(['INR', 'USD']).default('INR'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tripData = createTripSchema.parse(body);

    // Get user profile and check limits
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user can create a trip
    if (!canCreateTrip(profile.subscriptionTier, profile.tripsUsedThisMonth, profile.subscriptionStatus)) {
      return NextResponse.json(
        { 
          error: 'Trip limit reached',
          message: `You've used ${profile.tripsUsedThisMonth} of your monthly trips. Upgrade to create more trips.`,
          upgradeRequired: true,
          currentTier: profile.subscriptionTier,
        },
        { status: 403 }
      );
    }

    // Validate dates
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Create trip
    const [trip] = await db.insert(trips).values({
      userId,
      title: tripData.title,
      destinations: tripData.destinations,
      startDate,
      endDate,
      tripType: tripData.tripType,
      budgetTotal: tripData.budgetTotal,
      budgetCurrency: tripData.budgetCurrency,
      status: 'draft',
      generationStatus: 'pending',
    }).returning();

    // Increment user's trip usage
    await incrementTripUsage(userId);

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        destinations: trip.destinations,
        startDate: trip.startDate,
        endDate: trip.endDate,
        tripType: trip.tripType,
        budgetTotal: trip.budgetTotal,
        budgetCurrency: trip.budgetCurrency,
        status: trip.status,
        generationStatus: trip.generationStatus,
        createdAt: trip.createdAt,
      },
    });

  } catch (error) {
    console.error('Trip creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid trip data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's trips
    const userTrips = await db
      .select({
        id: trips.id,
        title: trips.title,
        destinations: trips.destinations,
        startDate: trips.startDate,
        endDate: trips.endDate,
        tripType: trips.tripType,
        budgetTotal: trips.budgetTotal,
        budgetCurrency: trips.budgetCurrency,
        status: trips.status,
        generationStatus: trips.generationStatus,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      trips: userTrips,
    });

  } catch (error) {
    console.error('Failed to get trips:', error);
    return NextResponse.json(
      { error: 'Failed to get trips' },
      { status: 500 }
    );
  }
}