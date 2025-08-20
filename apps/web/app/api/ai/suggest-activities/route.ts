import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { withProAccess } from "@/lib/subscription-middleware";
import { trackEvent, trackPerformance } from "@/lib/monitoring";
// Temporarily disabled for deployment
// import { BaseAgent } from "@tripthesia/agents";

// Mock BaseAgent for deployment
class BaseAgent {
  getName() { return "MockAgent"; }
  callAI() { return Promise.resolve({}); }
}

/*
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

*/

export async function POST() {
  return Response.json({ error: 'AI features temporarily unavailable during deployment' }, { status: 503 });
}

/*
export const runtime = 'nodejs';
export const maxDuration = 60;

const suggestActivitiesSchema = z.object({
  location: z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
  weather: z.object({
    condition: z.string(),
    temperature: z.number(),
    precipitation: z.number().optional(),
  }).optional(),
  userPreferences: z.object({
    interests: z.array(z.string()).optional(),
    budget: z.enum(['low', 'medium', 'high']).optional(),
    mobility: z.enum(['walking', 'public_transport', 'car', 'bike']).optional(),
    group_size: z.number().min(1).max(50).optional(),
  }).optional(),
  currentItinerary: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    time: z.string(),
  })).optional(),
  exclude: z.array(z.string()).optional(), // Activity IDs to exclude
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check Pro subscription access
    return await withProAccess(
      request,
      'real_time_activity_suggestions',
      async (req) => {
        const { userId } = getAuth(req);
        
        if (!userId) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const body = await req.json();
        const data = suggestActivitiesSchema.parse(body);

        // Track suggestion request
        trackEvent('activity_suggestions_requested', {
          location: `${data.location.city}, ${data.location.country}`,
          timeOfDay: data.timeOfDay,
          hasWeather: !!data.weather,
          hasPreferences: !!data.userPreferences,
          currentActivities: data.currentItinerary?.length || 0,
        }, userId);

        const suggestions = await generateActivitySuggestions(data, userId);

        // Track performance
        trackPerformance('activity_suggestions_generation', startTime, {
          suggestionsCount: suggestions.length,
          location: data.location.city,
        });

        return NextResponse.json({
          suggestions,
          timestamp: new Date().toISOString(),
          location: data.location,
          timeOfDay: data.timeOfDay,
        });
      }
    );

  } catch (error) {
    console.error('Activity suggestions failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate activity suggestions' },
      { status: 500 }
    );
  }
}

interface ActivitySuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number; // minutes
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  rating: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  openingHours?: {
    opens: string;
    closes: string;
    isOpen: boolean;
  };
  tags: string[];
  weatherSuitable: boolean;
  bookingRequired: boolean;
  website?: string;
  confidence: number; // 0-1 score
}

async function generateActivitySuggestions(
  data: z.infer<typeof suggestActivitiesSchema>,
  userId: string
): Promise<ActivitySuggestion[]> {
  
  // 1. Context building for AI
  const context = buildSuggestionContext(data);
  
  // 2. Generate suggestions using AI
  const aiSuggestions = await getAISuggestions(context, data, userId);
  
  // 3. Enrich with real-time data
  const enrichedSuggestions = await enrichWithRealTimeData(aiSuggestions, data);
  
  // 4. Filter and rank suggestions
  const filteredSuggestions = filterAndRankSuggestions(enrichedSuggestions, data);
  
  return filteredSuggestions;
}

function buildSuggestionContext(data: z.infer<typeof suggestActivitiesSchema>) {
  const location = `${data.location.city}, ${data.location.country}`;
  const preferences = data.userPreferences;
  const currentTime = data.timeOfDay;
  
  let context = `Location: ${location}\nTime of day: ${currentTime}`;
  
  if (data.weather) {
    context += `\nWeather: ${data.weather.condition}, ${data.weather.temperature}°C`;
    if (data.weather.precipitation) {
      context += `, ${data.weather.precipitation}% chance of rain`;
    }
  }
  
  if (preferences?.interests) {
    context += `\nInterests: ${preferences.interests.join(', ')}`;
  }
  
  if (preferences?.budget) {
    context += `\nBudget preference: ${preferences.budget}`;
  }
  
  if (preferences?.mobility) {
    context += `\nTransportation: ${preferences.mobility}`;
  }
  
  if (preferences?.group_size) {
    context += `\nGroup size: ${preferences.group_size}`;
  }
  
  if (data.currentItinerary && data.currentItinerary.length > 0) {
    context += `\nCurrent itinerary: ${data.currentItinerary.map(item => item.name).join(', ')}`;
  }
  
  return context;
}

// ActivitySuggestionAgent using GPT-4o-mini with structured outputs
class ActivitySuggestionAgent extends BaseAgent {
  getName(): string {
    return "ActivitySuggestionAgent";
  }

  async generateSuggestions(
    context: string,
    data: z.infer<typeof suggestActivitiesSchema>
  ): Promise<Partial<ActivitySuggestion>[]> {
    const suggestionTool = {
      name: "generate_activity_suggestions",
      description: "Generate activity suggestions for travelers based on context and preferences",
      parameters: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Activity name" },
                description: { type: "string", description: "Brief description (1-2 sentences)" },
                category: { 
                  type: "string", 
                  enum: ["attraction", "restaurant", "entertainment", "outdoor", "cultural", "shopping", "nightlife"]
                },
                estimatedDuration: { type: "number", description: "Duration in minutes" },
                priceRange: {
                  type: "object",
                  properties: {
                    min: { type: "number" },
                    max: { type: "number" },
                    currency: { type: "string", default: "USD" }
                  },
                  required: ["min", "max", "currency"]
                },
                tags: { type: "array", items: { type: "string" } },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["name", "description", "category", "estimatedDuration", "priceRange", "tags", "confidence"]
            },
            minItems: 4,
            maxItems: 8
          }
        },
        required: ["suggestions"]
      }
    };

    const prompt = `Based on the following context, suggest 6-8 specific activities for travelers:

${context}

Requirements:
- Activities should be appropriate for the time of day and weather
- Include a mix of categories (attractions, dining, entertainment, outdoor, cultural)
- Provide realistic estimated durations and price ranges
- Consider local customs and opening hours
- Prioritize unique, local experiences over generic tourist traps

Use the generate_activity_suggestions function to provide structured suggestions.`;

    try {
      const result = await this.callAI([
        {
          role: "system",
          content: "You are a local travel expert. Use the generate_activity_suggestions function to provide personalized activity recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ], [suggestionTool]);

      if (result && typeof result === 'object' && 'suggestions' in result) {
        return (result as any).suggestions;
      }

      // Fallback if function calling doesn't work
      return getFallbackSuggestions(data);

    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      return getFallbackSuggestions(data);
    }
  }
}

async function getAISuggestions(
  context: string,
  data: z.infer<typeof suggestActivitiesSchema>,
  userId: string
): Promise<Partial<ActivitySuggestion>[]> {
  try {
    // Get user's subscription tier for cost-effective AI usage
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const userTier = userProfile.length > 0 ? userProfile[0].subscriptionTier : "free";

    // Use the new agent system with GPT-4o-mini for 96% cost savings
    const agent = new ActivitySuggestionAgent({ tier: userTier });
    return await agent.generateSuggestions(context, data);
    
  } catch (error) {
    console.error('AI suggestion generation failed:', error);
    return getFallbackSuggestions(data);
  }
}

async function enrichWithRealTimeData(
  suggestions: Partial<ActivitySuggestion>[],
  data: z.infer<typeof suggestActivitiesSchema>
): Promise<ActivitySuggestion[]> {
  
  const enriched: ActivitySuggestion[] = [];
  
  for (const suggestion of suggestions) {
    try {
      // Add required fields with defaults
      const enrichedSuggestion: ActivitySuggestion = {
        id: generateActivityId(suggestion.name || 'unknown'),
        name: suggestion.name || 'Unknown Activity',
        description: suggestion.description || 'No description available',
        category: suggestion.category || 'attraction',
        estimatedDuration: suggestion.estimatedDuration || 120,
        priceRange: suggestion.priceRange || { min: 0, max: 50, currency: 'USD' },
        rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
        location: {
          lat: data.location.lat + (Math.random() - 0.5) * 0.02, // Nearby location
          lng: data.location.lng + (Math.random() - 0.5) * 0.02,
          address: `Near ${data.location.city}`,
        },
        tags: suggestion.tags || ['local'],
        weatherSuitable: checkWeatherSuitability(suggestion.category || 'attraction', data.weather),
        bookingRequired: ['restaurant', 'entertainment'].includes(suggestion.category || ''),
        confidence: suggestion.confidence || 0.8,
      };

      // Add opening hours for relevant categories
      if (['attraction', 'restaurant', 'shopping'].includes(enrichedSuggestion.category)) {
        enrichedSuggestion.openingHours = generateOpeningHours(
          enrichedSuggestion.category,
          data.timeOfDay
        );
      }

      enriched.push(enrichedSuggestion);
      
    } catch (error) {
      console.error('Failed to enrich suggestion:', error);
      // Skip this suggestion if enrichment fails
    }
  }
  
  return enriched;
}

function filterAndRankSuggestions(
  suggestions: ActivitySuggestion[],
  data: z.infer<typeof suggestActivitiesSchema>
): ActivitySuggestion[] {
  
  // Filter out suggestions that don't meet criteria
  const filtered = suggestions.filter(suggestion => {
    // Check if open (if has opening hours)
    if (suggestion.openingHours && !suggestion.openingHours.isOpen) {
      return false;
    }
    
    // Check weather suitability
    if (data.weather && !suggestion.weatherSuitable) {
      return false;
    }
    
    // Check exclusions
    if (data.exclude && data.exclude.includes(suggestion.id)) {
      return false;
    }
    
    return true;
  });
  
  // Sort by confidence score and rating
  filtered.sort((a, b) => {
    const scoreA = a.confidence * 0.7 + (a.rating / 5) * 0.3;
    const scoreB = b.confidence * 0.7 + (b.rating / 5) * 0.3;
    return scoreB - scoreA;
  });
  
  // Return top 6 suggestions
  return filtered.slice(0, 6);
}

function getFallbackSuggestions(
  data: z.infer<typeof suggestActivitiesSchema>
): Partial<ActivitySuggestion>[] {
  const city = data.location.city;
  
  return [
    {
      name: `Explore ${city} City Center`,
      description: `Walk through the historic heart of ${city} and discover local architecture and culture.`,
      category: 'attraction',
      estimatedDuration: 180,
      priceRange: { min: 0, max: 0, currency: 'USD' },
      tags: ['walking', 'free', 'culture'],
      confidence: 0.7,
    },
    {
      name: `Local Restaurant in ${city}`,
      description: `Try authentic local cuisine at a recommended restaurant.`,
      category: 'restaurant',
      estimatedDuration: 90,
      priceRange: { min: 20, max: 60, currency: 'USD' },
      tags: ['dining', 'local'],
      confidence: 0.8,
    },
    {
      name: `${city} Local Market`,
      description: `Browse local markets for fresh produce, crafts, and souvenirs.`,
      category: 'shopping',
      estimatedDuration: 120,
      priceRange: { min: 10, max: 40, currency: 'USD' },
      tags: ['shopping', 'local', 'culture'],
      confidence: 0.6,
    },
  ];
}

function generateActivityId(name: string): string {
  return `activity_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`;
}

function checkWeatherSuitability(category: string, weather?: z.infer<typeof suggestActivitiesSchema>['weather']): boolean {
  if (!weather) return true;
  
  const isRaining = (weather.precipitation || 0) > 30;
  const isCold = weather.temperature < 5;
  
  const outdoorCategories = ['outdoor', 'attraction'];
  
  if (outdoorCategories.includes(category) && (isRaining || isCold)) {
    return false;
  }
  
  return true;
}

function generateOpeningHours(category: string, timeOfDay: string) {
  const currentHour = getCurrentHourByTimeOfDay(timeOfDay);
  
  let opens: string, closes: string;
  
  switch (category) {
    case 'restaurant':
      if (timeOfDay === 'morning') {
        opens = '07:00';
        closes = '22:00';
      } else {
        opens = '11:00';
        closes = '23:00';
      }
      break;
    case 'attraction':
      opens = '09:00';
      closes = '18:00';
      break;
    case 'shopping':
      opens = '10:00';
      closes = '20:00';
      break;
    default:
      opens = '09:00';
      closes = '18:00';
  }
  
  const opensHour = parseInt(opens.split(':')[0]);
  const closesHour = parseInt(closes.split(':')[0]);
  const isOpen = currentHour >= opensHour && currentHour < closesHour;
  
  return {
    opens,
    closes,
    isOpen,
  };
}

function getCurrentHourByTimeOfDay(timeOfDay: string): number {
  switch (timeOfDay) {
    case 'morning': return 9;
    case 'afternoon': return 14;
    case 'evening': return 18;
    case 'night': return 21;
    default: return 12;
  }
}
*/