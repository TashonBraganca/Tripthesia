import { z } from "zod";
import { BaseAgent } from "./base-agent";
import { Itinerary, DayPlan, ActivityItem } from "./validation";
import { searchPlaces } from "./tools/places";
import { getRouteInfo } from "./tools/route";
import { getWeather } from "./tools/weather";

export const plannerInputSchema = z.object({
  destinations: z.array(z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
  })),
  startDate: z.string(),
  endDate: z.string(),
  tripType: z.enum(["business", "trek", "research", "mixed"]),
  budget: z.number(),
  pace: z.enum(["chill", "standard", "packed"]),
  mobility: z.enum(["walk", "public", "car"]),
  preferences: z.object({
    cuisine: z.array(z.string()).optional(),
    mustVisit: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
  }).optional(),
});

export type PlannerInput = z.infer<typeof plannerInputSchema>;

export class TripPlannerAgent extends BaseAgent {
  getName(): string {
    return "TripPlannerAgent";
  }

  async generateItinerary(input: PlannerInput): Promise<Itinerary> {
    // Validate input
    const validatedInput = this.validateInput(input, plannerInputSchema);
    
    // Calculate trip duration and daily structure
    const startDate = new Date(validatedInput.startDate);
    const endDate = new Date(validatedInput.endDate);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get activities per day based on pace
    const activitiesPerDay = this.getActivitiesPerDay(validatedInput.pace);
    
    // Generate day plans
    const days: DayPlan[] = [];
    
    for (let dayIndex = 0; dayIndex < durationDays; dayIndex++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayIndex);
      
      const dayPlan = await this.generateDayPlan(
        validatedInput,
        currentDate,
        dayIndex,
        activitiesPerDay
      );
      
      days.push(dayPlan);
    }
    
    // Generate summary
    const summary = await this.generateTripSummary(validatedInput, days);
    
    return {
      tripId: `trip_${Date.now()}`,
      days,
      summary,
      currency: "USD",
    };
  }

  private async generateDayPlan(
    input: PlannerInput,
    date: Date,
    dayIndex: number,
    activitiesPerDay: number
  ): Promise<DayPlan> {
    const destination = input.destinations[0]; // For MVP, handle single destination
    
    // Define activity categories based on trip type
    const categories = this.getCategoriesForTripType(input.tripType);
    
    // Search for places
    const places = await searchPlaces({
      query: this.getSearchQuery(input.tripType, dayIndex),
      lat: destination.lat,
      lng: destination.lng,
      radius: this.getSearchRadius(input.mobility),
      categories,
      limit: activitiesPerDay * 3, // Get more options to choose from
    });

    // Use AI to select and schedule activities
    const selectedActivities = await this.selectAndScheduleActivities(
      places.places,
      input,
      date,
      activitiesPerDay
    );

    // Calculate budget for this day
    const dailyBudget = Math.round(input.budget / input.destinations.length / Math.max(1, date.getDate() - 1));

    return {
      date: date.toISOString().split('T')[0],
      items: selectedActivities,
      notes: `Day ${dayIndex + 1} in ${destination.city}`,
      totalBudget: dailyBudget,
    };
  }

  private async selectAndScheduleActivities(
    places: any[],
    input: PlannerInput,
    date: Date,
    maxActivities: number
  ): Promise<ActivityItem[]> {
    if (places.length === 0) return [];

    // Use structured function calling for better results with GPT-4o-mini
    const activitySelectionTool = {
      name: "select_and_schedule_activities",
      description: "Select and schedule activities for a travel day based on available places and constraints",
      parameters: {
        type: "object",
        properties: {
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique identifier for the activity" },
                place: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    category: { type: "string" },
                    lat: { type: "number" },
                    lng: { type: "number" },
                    source: { type: "string" }
                  },
                  required: ["id", "name", "category", "lat", "lng", "source"]
                },
                start: { type: "string", description: "ISO datetime string" },
                end: { type: "string", description: "ISO datetime string" },
                kind: { 
                  type: "string", 
                  enum: ["sight", "food", "bar", "nature", "business", "lodging", "transfer"] 
                },
                locked: { type: "boolean", default: false },
                priceEstimate: { type: "number", nullable: true }
              },
              required: ["id", "place", "start", "end", "kind", "locked", "priceEstimate"]
            },
            maxItems: maxActivities
          }
        },
        required: ["activities"]
      }
    };

    const prompt = this.createActivitySelectionPrompt(places, input, date, maxActivities);
    
    try {
      const result = await this.callAI([
        {
          role: "system",
          content: "You are a travel planning expert. Use the select_and_schedule_activities function to plan optimal activities for the day. Always call the function with structured data."
        },
        {
          role: "user", 
          content: prompt
        }
      ], [activitySelectionTool]);

      // Handle tool calling result properly
      if (result && typeof result === 'object' && 'activities' in result) {
        const activities = (result as any).activities;
        if (Array.isArray(activities)) {
          return activities.slice(0, maxActivities).map(activity => ({
            id: activity.id || `activity_${Date.now()}_${Math.random()}`,
            place: {
              id: activity.place?.id || `place_${Date.now()}`,
              name: activity.place?.name || 'Unknown Place',
              category: activity.place?.category || 'sight',
              lat: activity.place?.lat || input.destinations[0].lat,
              lng: activity.place?.lng || input.destinations[0].lng,
              source: activity.place?.source || 'ai_generated'
            },
            start: activity.start || date.toISOString(),
            end: activity.end || new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            kind: activity.kind || 'sight',
            locked: activity.locked || false,
            priceEstimate: activity.priceEstimate || 20
          }));
        }
      }

      // Fallback: try to parse as ActivityItem array
      if (Array.isArray(result)) {
        return result.slice(0, maxActivities);
      }

      console.warn("Unexpected activity selection result format, using fallback");
      return this.generateFallbackActivities(places, input, date, maxActivities);

    } catch (error) {
      console.error("Activity selection failed:", error);
      return this.generateFallbackActivities(places, input, date, maxActivities);
    }
  }

  private createActivitySelectionPrompt(
    places: any[],
    input: PlannerInput,
    date: Date,
    maxActivities: number
  ): string {
    const placesText = places.map((place, index) => 
      `${index + 1}. ${place.name} (${place.category}) - Rating: ${place.rating || 'N/A'}`
    ).join('\n');

    return `
Select and schedule ${maxActivities} activities for ${date.toDateString()} from these places:

${placesText}

Trip preferences:
- Type: ${input.tripType}
- Pace: ${input.pace}
- Mobility: ${input.mobility}
- Budget: $${input.budget}
- Must visit: ${input.preferences?.mustVisit?.join(', ') || 'None'}
- Avoid: ${input.preferences?.avoid?.join(', ') || 'None'}

Requirements:
1. Create realistic start/end times (9 AM - 6 PM range)
2. Allow travel time between activities
3. Balance different activity types
4. Respect opening hours and logistics
5. Match the trip type and pace

Return a JSON array of activities with this structure:
{
  "id": "unique_id",
  "place": {
    "id": "place_id",
    "name": "place_name", 
    "category": "category",
    "lat": number,
    "lng": number,
    "source": "source"
  },
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T11:00:00Z", 
  "kind": "sight|food|bar|nature|business|lodging|transfer",
  "locked": false,
  "priceEstimate": 25
}
`;
  }

  private async generateTripSummary(input: PlannerInput, days: DayPlan[]): Promise<string> {
    const summaryTool = {
      name: "generate_trip_summary",
      description: "Generate an engaging trip summary",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "A compelling 2-3 sentence trip summary that highlights what makes this trip special"
          }
        },
        required: ["summary"]
      }
    };

    const context = {
      destination: `${input.destinations[0].city}, ${input.destinations[0].country}`,
      tripType: input.tripType,
      pace: input.pace,
      daysCount: days.length,
      totalActivities: days.reduce((sum, day) => sum + day.items.length, 0),
      sampleActivities: days.flatMap(day => 
        day.items.map(item => item.place.name)
      ).slice(0, 5).join(', '),
    };

    const result = await this.callAI([
      {
        role: "system",
        content: "You are a travel writer. Use the generate_trip_summary function to create engaging trip summaries."
      },
      {
        role: "user",
        content: `Create a summary for: ${JSON.stringify(context)}`
      }
    ], [summaryTool]);

    if (result && typeof result === 'object' && 'summary' in result) {
      return (result as any).summary;
    }

    // Fallback summary
    return `Experience ${days.length} amazing days in ${input.destinations[0].city} with ${days.reduce((sum, day) => sum + day.items.length, 0)} carefully curated activities. This ${input.tripType} trip offers the perfect ${input.pace} pace for an unforgettable journey.`;
  }

  private generateFallbackActivities(
    places: any[],
    input: PlannerInput,
    date: Date,
    maxActivities: number
  ): ActivityItem[] {
    // Generate basic activities from available places
    const activities: ActivityItem[] = [];
    const startHour = 9; // 9 AM start
    
    for (let i = 0; i < Math.min(maxActivities, places.length); i++) {
      const place = places[i];
      const startTime = new Date(date);
      startTime.setHours(startHour + (i * 2), 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2); // 2 hour duration
      
      activities.push({
        id: `fallback_${Date.now()}_${i}`,
        place: {
          id: place.id || `place_${i}`,
          name: place.name || `Activity ${i + 1}`,
          category: place.category || "sight",
          lat: place.lat || input.destinations[0].lat,
          lng: place.lng || input.destinations[0].lng,
          source: place.source || "fallback"
        },
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        kind: this.mapCategoryToKind(place.category || "sight"),
        locked: false,
        priceEstimate: this.estimatePrice(place.category || "sight")
      });
    }
    
    return activities;
  }

  private mapCategoryToKind(category: string): "sight" | "food" | "bar" | "nature" | "business" | "lodging" | "transfer" {
    const mapping: Record<string, "sight" | "food" | "bar" | "nature" | "business" | "lodging" | "transfer"> = {
      restaurant: "food",
      bar: "bar", 
      nature: "nature",
      outdoor: "nature",
      business: "business",
      hotel: "lodging",
      lodging: "lodging"
    };
    
    return mapping[category.toLowerCase()] || "sight";
  }

  private estimatePrice(category: string): number {
    const prices: Record<string, number> = {
      food: 25,
      restaurant: 35,
      bar: 15,
      nature: 0,
      outdoor: 0,
      business: 0,
      lodging: 100,
      sight: 15
    };
    
    return prices[category.toLowerCase()] || 20;
  }

  private getActivitiesPerDay(pace: string): number {
    switch (pace) {
      case "chill": return 3;
      case "standard": return 4;
      case "packed": return 6;
      default: return 4;
    }
  }

  private getCategoriesForTripType(tripType: string): string[] {
    switch (tripType) {
      case "business":
        return ["business", "food", "lodging"];
      case "trek":
        return ["nature", "outdoor", "food"];
      case "research":
        return ["museum", "library", "educational", "food"];
      case "mixed":
        return ["sight", "food", "nature", "entertainment"];
      default:
        return ["sight", "food"];
    }
  }

  private getSearchQuery(tripType: string, dayIndex: number): string {
    const queries = {
      business: ["conference center", "business district", "hotels", "restaurants"],
      trek: ["hiking", "nature", "outdoor activities", "scenic spots"], 
      research: ["museums", "libraries", "universities", "cultural sites"],
      mixed: ["attractions", "restaurants", "entertainment", "landmarks"]
    };
    
    const typeQueries = queries[tripType] || queries.mixed;
    return typeQueries[dayIndex % typeQueries.length];
  }

  private getSearchRadius(mobility: string): number {
    switch (mobility) {
      case "walk": return 2000; // 2km
      case "public": return 10000; // 10km  
      case "car": return 25000; // 25km
      default: return 5000; // 5km
    }
  }
}

// Legacy export for backward compatibility - now uses cost-effective free tier by default
export async function generateItinerary(input: PlannerInput, tier: "free" | "pro" | "enterprise" = "free"): Promise<Itinerary> {
  const planner = new TripPlannerAgent({ tier });
  return planner.generateItinerary(input);
}