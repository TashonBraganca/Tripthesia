import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips, itineraries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

const reflowSchema = z.object({
  changes: z.object({
    lockedActivities: z.array(z.string()).default([]),
    modifiedActivities: z.array(z.object({
      id: z.string(),
      changes: z.record(z.any()),
    })).default([]),
    removedActivities: z.array(z.string()).default([]),
    addedActivities: z.array(z.object({
      name: z.string(),
      location: z.object({
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        name: z.string(),
      }),
      category: z.string(),
      duration: z.number().default(120),
      dayIndex: z.number(),
    })).default([]),
    budgetConstraints: z.object({
      maxTotal: z.number().optional(),
      maxPerCategory: z.record(z.number()).optional(),
    }).optional(),
    timeConstraints: z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      bufferTime: z.number().default(30), // minutes between activities
    }).optional(),
  }),
  preferences: z.object({
    preserveOrder: z.boolean().default(true),
    optimizeRoute: z.boolean().default(true),
    maintainPace: z.boolean().default(true),
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
    const { success } = await rateLimit(userId, 10, 300); // 10 reflows per 5 minutes
    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }

    // Validate request body
    const body = await request.json();
    const { changes, preferences } = reflowSchema.parse(body);

    // Verify trip ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, params.id), eq(trips.userId, userId)))
      .limit(1);

    if (!trip.length) {
      return new Response("Trip not found", { status: 404 });
    }

    // Get current itinerary
    const currentItinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.tripId, params.id))
      .orderBy(desc(itineraries.version))
      .limit(1);

    if (!currentItinerary.length) {
      return new Response("No itinerary found", { status: 404 });
    }

    const itinerary = currentItinerary[0];

    // Perform reflow logic
    const reflowedItinerary = await performReflow(
      itinerary.data as any,
      changes,
      preferences
    );

    // Save new version
    const newVersion = itinerary.version + 1;
    await db.insert(itineraries).values({
      tripId: params.id,
      version: newVersion,
      data: reflowedItinerary,
      locks: {
        lockedActivities: changes.lockedActivities,
        timestamp: new Date().toISOString(),
      },
    });

    return Response.json({
      success: true,
      data: reflowedItinerary,
      version: newVersion,
      changes: {
        activitiesModified: changes.modifiedActivities.length,
        activitiesRemoved: changes.removedActivities.length,
        activitiesAdded: changes.addedActivities.length,
        locksPreserved: changes.lockedActivities.length,
      },
    });

  } catch (error) {
    console.error("Reflow endpoint error:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function performReflow(
  originalItinerary: any,
  changes: any,
  preferences: any
): Promise<any> {
  const reflowedItinerary = { ...originalItinerary };
  const days = [...reflowedItinerary.days];

  // Step 1: Remove activities that were deleted
  for (const removedId of changes.removedActivities) {
    for (const day of days) {
      day.activities = day.activities.filter((activity: any) => activity.id !== removedId);
    }
  }

  // Step 2: Apply modifications to existing activities
  for (const modification of changes.modifiedActivities) {
    for (const day of days) {
      const activityIndex = day.activities.findIndex((activity: any) => activity.id === modification.id);
      if (activityIndex !== -1) {
        // Don't modify if it's locked
        if (!changes.lockedActivities.includes(modification.id)) {
          day.activities[activityIndex] = {
            ...day.activities[activityIndex],
            ...modification.changes,
          };
        }
      }
    }
  }

  // Step 3: Add new activities
  for (const newActivity of changes.addedActivities) {
    if (days[newActivity.dayIndex]) {
      const activity = {
        id: `reflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newActivity.name,
        description: `Added during reflow`,
        location: {
          name: newActivity.location.name,
          address: newActivity.location.name,
          coordinates: newActivity.location.coordinates,
        },
        duration: newActivity.duration,
        cost: { amount: 0, currency: "USD", priceRange: "unknown" as const },
        category: newActivity.category,
        timeSlot: { start: "09:00", end: "11:00" }, // Will be recalculated
        isLocked: false,
        rating: null,
      };
      
      days[newActivity.dayIndex].activities.push(activity);
    }
  }

  // Step 4: Recalculate time slots and optimize routes
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    
    if (preferences.optimizeRoute) {
      day.activities = optimizeActivitiesRoute(day.activities, changes.lockedActivities);
    }
    
    day.activities = recalculateTimeSlots(
      day.activities, 
      changes.lockedActivities,
      changes.timeConstraints
    );
  }

  // Step 5: Validate budget constraints
  if (changes.budgetConstraints) {
    validateBudgetConstraints(days, changes.budgetConstraints);
  }

  reflowedItinerary.days = days;
  reflowedItinerary.lastReflow = new Date().toISOString();
  reflowedItinerary.reflowCount = (reflowedItinerary.reflowCount || 0) + 1;

  return reflowedItinerary;
}

function optimizeActivitiesRoute(activities: any[], lockedActivities: string[]): any[] {
  // Separate locked and unlocked activities
  const locked = activities.filter(activity => lockedActivities.includes(activity.id));
  const unlocked = activities.filter(activity => !lockedActivities.includes(activity.id));

  // For unlocked activities, optimize based on geographical proximity
  // This is a simplified optimization - in production, use proper TSP algorithms
  if (unlocked.length <= 1) {
    return activities;
  }

  let optimized = [...locked];
  let remaining = [...unlocked];

  // If we have locked activities, use them as anchor points
  if (locked.length > 0) {
    // Insert unlocked activities in optimal positions relative to locked ones
    for (const activity of remaining) {
      let bestPosition = 0;
      let minDistance = Infinity;

      // Find the best position to insert this activity
      for (let i = 0; i <= optimized.length; i++) {
        const distance = calculateInsertionDistance(optimized, activity, i);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i;
        }
      }

      optimized.splice(bestPosition, 0, activity);
    }
  } else {
    // No locked activities, optimize all activities
    optimized = optimizeByDistance(unlocked);
  }

  return optimized;
}

function calculateInsertionDistance(activities: any[], newActivity: any, position: number): number {
  if (activities.length === 0) return 0;

  const { lat: newLat, lng: newLng } = newActivity.location.coordinates;
  let totalDistance = 0;

  // Calculate distance to previous activity
  if (position > 0) {
    const prev = activities[position - 1];
    totalDistance += getDistance(
      prev.location.coordinates.lat,
      prev.location.coordinates.lng,
      newLat,
      newLng
    );
  }

  // Calculate distance to next activity
  if (position < activities.length) {
    const next = activities[position];
    totalDistance += getDistance(
      newLat,
      newLng,
      next.location.coordinates.lat,
      next.location.coordinates.lng
    );
  }

  return totalDistance;
}

function optimizeByDistance(activities: any[]): any[] {
  if (activities.length <= 2) return activities;

  // Simple nearest neighbor algorithm
  const optimized = [activities[0]];
  const remaining = activities.slice(1);

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = getDistance(
        current.location.coordinates.lat,
        current.location.coordinates.lng,
        remaining[i].location.coordinates.lat,
        remaining[i].location.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }

  return optimized;
}

function recalculateTimeSlots(
  activities: any[], 
  lockedActivities: string[],
  timeConstraints?: any
): any[] {
  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

  if (timeConstraints?.startTime) {
    const [hours, minutes] = timeConstraints.startTime.split(':').map(Number);
    currentTime.setHours(hours, minutes, 0, 0);
  }

  const bufferTime = timeConstraints?.bufferTime || 30; // minutes

  for (const activity of activities) {
    // Skip locked activities - they keep their existing time slots
    if (lockedActivities.includes(activity.id)) {
      // Update currentTime to be after this locked activity
      const [hours, minutes] = activity.timeSlot.end.split(':').map(Number);
      const activityEndTime = new Date(currentTime);
      activityEndTime.setHours(hours, minutes, 0, 0);
      
      if (activityEndTime > currentTime) {
        currentTime = new Date(activityEndTime.getTime() + bufferTime * 60000);
      }
      continue;
    }

    // Calculate new time slot for unlocked activities
    const startTime = new Date(currentTime);
    const endTime = new Date(startTime.getTime() + activity.duration * 60000);

    activity.timeSlot = {
      start: formatTime(startTime),
      end: formatTime(endTime),
    };

    // Move to next time slot with buffer
    currentTime = new Date(endTime.getTime() + bufferTime * 60000);
  }

  return activities;
}

function validateBudgetConstraints(days: any[], budgetConstraints: any): boolean {
  const totalCost = days.reduce((total, day) => 
    total + day.activities.reduce((dayTotal: number, activity: any) => 
      dayTotal + (activity.cost?.amount || 0), 0
    ), 0
  );

  if (budgetConstraints.maxTotal && totalCost > budgetConstraints.maxTotal) {
    throw new Error(`Budget constraint violated: ${totalCost} exceeds maximum ${budgetConstraints.maxTotal}`);
  }

  // Check category-specific budgets
  if (budgetConstraints.maxPerCategory) {
    const categoryTotals: Record<string, number> = {};
    
    for (const day of days) {
      for (const activity of day.activities) {
        const category = activity.category;
        const cost = activity.cost?.amount || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + cost;
      }
    }

    for (const [category, maxAmount] of Object.entries(budgetConstraints.maxPerCategory)) {
      if (categoryTotals[category] > maxAmount) {
        throw new Error(`Budget constraint violated for ${category}: ${categoryTotals[category]} exceeds maximum ${maxAmount}`);
      }
    }
  }

  return true;
}

// Utility functions
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}