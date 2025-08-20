/**
 * Smart Trip Assistant powered by GPT-4o-mini
 * Provides intelligent recommendations, learns from user preferences, and optimizes travel plans
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { GooglePlacesService, ReviewAnalysisService } from './google-apis';
import { ReviewAggregationService } from './review-aggregation';
import { RegionalAPIService } from './region-dependent-apis';
import { KiwiFlightService, TransportOptimizationService } from './transport-apis-enhanced';

// Initialize OpenAI with GPT-4o-mini
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

// User preference schema
const UserPreferencesSchema = z.object({
  travel_style: z.enum(['budget', 'mid_range', 'luxury', 'backpacker', 'business', 'family', 'romantic', 'adventure']),
  interests: z.array(z.enum([
    'culture', 'history', 'food', 'nightlife', 'nature', 'adventure', 'relaxation', 
    'shopping', 'photography', 'art', 'music', 'sports', 'wellness', 'spirituality'
  ])),
  budget_range: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string()
  }),
  accommodation_preferences: z.object({
    type: z.enum(['hotel', 'hostel', 'apartment', 'resort', 'boutique', 'any']),
    amenities: z.array(z.string()),
    location_priority: z.enum(['city_center', 'beach', 'mountains', 'quiet', 'transport_hub'])
  }),
  transport_preferences: z.object({
    comfort_level: z.enum(['basic', 'standard', 'premium', 'luxury']),
    eco_conscious: z.boolean(),
    direct_flights_only: z.boolean(),
    preferred_airlines: z.array(z.string())
  }),
  dining_preferences: z.object({
    cuisine_types: z.array(z.string()),
    dietary_restrictions: z.array(z.string()),
    price_range: z.enum(['budget', 'mid_range', 'fine_dining', 'any'])
  }),
  activity_preferences: z.object({
    pace: z.enum(['relaxed', 'moderate', 'packed']),
    group_activities: z.boolean(),
    cultural_immersion: z.boolean(),
    physical_activity_level: z.enum(['low', 'moderate', 'high'])
  }),
  accessibility_needs: z.array(z.string()).optional(),
  language_preferences: z.array(z.string()).optional()
});

const TripRecommendationSchema = z.object({
  destination_analysis: z.object({
    destination: z.string(),
    best_time_to_visit: z.string(),
    weather_overview: z.string(),
    cultural_highlights: z.array(z.string()),
    local_insights: z.array(z.string()),
    hidden_gems: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      why_special: z.string()
    }))
  }),
  accommodation_recommendations: z.array(z.object({
    name: z.string(),
    type: z.string(),
    location: z.string(),
    price_range: z.string(),
    why_recommended: z.string(),
    match_score: z.number(),
    booking_urgency: z.enum(['low', 'medium', 'high'])
  })),
  transport_optimization: z.object({
    recommended_route: z.string(),
    alternative_routes: z.array(z.string()),
    cost_saving_tips: z.array(z.string()),
    booking_timing: z.string(),
    seasonal_considerations: z.array(z.string())
  }),
  dining_recommendations: z.array(z.object({
    name: z.string(),
    cuisine: z.string(),
    price_category: z.string(),
    specialties: z.array(z.string()),
    experience_type: z.string(),
    reservation_needed: z.boolean(),
    match_score: z.number()
  })),
  activity_itinerary: z.array(z.object({
    day: z.number(),
    theme: z.string(),
    activities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      duration: z.string(),
      cost_estimate: z.string(),
      booking_required: z.boolean(),
      weather_dependent: z.boolean(),
      description: z.string()
    })),
    logistics: z.object({
      transport_needs: z.string(),
      timing_notes: z.string(),
      backup_plans: z.array(z.string())
    })
  })),
  budget_optimization: z.object({
    estimated_total: z.object({
      accommodation: z.number(),
      transport: z.number(),
      food: z.number(),
      activities: z.number(),
      miscellaneous: z.number(),
      total: z.number()
    }),
    saving_opportunities: z.array(z.object({
      category: z.string(),
      suggestion: z.string(),
      potential_savings: z.number()
    })),
    peak_vs_offpeak: z.object({
      current_season: z.string(),
      price_difference: z.string(),
      recommendations: z.array(z.string())
    })
  }),
  personalized_tips: z.array(z.object({
    category: z.string(),
    tip: z.string(),
    confidence: z.number()
  })),
  risk_assessment: z.object({
    safety_level: z.enum(['low', 'moderate', 'high']),
    health_considerations: z.array(z.string()),
    weather_risks: z.array(z.string()),
    travel_advisories: z.array(z.string())
  }),
  ai_confidence_score: z.number().min(0).max(100)
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type TripRecommendation = z.infer<typeof TripRecommendationSchema>;

/**
 * Smart Trip Assistant Service
 */
export class SmartTripAssistant {
  
  /**
   * Generate comprehensive trip recommendations
   */
  static async generateRecommendations(params: {
    destination: string;
    travel_dates: {
      start: Date;
      end: Date;
    };
    travelers: {
      adults: number;
      children: number;
    };
    user_preferences: UserPreferences;
    user_history?: any[];
  }): Promise<TripRecommendation> {
    
    const { destination, travel_dates, travelers, user_preferences } = params;
    
    try {
      // Gather comprehensive data about the destination
      const [destinationData, googlePlaces, flightOptions] = await Promise.all([
        RegionalAPIService.getDestinationData(destination),
        this.getDestinationPlaces(destination),
        this.getTransportOptions(destination, travel_dates, travelers)
      ]);

      // Generate AI-powered recommendations
      const recommendations = await this.generateAIRecommendations(
        destination,
        travel_dates,
        travelers,
        user_preferences,
        destinationData,
        googlePlaces,
        flightOptions
      );

      return TripRecommendationSchema.parse(recommendations);

    } catch (error) {
      console.error('Smart trip assistant error:', error);
      return this.generateFallbackRecommendations(params);
    }
  }

  /**
   * Get relevant places for the destination
   */
  private static async getDestinationPlaces(destination: string) {
    const [hotels, restaurants, attractions] = await Promise.all([
      GooglePlacesService.searchPlaces({
        query: `hotels in ${destination}`,
        type: 'lodging',
        minRating: 3.5
      }),
      GooglePlacesService.searchPlaces({
        query: `restaurants in ${destination}`,
        type: 'restaurant',
        minRating: 4.0
      }),
      GooglePlacesService.searchPlaces({
        query: `attractions in ${destination}`,
        type: 'tourist_attraction',
        minRating: 4.0
      })
    ]);

    return { hotels, restaurants, attractions };
  }

  /**
   * Get transport options for the destination
   */
  private static async getTransportOptions(destination: string, dates: any, travelers: any) {
    try {
      // This would typically get user's location or common departure points
      const commonDepartures = ['New York', 'London', 'Mumbai', 'Delhi'];
      
      const flightSearches = await Promise.all(
        commonDepartures.map(departure => 
          KiwiFlightService.searchFlights({
            from: departure,
            to: destination,
            departureDate: dates.start,
            returnDate: dates.end,
            passengers: travelers.adults + travelers.children,
            sortBy: 'price'
          }).catch(() => [])
        )
      );

      return flightSearches.flat().slice(0, 10);
    } catch (error) {
      console.error('Transport options error:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered recommendations using GPT-4o-mini
   */
  private static async generateAIRecommendations(
    destination: string,
    travel_dates: any,
    travelers: any,
    preferences: UserPreferences,
    destinationData: any,
    places: any,
    transport: any[]
  ) {
    const tripDuration = Math.ceil(
      (travel_dates.end.getTime() - travel_dates.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `You are an expert AI travel advisor. Create a comprehensive, personalized travel recommendation for:

DESTINATION: ${destination}
DATES: ${travel_dates.start.toISOString().split('T')[0]} to ${travel_dates.end.toISOString().split('T')[0]} (${tripDuration} days)
TRAVELERS: ${travelers.adults} adults, ${travelers.children} children
BUDGET: $${preferences.budget_range.min}-${preferences.budget_range.max} ${preferences.budget_range.currency}
TRAVEL STYLE: ${preferences.travel_style}
INTERESTS: ${preferences.interests.join(', ')}

AVAILABLE DATA:
Region Info: ${JSON.stringify(destinationData.region, null, 2)}
Hotels Found: ${places.hotels.length} options
Restaurants Found: ${places.restaurants.length} options  
Attractions Found: ${places.attractions.length} options
Flight Options: ${transport.length} flights available

USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

Generate a comprehensive recommendation as JSON following this exact structure:
{
  "destination_analysis": {
    "destination": "${destination}",
    "best_time_to_visit": "specific advice for travel dates",
    "weather_overview": "weather conditions during travel period", 
    "cultural_highlights": ["key cultural aspects to experience"],
    "local_insights": ["insider tips and local knowledge"],
    "hidden_gems": [
      {
        "name": "specific location name",
        "type": "category",
        "description": "detailed description",
        "why_special": "what makes it unique"
      }
    ]
  },
  "accommodation_recommendations": [
    {
      "name": "specific hotel/accommodation name",
      "type": "hotel/resort/boutique etc",
      "location": "area/neighborhood",
      "price_range": "$X-Y per night",
      "why_recommended": "why it matches user preferences",
      "match_score": 85,
      "booking_urgency": "medium"
    }
  ],
  "transport_optimization": {
    "recommended_route": "best flight/transport option",
    "alternative_routes": ["backup options"],
    "cost_saving_tips": ["specific money-saving advice"],
    "booking_timing": "when to book for best prices",
    "seasonal_considerations": ["timing-related advice"]
  },
  "dining_recommendations": [
    {
      "name": "specific restaurant name",
      "cuisine": "cuisine type",
      "price_category": "budget/mid-range/upscale",
      "specialties": ["signature dishes"],
      "experience_type": "casual/fine dining/street food etc",
      "reservation_needed": true/false,
      "match_score": 90
    }
  ],
  "activity_itinerary": [
    {
      "day": 1,
      "theme": "day theme",
      "activities": [
        {
          "name": "specific activity name",
          "type": "sightseeing/adventure/cultural etc",
          "duration": "2-3 hours",
          "cost_estimate": "$X-Y per person",
          "booking_required": true/false,
          "weather_dependent": true/false,
          "description": "what to expect"
        }
      ],
      "logistics": {
        "transport_needs": "how to get around",
        "timing_notes": "scheduling advice",
        "backup_plans": ["alternative activities"]
      }
    }
  ],
  "budget_optimization": {
    "estimated_total": {
      "accommodation": ${Math.round(preferences.budget_range.max * 0.4)},
      "transport": ${Math.round(preferences.budget_range.max * 0.25)},
      "food": ${Math.round(preferences.budget_range.max * 0.2)},
      "activities": ${Math.round(preferences.budget_range.max * 0.1)},
      "miscellaneous": ${Math.round(preferences.budget_range.max * 0.05)},
      "total": ${preferences.budget_range.max}
    },
    "saving_opportunities": [
      {
        "category": "specific category",
        "suggestion": "actionable advice",
        "potential_savings": 100
      }
    ],
    "peak_vs_offpeak": {
      "current_season": "peak/shoulder/off-peak",
      "price_difference": "X% more/less expensive",
      "recommendations": ["timing suggestions"]
    }
  },
  "personalized_tips": [
    {
      "category": "category name",
      "tip": "specific personalized advice",
      "confidence": 95
    }
  ],
  "risk_assessment": {
    "safety_level": "low",
    "health_considerations": ["relevant health advice"],
    "weather_risks": ["weather-related risks"],
    "travel_advisories": ["current advisories if any"]
  },
  "ai_confidence_score": 88
}

Be specific, accurate, and highly personalized. Use real place names and practical advice. Focus on value and user preferences.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert AI travel advisor with extensive knowledge of global destinations. Provide accurate, personalized recommendations in valid JSON format only. Never make up specific business names - use general descriptions when specific data isn't available."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No recommendations generated');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON found');

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Learn from user interactions to improve recommendations
   */
  static async learnFromUserFeedback(params: {
    user_id: string;
    trip_id: string;
    feedback: {
      overall_satisfaction: number; // 1-10
      category_ratings: {
        accommodation: number;
        transport: number;
        activities: number;
        dining: number;
      };
      specific_feedback: {
        liked: string[];
        disliked: string[];
        suggestions: string[];
      };
      would_recommend: boolean;
    };
  }) {
    // In production, this would update user preference models
    // For now, we'll store feedback for future analysis
    
    try {
      const learningPrompt = `Analyze this user feedback to improve future recommendations:

User Feedback:
- Overall Satisfaction: ${params.feedback.overall_satisfaction}/10
- Category Ratings: ${JSON.stringify(params.feedback.category_ratings)}
- Liked: ${params.feedback.specific_feedback.liked.join(', ')}
- Disliked: ${params.feedback.specific_feedback.disliked.join(', ')}
- Would Recommend: ${params.feedback.would_recommend}

Generate insights about what this user values and how to improve future recommendations.
Format as JSON with user_insights and recommendation_adjustments arrays.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a machine learning system that learns from user feedback to improve travel recommendations."
          },
          {
            role: "user",
            content: learningPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const insights = response.choices[0]?.message?.content;
      console.log('User feedback insights:', insights);

      // TODO: Update user preference model in database
      return { success: true, insights };

    } catch (error) {
      console.error('Learning from feedback error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get real-time updates and alerts for active trips
   */
  static async getRealtimeUpdates(params: {
    trip_id: string;
    destination: string;
    travel_dates: { start: Date; end: Date };
    user_preferences: UserPreferences;
  }) {
    try {
      // Check for weather alerts, price changes, new recommendations, etc.
      const updatePrompt = `Generate real-time travel updates for ${params.destination} for dates ${params.travel_dates.start.toISOString().split('T')[0]} to ${params.travel_dates.end.toISOString().split('T')[0]}:

Consider:
1. Weather alerts and impact on planned activities
2. Price changes for flights/hotels
3. New attraction openings or closures
4. Local events or festivals
5. Safety or health updates
6. Currency exchange rate changes
7. Transportation delays or changes

Provide JSON with arrays: weather_alerts, price_changes, new_opportunities, safety_updates, and general_tips.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a real-time travel monitoring system. Provide current, actionable updates in JSON format."
          },
          {
            role: "user",
            content: updatePrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return { updates_available: false };

    } catch (error) {
      console.error('Real-time updates error:', error);
      return { error: 'Failed to fetch updates' };
    }
  }

  /**
   * Generate fallback recommendations when AI fails
   */
  private static generateFallbackRecommendations(params: any): TripRecommendation {
    return {
      destination_analysis: {
        destination: params.destination,
        best_time_to_visit: "Year-round destination with seasonal variations",
        weather_overview: "Check local weather forecast before departure",
        cultural_highlights: ["Local architecture", "Traditional cuisine", "Cultural festivals"],
        local_insights: ["Learn basic local phrases", "Respect local customs", "Try street food"],
        hidden_gems: [
          {
            name: "Local Market District",
            type: "Market",
            description: "Traditional market with local crafts and food",
            why_special: "Authentic local experience away from tourist crowds"
          }
        ]
      },
      accommodation_recommendations: [
        {
          name: "Centrally Located Hotel",
          type: "Hotel",
          location: "City Center",
          price_range: `$${Math.round(params.user_preferences.budget_range.max * 0.4 / 7)}-${Math.round(params.user_preferences.budget_range.max * 0.6 / 7)} per night`,
          why_recommended: "Convenient location matching your preferences",
          match_score: 75,
          booking_urgency: "medium"
        }
      ],
      transport_optimization: {
        recommended_route: "Direct flight if available, otherwise one-stop via major hub",
        alternative_routes: ["Alternative airline options", "Ground transport combinations"],
        cost_saving_tips: ["Book 2-3 weeks in advance", "Consider flexible dates", "Compare multiple airlines"],
        booking_timing: "Book now for best balance of price and flexibility",
        seasonal_considerations: ["Prices vary by season", "Weather may affect schedules"]
      },
      dining_recommendations: [
        {
          name: "Local Favorite Restaurant",
          cuisine: "Regional Cuisine",
          price_category: "mid-range",
          specialties: ["Local signature dish", "Regional specialties"],
          experience_type: "casual dining",
          reservation_needed: false,
          match_score: 80
        }
      ],
      activity_itinerary: [
        {
          day: 1,
          theme: "Orientation and Key Sights",
          activities: [
            {
              name: "City Walking Tour",
              type: "sightseeing",
              duration: "3 hours",
              cost_estimate: "$20-40 per person",
              booking_required: false,
              weather_dependent: true,
              description: "Overview of main attractions and neighborhoods"
            }
          ],
          logistics: {
            transport_needs: "Walking or public transport",
            timing_notes: "Start early to avoid crowds",
            backup_plans: ["Indoor museum visits", "Shopping areas"]
          }
        }
      ],
      budget_optimization: {
        estimated_total: {
          accommodation: Math.round(params.user_preferences.budget_range.max * 0.4),
          transport: Math.round(params.user_preferences.budget_range.max * 0.25),
          food: Math.round(params.user_preferences.budget_range.max * 0.2),
          activities: Math.round(params.user_preferences.budget_range.max * 0.1),
          miscellaneous: Math.round(params.user_preferences.budget_range.max * 0.05),
          total: params.user_preferences.budget_range.max
        },
        saving_opportunities: [
          {
            category: "Accommodation",
            suggestion: "Consider shoulder season dates",
            potential_savings: Math.round(params.user_preferences.budget_range.max * 0.1)
          }
        ],
        peak_vs_offpeak: {
          current_season: "Check seasonal patterns",
          price_difference: "Prices vary significantly by season",
          recommendations: ["Consider flexible travel dates"]
        }
      },
      personalized_tips: [
        {
          category: "General",
          tip: "Start planning early for better options and prices",
          confidence: 90
        }
      ],
      risk_assessment: {
        safety_level: "moderate",
        health_considerations: ["Standard travel health precautions"],
        weather_risks: ["Check weather forecast before activities"],
        travel_advisories: ["Check current travel advisories"]
      },
      ai_confidence_score: 60
    };
  }

  /**
   * Cache recommendations for faster retrieval
   */
  static async cacheRecommendations(tripId: string, recommendations: TripRecommendation): Promise<void> {
    // TODO: Implement Redis caching with 24-hour TTL
    console.log(`Caching recommendations for trip ${tripId}`);
  }

  /**
   * Get cached recommendations
   */
  static async getCachedRecommendations(tripId: string): Promise<TripRecommendation | null> {
    // TODO: Implement Redis caching retrieval
    return null;
  }
}

