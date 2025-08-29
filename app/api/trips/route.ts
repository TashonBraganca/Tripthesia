import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { withDatabase, isDatabaseAvailable } from "@/lib/db";
import { trips } from "@/lib/database/schema";
import { getCurrentUserProfile, incrementTripUsage } from "@/lib/auth/profile";
import { canCreateTrip } from "@/lib/subscription/config";
import { eq, desc } from "drizzle-orm";
import { apiRateLimit, tripCreationRateLimit } from "@/lib/security/rate-limit";
import { sanitizeTripData } from "@/lib/security/sanitize";

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
  // Apply rate limiting
  const rateLimitResponse = await tripCreationRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Sanitize input data first
    const sanitizedData = sanitizeTripData(body);
    
    // Then validate with Zod schema
    const tripData = createTripSchema.parse(sanitizedData);

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
          error: 'Trip limit exceeded',
          details: 'Please upgrade your subscription to create more trips'
        },
        { status: 402 }
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

    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable',
          details: 'Database not configured'
        },
        { status: 503 }
      );
    }

    // Create trip using safe database operation
    const result = await withDatabase(async (db) => {
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

      return trip;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    // Increment user's trip usage
    await incrementTripUsage(userId);

    return NextResponse.json({
      success: true,
      trip: {
        id: result.id,
        title: result.title,
        destinations: result.destinations,
        startDate: result.startDate,
        endDate: result.endDate,
        tripType: result.tripType,
        budgetTotal: result.budgetTotal,
        budgetCurrency: result.budgetCurrency,
        status: result.status,
        generationStatus: result.generationStatus,
        createdAt: result.createdAt,
      },
    });

  } catch (error) {
    console.error('Failed to create trip:', error);

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
  // Apply rate limiting
  const rateLimitResponse = await apiRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { 
          success: true, 
          trips: [] // Return empty trips if database not available
        }
      );
    }

    // Get user's trips using safe database operation
    const userTrips = await withDatabase(async (db) => {
      return await db
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
    });

    return NextResponse.json({
      success: true,
      trips: userTrips || [],
    });

  } catch (error) {
    console.error('Failed to get trips:', error);
    return NextResponse.json(
      { error: 'Failed to get trips' },
      { status: 500 }
    );
  }
}