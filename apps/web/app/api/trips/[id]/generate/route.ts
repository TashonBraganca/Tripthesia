import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips, itineraries, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
// Temporarily disabled for deployment
// import { TripPlannerAgent } from "@tripthesia/agents/src/planner";

export async function POST() {
  return Response.json({ error: 'Trip generation temporarily unavailable during deployment' }, { status: 503 });
}

/*
import { trackTripGeneration } from "@/lib/monitoring";

const generateSchema = z.object({
  preferences: z.object({
    regenerateAll: z.boolean().default(false),
    focusAreas: z.array(z.string()).default([]),
    constraints: z.object({
      maxBudget: z.number().optional(),
      pace: z.enum(["relaxed", "moderate", "packed"]).default("moderate"),
      interests: z.array(z.string()).default([]),
    }).optional(),
  }).default({}),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Rate limiting
    const { success } = await rateLimit(userId, 5, 300); // 5 requests per 5 minutes
    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }

    // Validate request body
    const body = await request.json();
    const { preferences } = generateSchema.parse(body);

    // Verify trip ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, params.id), eq(trips.userId, userId)))
      .limit(1);

    if (!trip.length) {
      return new Response("Trip not found", { status: 404 });
    }

    const tripData = trip[0];

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        const data = encoder.encode(
          `data: ${JSON.stringify({ 
            type: "connected", 
            message: "Generation started",
            timestamp: new Date().toISOString()
          })}\n\n`
        );
        controller.enqueue(data);

        // Start the trip generation process
        generateTripItinerary(controller, encoder, tripData, preferences);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });

  } catch (error) {
    console.error("Generation endpoint error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

async function generateTripItinerary(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  tripData: any,
  preferences: any
) {
  const userId = tripData.userId;
  
  try {
    // Track generation start
    trackTripGeneration("started", tripData.id, userId);

    // Phase 1: Initialize and prepare
    sendUpdate(controller, encoder, {
      type: "phase",
      phase: "initialize",
      message: "Preparing trip generation...",
      progress: 10
    });

    // Get user's subscription tier from profile
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const userTier = userProfile.length > 0 ? userProfile[0].subscriptionTier : "free";
    
    // Initialize the AI planner agent with subscription-aware tier
    // Note: All tiers now use GPT-4o-mini for 96% cost savings!
    const planner = new TripPlannerAgent({ 
      tier: userTier, // Use user's actual subscription tier
      timeout: 60000 // 60 second timeout
    });

    // Phase 2: Prepare input for AI agent
    sendUpdate(controller, encoder, {
      type: "phase",
      phase: "prepare",
      message: "Analyzing trip requirements...",
      progress: 20
    });

    const plannerInput = {
      destinations: tripData.destinations,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      tripType: tripData.tripType || "mixed",
      budget: tripData.budgetTotal || 1000,
      pace: preferences.constraints?.pace || "moderate",
      mobility: "walk", // Default mobility
      preferences: {
        cuisine: preferences.constraints?.interests?.filter(i => 
          ["italian", "asian", "french", "local", "vegetarian"].includes(i.toLowerCase())
        ) || [],
        mustVisit: preferences.focusAreas || [],
        avoid: []
      }
    };

    // Phase 3: Generate itinerary with AI
    sendUpdate(controller, encoder, {
      type: "phase",
      phase: "ai_generation",
      message: "AI is crafting your perfect itinerary...",
      progress: 35
    });

    const itinerary = await planner.generateItinerary(plannerInput);

    // Phase 4: Process and enhance results
    sendUpdate(controller, encoder, {
      type: "phase",
      phase: "enhancing",
      message: "Enhancing with real-time data...",
      progress: 70
    });

    // Convert to our expected format
    const formattedItinerary = {
      tripId: tripData.id,
      days: itinerary.days.map(day => ({
        date: day.date,
        activities: day.items.map(item => ({
          id: item.id,
          name: item.place.name,
          description: `Experience ${item.place.name} - a ${item.place.category} destination`,
          location: {
            name: item.place.name,
            address: `${item.place.category} location`,
            coordinates: {
              lat: item.place.lat,
              lng: item.place.lng
            }
          },
          duration: Math.floor((new Date(item.end).getTime() - new Date(item.start).getTime()) / 1000 / 60),
          cost: {
            amount: item.priceEstimate || 25,
            currency: "USD",
            priceRange: item.priceEstimate > 50 ? "expensive" : item.priceEstimate > 20 ? "moderate" : "budget"
          },
          category: item.kind.charAt(0).toUpperCase() + item.kind.slice(1),
          timeSlot: {
            start: new Date(item.start).toTimeString().slice(0, 5),
            end: new Date(item.end).toTimeString().slice(0, 5)
          },
          isLocked: item.locked,
          rating: 4.0 + Math.random() * 1.0 // Generate random rating for now
        }))
      })),
      summary: itinerary.summary,
      currency: itinerary.currency,
      generatedAt: new Date().toISOString(),
      version: 1
    };

    // Phase 5: Save to database
    sendUpdate(controller, encoder, {
      type: "phase",
      phase: "saving",
      message: "Saving your itinerary...",
      progress: 90
    });

    await db.insert(itineraries).values({
      tripId: tripData.id,
      version: 1,
      data: formattedItinerary,
      locks: {},
    });

    // Send completion
    sendUpdate(controller, encoder, {
      type: "completed",
      message: "Trip generation completed!",
      progress: 100,
      data: formattedItinerary
    });

    // Track successful generation
    trackTripGeneration("completed", tripData.id, userId, {
      daysCount: formattedItinerary.days.length,
      activitiesCount: formattedItinerary.days.reduce((sum, day) => sum + day.activities.length, 0)
    });

    // Close the stream
    controller.close();

  } catch (error) {
    console.error("Generation error:", error);
    
    // Track failed generation
    trackTripGeneration("failed", tripData.id, userId, {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    
    sendUpdate(controller, encoder, {
      type: "error",
      message: "Failed to generate trip",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    controller.close();
  }
}

function sendUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: any
) {
  const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  controller.enqueue(message);
}

function generateMockItinerary(tripData: any) {
  // Mock itinerary generation - in real implementation, this would use the AI agents
  const startDate = new Date(tripData.startDate);
  const endDate = new Date(tripData.endDate);
  const days = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push({
      date: currentDate.toISOString().split('T')[0],
      activities: [
        {
          id: `${currentDate.getTime()}-1`,
          name: "Morning Activity",
          description: "Start your day with something amazing",
          location: {
            name: "City Center",
            address: "Downtown Area",
            coordinates: { 
              lat: 48.8566 + Math.random() * 0.01, 
              lng: 2.3522 + Math.random() * 0.01 
            }
          },
          duration: 120,
          cost: { amount: 25, currency: "USD", priceRange: "moderate" as const },
          category: "Sightseeing",
          timeSlot: { start: "09:00", end: "11:00" },
          isLocked: false,
          rating: 4.5
        },
        {
          id: `${currentDate.getTime()}-2`,
          name: "Lunch Break",
          description: "Enjoy local cuisine",
          location: {
            name: "Local Restaurant",
            address: "Restaurant District",
            coordinates: { 
              lat: 48.8566 + Math.random() * 0.01, 
              lng: 2.3522 + Math.random() * 0.01 
            }
          },
          duration: 90,
          cost: { amount: 35, currency: "USD", priceRange: "moderate" as const },
          category: "Food",
          timeSlot: { start: "12:00", end: "13:30" },
          isLocked: false,
          rating: 4.2
        },
        {
          id: `${currentDate.getTime()}-3`,
          name: "Afternoon Exploration",
          description: "Discover hidden gems",
          location: {
            name: "Cultural District",
            address: "Arts Quarter",
            coordinates: { 
              lat: 48.8566 + Math.random() * 0.01, 
              lng: 2.3522 + Math.random() * 0.01 
            }
          },
          duration: 180,
          cost: { amount: 15, currency: "USD", priceRange: "budget" as const },
          category: "Cultural",
          timeSlot: { start: "14:30", end: "17:30" },
          isLocked: false,
          rating: 4.7
        }
      ]
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    tripId: tripData.id,
    days,
    summary: `Amazing ${days.length}-day trip to ${tripData.destinations[0]?.city || 'your destination'}`,
    currency: "USD",
    generatedAt: new Date().toISOString(),
    version: 1
  };
}
*/