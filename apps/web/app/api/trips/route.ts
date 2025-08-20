import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips, users, profiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withRateLimit, getUserRateLimit, createRateLimitHeaders, RateLimitError, getClientIP } from "@/lib/rate-limit";
import { cache, CACHE_NAMESPACES, CACHE_TTL } from "@/lib/cache";
import { withTripLimits } from "@/lib/subscription-middleware";
import { trackEvent } from "@/lib/monitoring";

const createTripSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  destinations: z.array(z.object({
    city: z.string().min(1),
    country: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })).min(1).max(5),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tripType: z.enum(["business", "leisure", "adventure", "research"]),
  budgetTotal: z.number().min(0).optional(),
  budgetSplit: z.object({
    transport: z.number().optional(),
    lodging: z.number().optional(),
    food: z.number().optional(),
    activities: z.number().optional(),
  }).optional(),
  preferences: z.object({}).optional(),
});

const listTripsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(["draft", "generating", "planned", "shared", "traveling", "completed"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    return await withTripLimits(
      req,
      async (request) => {
        return await withRateLimit(
          request,
          async () => {
            const { userId } = auth();
            if (!userId) {
              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const body = await request.json();
            const validatedData = createTripSchema.parse(body);

            // Check trip creation rate limit
            const rateLimitResult = await getUserRateLimit("TRIP_CREATION_FREE");
            if (!rateLimitResult.success) {
              return NextResponse.json(
                { 
                  error: "Trip creation limit exceeded",
                  limit: rateLimitResult.total,
                  remaining: rateLimitResult.remaining,
                  resetTime: new Date(rateLimitResult.reset).toISOString(),
                },
                { 
                  status: 429,
                  headers: createRateLimitHeaders(rateLimitResult),
                }
              );
            }

        // Validate dates
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);
        
        if (startDate >= endDate) {
          return NextResponse.json(
            { error: "End date must be after start date" },
            { status: 400 }
          );
        }

        if (startDate < new Date()) {
          return NextResponse.json(
            { error: "Start date cannot be in the past" },
            { status: 400 }
          );
        }

        // Ensure user exists in database
        await db.insert(users).values({
          id: userId,
          email: "", // Will be updated by Clerk webhook
        }).onConflictDoNothing();

        // Generate default title if not provided
        const title = validatedData.title || generateTripTitle(validatedData.destinations, startDate);

            // Create trip in database
            const [newTrip] = await db.insert(trips).values({
              userId,
              title,
              destinations: validatedData.destinations,
              startDate,
              endDate,
              tripType: validatedData.tripType,
              budgetTotal: validatedData.budgetTotal,
              budgetSplit: validatedData.budgetSplit,
              status: "draft",
            }).returning();

            // Track trip creation event
            trackEvent('trip_created', {
              tripId: newTrip.id,
              destinations: validatedData.destinations.length,
              duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
              tripType: validatedData.tripType,
              hasBudget: !!validatedData.budgetTotal,
            }, userId);

            // Invalidate user's trips cache
            await cache.invalidateByTag(`user-trips:${userId}`);

            return NextResponse.json(newTrip, { 
              status: 201,
              headers: createRateLimitHeaders(rateLimitResult),
            });
          },
          {
            userLimit: "API_PER_MINUTE",
            ipLimit: "API_PER_MINUTE",
          }
        );
      }
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { 
          status: 429,
          headers: createRateLimitHeaders(error.result),
        }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    return await withRateLimit(
      req,
      async () => {
        const { userId } = auth();
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const params = listTripsSchema.parse({
          page: searchParams.get("page"),
          limit: searchParams.get("limit"),
          status: searchParams.get("status"),
        });

        // Check cache first
        const cacheKey = `${userId}:${params.page}:${params.limit}:${params.status || "all"}`;
        const cached = await cache.get<any>(CACHE_NAMESPACES.TRIPS, cacheKey);
        
        if (cached) {
          return NextResponse.json(cached);
        }

        // Build query
        const whereConditions = [eq(trips.userId, userId)];
        if (params.status) {
          whereConditions.push(eq(trips.status, params.status));
        }

        const userTrips = await db
          .select()
          .from(trips)
          .where(and(...whereConditions))
          .orderBy(desc(trips.updatedAt))
          .limit(params.limit)
          .offset((params.page - 1) * params.limit);

        // Get total count for pagination
        const totalCount = await db
          .select({ count: trips.id })
          .from(trips)
          .where(and(...whereConditions));

        const result = {
          trips: userTrips,
          pagination: {
            page: params.page,
            limit: params.limit,
            total: totalCount.length,
            pages: Math.ceil(totalCount.length / params.limit),
          },
        };

        // Cache for 1 hour
        await cache.set(CACHE_NAMESPACES.TRIPS, cacheKey, result, {
          ttl: CACHE_TTL.TRIPS,
          tags: [`user-trips:${userId}`],
        });

        return NextResponse.json(result);
      },
      {
        userLimit: "API_PER_MINUTE",
      }
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { 
          status: 429,
          headers: createRateLimitHeaders(error.result),
        }
      );
    }

    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateTripTitle(destinations: Array<{ city: string; country: string }>, startDate: Date): string {
  const month = startDate.toLocaleDateString("en-US", { month: "long" });
  const year = startDate.getFullYear();
  
  if (destinations.length === 1) {
    return `${destinations[0].city} ${month} ${year}`;
  } else if (destinations.length === 2) {
    return `${destinations[0].city} & ${destinations[1].city} ${month} ${year}`;
  } else {
    return `${destinations[0].city} + ${destinations.length - 1} more ${month} ${year}`;
  }
}