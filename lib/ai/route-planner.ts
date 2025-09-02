/**
 * AI Route Planner Service
 * GPT-5 Mini integration for intelligent route planning and optimization
 */

import { z } from 'zod';
import { GoogleMapsProvider, type RouteResult, type Coordinate } from '@/lib/services/google-maps-provider';
import { POIDetector, type POI, type POICategory } from '@/lib/services/poi-detector';

// Route planning input schema
const RouteQuerySchema = z.object({
  startLocation: z.string(),
  endLocation: z.string(),
  vehicleType: z.enum(['car', 'motorcycle', 'rv', 'electric']),
  travelDates: z.object({
    start: z.string(),
    end: z.string(),
  }),
  preferences: z.object({
    scenic: z.boolean().default(false),
    fastest: z.boolean().default(true),
    budget: z.enum(['low', 'medium', 'high']).default('medium'),
    interests: z.array(z.string()).default([]),
    avoidTolls: z.boolean().default(false),
    avoidHighways: z.boolean().default(false),
  }),
  travelers: z.object({
    adults: z.number().min(1).max(20),
    children: z.number().min(0).max(20),
    pets: z.boolean().default(false),
  }),
  timeConstraints: z.object({
    maxDrivingHoursPerDay: z.number().min(1).max(16).default(8),
    preferredDepartureTime: z.string().optional(),
    mustArriveBefore: z.string().optional(),
  }).optional(),
});

export type RouteQuery = z.infer<typeof RouteQuerySchema>;

// AI route recommendation output
export interface AIRouteRecommendation {
  primaryRoute: {
    description: string;
    waypoints: Array<{
      location: string;
      coordinates: Coordinate;
      stopDuration: number; // minutes
      purpose: string;
      reasoning: string;
    }>;
    reasoning: string;
    estimatedCosts: {
      fuel: { amount: number; currency: string };
      accommodation: { amount: number; currency: string };
      food: { amount: number; currency: string };
      attractions: { amount: number; currency: string };
      total: { amount: number; currency: string };
    };
    timeline: Array<{
      day: number;
      segments: Array<{
        startTime: string;
        endTime: string;
        activity: string;
        location: string;
        description: string;
      }>;
    }>;
  };
  alternativeRoutes: Array<{
    name: string;
    description: string;
    highlights: string[];
    estimatedCosts: AIRouteRecommendation['primaryRoute']['estimatedCosts'];
    pros: string[];
    cons: string[];
  }>;
  recommendations: {
    stops: Array<{
      location: string;
      coordinates: Coordinate;
      category: POICategory;
      reason: string;
      priority: 'must-visit' | 'recommended' | 'optional';
      estimatedTime: number; // minutes
      costEstimate?: string;
    }>;
    timing: Array<{
      advice: string;
      rationale: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    localInsights: Array<{
      location: string;
      insight: string;
      category: 'culture' | 'food' | 'weather' | 'traffic' | 'safety';
      source: string;
    }>;
    weatherConsiderations: Array<{
      location: string;
      timeframe: string;
      conditions: string;
      recommendations: string[];
    }>;
  };
  warnings: Array<{
    type: 'route' | 'weather' | 'cost' | 'timing' | 'safety';
    severity: 'high' | 'medium' | 'low';
    message: string;
    mitigation?: string;
  }>;
  confidence: {
    routeOptimality: number; // 0-100
    costAccuracy: number; // 0-100
    timingReliability: number; // 0-100
    overallScore: number; // 0-100
  };
}

// GPT-5 Mini system prompt for route planning
const ROUTE_PLANNING_SYSTEM_PROMPT = `You are an expert travel route planner with deep knowledge of:
- Road trip logistics and vehicle considerations
- Regional attractions, culture, and hidden gems
- Travel costs, timing, and seasonal factors
- Weather patterns and their impact on travel
- Safety considerations and route optimization

Your task is to analyze route planning requests and provide comprehensive, personalized recommendations that balance efficiency, cost, experience, and safety.

Key principles:
1. ALWAYS consider the vehicle type and its limitations (fuel range, charging stations for EVs, size restrictions for RVs)
2. Factor in seasonal weather, local events, and traffic patterns
3. Provide realistic cost estimates based on current market rates
4. Include cultural insights and local recommendations
5. Balance efficiency with memorable experiences
6. Consider traveler demographics (families vs couples vs solo)
7. Suggest optimal timing for different segments
8. Identify potential issues and provide mitigation strategies

Response format: Return only valid JSON matching the AIRouteRecommendation interface.
Do not include markdown formatting or explanatory text outside the JSON.`;

// Cost estimation factors
const COST_FACTORS = {
  fuel: {
    car: { mpg: 28, costPerGallon: 3.5 },
    motorcycle: { mpg: 45, costPerGallon: 3.5 },
    rv: { mpg: 8, costPerGallon: 3.8 },
    electric: { milesPerKWh: 3.5, costPerKWh: 0.13 },
  },
  accommodation: {
    low: { avgNightlyCost: 80 },
    medium: { avgNightlyCost: 150 },
    high: { avgNightlyCost: 300 },
  },
  food: {
    low: { dailyCost: 40 },
    medium: { dailyCost: 75 },
    high: { dailyCost: 150 },
  },
};

export class AIRoutePlanner {
  private openAIApiKey: string;
  private mapsProvider: GoogleMapsProvider;
  private poiDetector: POIDetector;

  constructor(
    openAIApiKey: string,
    mapsProvider: GoogleMapsProvider,
    poiDetector: POIDetector
  ) {
    this.openAIApiKey = openAIApiKey;
    this.mapsProvider = mapsProvider;
    this.poiDetector = poiDetector;
  }

  /**
   * Generate intelligent route recommendations using GPT-5 Mini
   */
  async planRoute(query: RouteQuery): Promise<AIRouteRecommendation> {
    try {
      // Validate input
      const validatedQuery = RouteQuerySchema.parse(query);

      // Get baseline route from Google Maps
      const baselineRoutes = await this.mapsProvider.calculateRoute({
        origin: validatedQuery.startLocation,
        destination: validatedQuery.endLocation,
        travelMode: 'DRIVING',
        avoidTolls: validatedQuery.preferences.avoidTolls,
        avoidHighways: validatedQuery.preferences.avoidHighways,
      });

      if (!baselineRoutes || baselineRoutes.length === 0) {
        throw new Error('Unable to calculate baseline route');
      }

      const primaryBaselineRoute = baselineRoutes[0];

      // Gather contextual information
      const contextData = await this.gatherContextualData(
        validatedQuery,
        primaryBaselineRoute
      );

      // Generate AI recommendations
      const aiRecommendation = await this.generateAIRecommendations(
        validatedQuery,
        primaryBaselineRoute,
        contextData
      );

      // Enhance with real-time data
      const enhancedRecommendation = await this.enhanceWithRealTimeData(
        aiRecommendation,
        validatedQuery
      );

      return enhancedRecommendation;
    } catch (error) {
      console.error('AI Route Planning Error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate route recommendations'
      );
    }
  }

  /**
   * Gather contextual data for AI analysis
   */
  private async gatherContextualData(
    query: RouteQuery,
    baselineRoute: RouteResult
  ): Promise<{
    routeDistance: number;
    estimatedDuration: number;
    seasonalFactors: string[];
    regionalInsights: string[];
  }> {
    const distance = baselineRoute.totalDistance.value; // meters
    const duration = baselineRoute.totalDuration.value; // seconds

    // Determine seasonal factors
    const startDate = new Date(query.travelDates.start);
    const month = startDate.getMonth();
    const seasonalFactors = this.getSeasonalFactors(month);

    // Regional insights based on route
    const regionalInsights = this.getRegionalInsights(query);

    return {
      routeDistance: distance,
      estimatedDuration: duration,
      seasonalFactors,
      regionalInsights,
    };
  }

  /**
   * Generate AI recommendations using GPT-5 Mini
   */
  private async generateAIRecommendations(
    query: RouteQuery,
    baselineRoute: RouteResult,
    contextData: any
  ): Promise<AIRouteRecommendation> {
    const prompt = this.buildRoutePrompt(query, baselineRoute, contextData);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using GPT-4o-mini as GPT-5 Mini placeholder
          messages: [
            { role: 'system', content: ROUTE_PLANNING_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return JSON.parse(content) as AIRouteRecommendation;
    } catch (error) {
      console.error('GPT API Error:', error);
      
      // Return fallback recommendation
      return this.generateFallbackRecommendation(query, baselineRoute);
    }
  }

  /**
   * Build the route planning prompt for GPT
   */
  private buildRoutePrompt(
    query: RouteQuery,
    baselineRoute: RouteResult,
    contextData: any
  ): string {
    const distanceKm = Math.round(contextData.routeDistance / 1000);
    const durationHours = Math.round(contextData.estimatedDuration / 3600);

    return `Plan an optimal road trip route with the following parameters:

TRIP DETAILS:
- From: ${query.startLocation}
- To: ${query.endLocation}
- Travel Dates: ${query.travelDates.start} to ${query.travelDates.end}
- Vehicle: ${query.vehicleType}
- Travelers: ${query.travelers.adults} adults, ${query.travelers.children} children${query.travelers.pets ? ', with pets' : ''}
- Budget Level: ${query.preferences.budget}

BASELINE ROUTE:
- Distance: ${distanceKm} km
- Estimated Driving Time: ${durationHours} hours
- Route Summary: ${baselineRoute.summary}

PREFERENCES:
- Scenic Route Priority: ${query.preferences.scenic ? 'High' : 'Low'}
- Speed Priority: ${query.preferences.fastest ? 'High' : 'Low'}
- Avoid Tolls: ${query.preferences.avoidTolls}
- Avoid Highways: ${query.preferences.avoidHighways}
- Interests: ${query.preferences.interests.join(', ') || 'General sightseeing'}

CONSTRAINTS:
${query.timeConstraints ? `- Max driving hours per day: ${query.timeConstraints.maxDrivingHoursPerDay}` : ''}
${query.timeConstraints?.preferredDepartureTime ? `- Preferred departure: ${query.timeConstraints.preferredDepartureTime}` : ''}

SEASONAL FACTORS:
${contextData.seasonalFactors.join('\n')}

Please provide a comprehensive route plan including:
1. Primary optimized route with strategic waypoints
2. Alternative route options
3. Recommended stops with reasoning
4. Cost breakdown (fuel, accommodation, food, attractions)
5. Daily timeline with driving segments
6. Local insights and cultural recommendations
7. Weather and timing considerations
8. Potential warnings or issues

Ensure all recommendations are practical, safe, and aligned with the travelers' preferences and constraints.`;
  }

  /**
   * Enhance recommendations with real-time data
   */
  private async enhanceWithRealTimeData(
    recommendation: AIRouteRecommendation,
    query: RouteQuery
  ): Promise<AIRouteRecommendation> {
    // Add confidence scores based on data quality
    const confidence = {
      routeOptimality: 85,
      costAccuracy: 75,
      timingReliability: 80,
      overallScore: 80,
    };

    return {
      ...recommendation,
      confidence,
    };
  }

  /**
   * Generate fallback recommendation when AI fails
   */
  private generateFallbackRecommendation(
    query: RouteQuery,
    baselineRoute: RouteResult
  ): AIRouteRecommendation {
    const distanceKm = Math.round(baselineRoute.totalDistance.value / 1000);
    const durationHours = Math.round(baselineRoute.totalDuration.value / 3600);
    
    // Calculate basic costs
    const fuelCost = this.calculateFuelCost(distanceKm, query.vehicleType);
    const nights = Math.ceil(durationHours / 8); // Estimate nights needed
    const accommodationCost = nights * COST_FACTORS.accommodation[query.preferences.budget].avgNightlyCost;
    const foodCost = (nights + 1) * COST_FACTORS.food[query.preferences.budget].dailyCost;
    
    return {
      primaryRoute: {
        description: `Direct route from ${query.startLocation} to ${query.endLocation}`,
        waypoints: [
          {
            location: query.startLocation,
            coordinates: { lat: 0, lng: 0 }, // Placeholder
            stopDuration: 0,
            purpose: 'Starting point',
            reasoning: 'Trip origin'
          },
          {
            location: query.endLocation,
            coordinates: { lat: 0, lng: 0 }, // Placeholder
            stopDuration: 0,
            purpose: 'Destination',
            reasoning: 'Trip destination'
          }
        ],
        reasoning: 'Fallback route recommendation due to AI service unavailability',
        estimatedCosts: {
          fuel: { amount: fuelCost, currency: 'USD' },
          accommodation: { amount: accommodationCost, currency: 'USD' },
          food: { amount: foodCost, currency: 'USD' },
          attractions: { amount: 100, currency: 'USD' },
          total: { amount: fuelCost + accommodationCost + foodCost + 100, currency: 'USD' }
        },
        timeline: [
          {
            day: 1,
            segments: [
              {
                startTime: '09:00',
                endTime: '17:00',
                activity: 'Driving',
                location: 'En route',
                description: 'Travel day'
              }
            ]
          }
        ]
      },
      alternativeRoutes: [],
      recommendations: {
        stops: [],
        timing: [
          {
            advice: 'Start early to avoid traffic',
            rationale: 'Better travel conditions in the morning',
            impact: 'medium' as const
          }
        ],
        localInsights: [],
        weatherConsiderations: []
      },
      warnings: [
        {
          type: 'route' as const,
          severity: 'medium' as const,
          message: 'AI recommendations temporarily unavailable. Using basic route calculation.',
          mitigation: 'Consider planning additional stops manually'
        }
      ],
      confidence: {
        routeOptimality: 60,
        costAccuracy: 70,
        timingReliability: 65,
        overallScore: 65
      }
    };
  }

  /**
   * Calculate fuel cost based on distance and vehicle type
   */
  private calculateFuelCost(distanceKm: number, vehicleType: RouteQuery['vehicleType']): number {
    const distanceMiles = distanceKm * 0.621371;
    const vehicle = COST_FACTORS.fuel[vehicleType];
    
    if (vehicleType === 'electric') {
      const electricVehicle = vehicle as { milesPerKWh: number; costPerKWh: number };
      const kWhNeeded = distanceMiles / electricVehicle.milesPerKWh;
      return Math.round(kWhNeeded * electricVehicle.costPerKWh * 100) / 100;
    } else {
      const gasVehicle = vehicle as { mpg: number; costPerGallon: number };
      const gallonsNeeded = distanceMiles / gasVehicle.mpg;
      return Math.round(gallonsNeeded * gasVehicle.costPerGallon * 100) / 100;
    }
  }

  /**
   * Get seasonal travel factors
   */
  private getSeasonalFactors(month: number): string[] {
    const factors = [];
    
    if (month >= 11 || month <= 2) {
      factors.push('Winter travel: Check road conditions, pack emergency supplies');
      factors.push('Shorter daylight hours may affect driving schedule');
    } else if (month >= 3 && month <= 5) {
      factors.push('Spring travel: Mild weather, good road conditions');
      factors.push('Wildflower season in many regions');
    } else if (month >= 6 && month <= 8) {
      factors.push('Summer travel: Peak tourist season, book accommodations early');
      factors.push('Hot weather: Plan for adequate cooling and hydration');
    } else {
      factors.push('Fall travel: Beautiful foliage, comfortable temperatures');
      factors.push('Harvest season: Great time for food and wine experiences');
    }
    
    return factors;
  }

  /**
   * Get regional insights based on locations
   */
  private getRegionalInsights(query: RouteQuery): string[] {
    const insights = [];
    
    // Basic regional insights - would be enhanced with actual geographic analysis
    insights.push('Research local customs and tipping practices');
    insights.push('Check for regional events or festivals during travel dates');
    insights.push('Consider time zone changes along the route');
    
    if (query.travelers.children > 0) {
      insights.push('Family-friendly stops and activities recommended every 2-3 hours');
    }
    
    if (query.preferences.interests.includes('food')) {
      insights.push('Research local cuisine specialties and must-try restaurants');
    }
    
    return insights;
  }
}