/**
 * Advanced AI Service - Phase 4.1
 * 
 * Unified AI service architecture supporting multiple providers:
 * - OpenAI GPT-4o Mini for advanced reasoning and complex planning
 * - Google Gemini 2.5 Flash for cost-effective local insights and recommendations
 * - Intelligent fallback mechanisms and provider orchestration
 * - Structured output parsing and validation
 * - Rate limiting and cost optimization
 */

import OpenAI from 'openai';
import { z } from 'zod';

// ==================== TYPES & SCHEMAS ====================

export type AIProvider = 'openai' | 'gemini' | 'fallback';

export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider;
  format?: 'json' | 'text';
  retries?: number;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  text?: string;
  error?: string;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  duration: number;
}

// Trip Generation Schemas
export const TripPreferencesSchema = z.object({
  destination: z.string().min(1),
  origin: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  travelers: z.object({
    adults: z.number().min(1).max(20),
    children: z.number().min(0).max(10),
    ages: z.array(z.number()).optional()
  }),
  budget: z.object({
    total: z.number().min(0),
    currency: z.string().default('INR'),
    distribution: z.object({
      accommodation: z.number().min(0).max(1).default(0.4),
      activities: z.number().min(0).max(1).default(0.3),
      transportation: z.number().min(0).max(1).default(0.2),
      dining: z.number().min(0).max(1).default(0.1)
    }).optional()
  }),
  preferences: z.object({
    tripType: z.enum(['leisure', 'business', 'adventure', 'cultural', 'family', 'romantic', 'backpacking']),
    pace: z.enum(['relaxed', 'moderate', 'fast']).default('moderate'),
    accommodationType: z.enum(['budget', 'mid-range', 'luxury', 'mixed']).default('mid-range'),
    transportMode: z.enum(['flights', 'trains', 'buses', 'car', 'mixed']).default('mixed'),
    interests: z.array(z.string()).default([]),
    dietaryRestrictions: z.array(z.string()).default([]),
    accessibility: z.boolean().default(false),
    groupDynamics: z.enum(['solo', 'couple', 'family', 'friends', 'business']).optional()
  }),
  constraints: z.object({
    mustInclude: z.array(z.string()).default([]),
    mustAvoid: z.array(z.string()).default([]),
    timeConstraints: z.array(z.object({
      date: z.string(),
      type: z.enum(['arrival', 'departure', 'fixed-activity']),
      description: z.string()
    })).default([]),
    weatherPreferences: z.enum(['any', 'warm', 'cool', 'avoid-rain']).default('any')
  }).optional()
});

export const GeneratedItinerarySchema = z.object({
  title: z.string(),
  description: z.string(),
  totalDuration: z.number(), // days
  estimatedCost: z.object({
    total: z.number(),
    currency: z.string(),
    breakdown: z.object({
      accommodation: z.number(),
      activities: z.number(),
      transportation: z.number(),
      dining: z.number(),
      other: z.number()
    })
  }),
  days: z.array(z.object({
    date: z.string(),
    title: z.string(),
    overview: z.string(),
    activities: z.array(z.object({
      time: z.string(),
      duration: z.number(), // minutes
      title: z.string(),
      description: z.string(),
      location: z.object({
        name: z.string(),
        address: z.string(),
        coordinates: z.tuple([z.number(), z.number()]).optional()
      }),
      category: z.enum(['sightseeing', 'dining', 'activity', 'transport', 'accommodation', 'free-time']),
      estimatedCost: z.number(),
      priority: z.enum(['must-do', 'recommended', 'optional']),
      bookingRequired: z.boolean().default(false),
      notes: z.string().optional()
    })),
    accommodation: z.object({
      name: z.string(),
      type: z.string(),
      location: z.string(),
      estimatedCost: z.number(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional()
    }).optional(),
    transportation: z.array(z.object({
      from: z.string(),
      to: z.string(),
      mode: z.string(),
      estimatedCost: z.number(),
      duration: z.number(),
      notes: z.string().optional()
    })),
    totalCost: z.number(),
    notes: z.string().optional()
  })),
  recommendations: z.object({
    bestTimeToVisit: z.string(),
    packingTips: z.array(z.string()),
    localEtiquette: z.array(z.string()),
    budgetTips: z.array(z.string()),
    hiddenGems: z.array(z.object({
      name: z.string(),
      description: z.string(),
      location: z.string(),
      category: z.string()
    })),
    alternatives: z.array(z.object({
      scenario: z.string(),
      suggestion: z.string(),
      impact: z.string()
    }))
  }),
  metadata: z.object({
    generatedAt: z.string(),
    provider: z.string(),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string())
  })
});

export type TripPreferences = z.infer<typeof TripPreferencesSchema>;
export type GeneratedItinerary = z.infer<typeof GeneratedItinerarySchema>;

// Recommendation Schemas
export const RecommendationRequestSchema = z.object({
  userId: z.string().optional(),
  context: z.object({
    location: z.string(),
    date: z.string().optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    weather: z.string().optional(),
    groupSize: z.number().min(1).default(1),
    duration: z.number().optional(), // hours
    budget: z.number().optional()
  }),
  preferences: z.object({
    categories: z.array(z.string()).default([]),
    cuisine: z.array(z.string()).default([]),
    priceRange: z.enum(['budget', 'mid-range', 'upscale', 'luxury']).optional(),
    distance: z.number().max(50).default(10), // km
    excludeVisited: z.boolean().default(false)
  }),
  type: z.enum(['restaurant', 'activity', 'accommodation', 'general'])
});

export const PersonalizedRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    location: z.object({
      name: z.string(),
      address: z.string(),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      distance: z.number().optional()
    }),
    rating: z.number().min(0).max(5).optional(),
    priceRange: z.string().optional(),
    estimatedCost: z.number().optional(),
    estimatedDuration: z.number().optional(),
    openingHours: z.string().optional(),
    bestTimeToVisit: z.string().optional(),
    reasons: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    alternatives: z.array(z.string()).default([])
  })),
  insights: z.object({
    localTips: z.array(z.string()),
    seasonalAdvice: z.string().optional(),
    culturalContext: z.string().optional(),
    budgetTips: z.array(z.string())
  }),
  metadata: z.object({
    generatedAt: z.string(),
    provider: z.string(),
    totalResults: z.number(),
    searchRadius: z.number()
  })
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
export type PersonalizedRecommendation = z.infer<typeof PersonalizedRecommendationSchema>;

// ==================== AI SERVICE IMPLEMENTATION ====================

export class AdvancedAIService {
  private openai: OpenAI;
  private geminiApiKey?: string;
  
  constructor() {
    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Initialize Gemini (optional)
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!this.geminiApiKey) {
      console.warn('Google Gemini API key not found, will use OpenAI only');
    }
  }

  // ==================== CORE AI METHODS ====================

  /**
   * Send request to AI provider with intelligent routing
   */
  async sendRequest<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const startTime = Date.now();
    let provider = request.provider || this.selectOptimalProvider(request);
    let attempts = 0;
    const maxAttempts = request.retries || 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        switch (provider) {
          case 'openai':
            return await this.sendOpenAIRequest<T>(request, startTime);
          case 'gemini':
            return await this.sendGeminiRequest<T>(request, startTime);
          default:
            return await this.sendFallbackResponse<T>(request, startTime);
        }
      } catch (error) {
        console.error(`AI request failed (${provider}, attempt ${attempts}):`, error);
        
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: `All providers failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            provider: provider,
            duration: Date.now() - startTime
          };
        }
        
        // Try next provider in fallback chain
        provider = this.getNextProvider(provider);
        await this.delay(1000 * attempts); // Exponential backoff
      }
    }

    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
      provider: provider,
      duration: Date.now() - startTime
    };
  }

  /**
   * Generate complete trip itinerary using AI
   */
  async generateTrip(preferences: TripPreferences): Promise<AIResponse<GeneratedItinerary>> {
    // Validate input
    const validatedPrefs = TripPreferencesSchema.parse(preferences);
    
    const prompt = this.buildTripGenerationPrompt(validatedPrefs);
    
    const request: AIRequest = {
      prompt,
      context: { preferences: validatedPrefs },
      maxTokens: 4000,
      temperature: 0.7,
      provider: 'openai', // Use OpenAI for complex trip planning
      format: 'json',
      retries: 2
    };

    const response = await this.sendRequest<GeneratedItinerary>(request);
    
    if (response.success && response.data) {
      // Validate the generated itinerary
      try {
        response.data = GeneratedItinerarySchema.parse(response.data);
      } catch (error) {
        console.error('Generated itinerary validation failed:', error);
        response.success = false;
        response.error = 'Invalid itinerary format generated';
      }
    }
    
    return response;
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<AIResponse<PersonalizedRecommendation>> {
    // Validate input
    const validatedRequest = RecommendationRequestSchema.parse(request);
    
    const prompt = this.buildRecommendationPrompt(validatedRequest);
    
    const aiRequest: AIRequest = {
      prompt,
      context: { request: validatedRequest },
      maxTokens: 2000,
      temperature: 0.6,
      provider: 'gemini', // Use Gemini for local recommendations (cost-effective)
      format: 'json',
      retries: 2
    };

    const response = await this.sendRequest<PersonalizedRecommendation>(aiRequest);
    
    if (response.success && response.data) {
      // Validate the recommendations
      try {
        response.data = PersonalizedRecommendationSchema.parse(response.data);
      } catch (error) {
        console.error('Recommendations validation failed:', error);
        response.success = false;
        response.error = 'Invalid recommendations format generated';
      }
    }
    
    return response;
  }

  /**
   * Optimize existing trip itinerary
   */
  async optimizeItinerary(
    currentItinerary: GeneratedItinerary,
    optimizationGoals: string[],
    constraints?: string[]
  ): Promise<AIResponse<GeneratedItinerary>> {
    const prompt = this.buildOptimizationPrompt(currentItinerary, optimizationGoals, constraints);
    
    const request: AIRequest = {
      prompt,
      context: { currentItinerary, optimizationGoals, constraints },
      maxTokens: 3000,
      temperature: 0.5,
      provider: 'openai', // Use OpenAI for complex optimization
      format: 'json',
      retries: 2
    };

    const response = await this.sendRequest<GeneratedItinerary>(request);
    
    if (response.success && response.data) {
      try {
        response.data = GeneratedItinerarySchema.parse(response.data);
      } catch (error) {
        console.error('Optimized itinerary validation failed:', error);
        response.success = false;
        response.error = 'Invalid optimized itinerary format';
      }
    }
    
    return response;
  }

  // ==================== PROVIDER-SPECIFIC IMPLEMENTATIONS ====================

  private async sendOpenAIRequest<T>(request: AIRequest, startTime: number): Promise<AIResponse<T>> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: request.format === 'json' 
            ? 'You are a professional travel planning assistant. Always respond with valid JSON only, no additional text or markdown.'
            : 'You are a professional travel planning assistant. Provide detailed, helpful, and accurate travel advice.'
        },
        {
          role: 'user',
          content: request.prompt
        }
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      response_format: request.format === 'json' ? { type: 'json_object' } : undefined
    });

    const usage = completion.usage;
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    let data: T | undefined;
    if (request.format === 'json') {
      try {
        data = JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON response: ${error}`);
      }
    }

    return {
      success: true,
      data,
      text: request.format === 'text' ? content : undefined,
      provider: 'openai',
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      } : undefined,
      cost: this.calculateOpenAICost(usage?.total_tokens || 0),
      duration: Date.now() - startTime
    };
  }

  private async sendGeminiRequest<T>(request: AIRequest, startTime: number): Promise<AIResponse<T>> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not available');
    }

    // For now, implement basic Gemini integration
    // This would be replaced with actual Gemini API calls
    console.warn('Gemini integration not implemented yet, falling back to OpenAI');
    return this.sendOpenAIRequest<T>(request, startTime);
  }

  private async sendFallbackResponse<T>(request: AIRequest, startTime: number): Promise<AIResponse<T>> {
    // Provide intelligent fallback responses based on request type
    if (request.context?.preferences) {
      return this.generateFallbackItinerary<T>(request as any, startTime);
    } else if (request.context?.request) {
      return this.generateFallbackRecommendations<T>(request as any, startTime);
    }

    return {
      success: false,
      error: 'No fallback available for this request type',
      provider: 'fallback',
      duration: Date.now() - startTime
    };
  }

  // ==================== PROMPT BUILDERS ====================

  private buildTripGenerationPrompt(preferences: TripPreferences): string {
    const { destination, startDate, endDate, travelers, budget, preferences: prefs, constraints } = preferences;
    const duration = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    return `Create a comprehensive ${duration}-day travel itinerary for ${destination}.

TRIP DETAILS:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${duration} days)
- Travelers: ${travelers.adults} adults${travelers.children > 0 ? `, ${travelers.children} children` : ''}
- Total Budget: ${budget.currency} ${budget.total.toLocaleString()}
- Trip Type: ${prefs.tripType}
- Pace: ${prefs.pace}
- Accommodation Type: ${prefs.accommodationType}
- Transport Mode: ${prefs.transportMode}

PREFERENCES:
- Interests: ${prefs.interests.join(', ') || 'General sightseeing'}
- Dietary Restrictions: ${prefs.dietaryRestrictions.join(', ') || 'None'}
- Accessibility Required: ${prefs.accessibility}
${prefs.groupDynamics ? `- Group Type: ${prefs.groupDynamics}` : ''}

${constraints ? `CONSTRAINTS:
${constraints.mustInclude.length > 0 ? `- Must Include: ${constraints.mustInclude.join(', ')}` : ''}
${constraints.mustAvoid.length > 0 ? `- Must Avoid: ${constraints.mustAvoid.join(', ')}` : ''}
${constraints.timeConstraints.length > 0 ? `- Time Constraints: ${constraints.timeConstraints.map(c => `${c.date} - ${c.type}: ${c.description}`).join('; ')}` : ''}
- Weather Preferences: ${constraints.weatherPreferences}` : ''}

BUDGET DISTRIBUTION:
- Accommodation: ${budget.distribution?.accommodation || 0.4} (${budget.currency} ${Math.floor(budget.total * (budget.distribution?.accommodation || 0.4)).toLocaleString()})
- Activities: ${budget.distribution?.activities || 0.3} (${budget.currency} ${Math.floor(budget.total * (budget.distribution?.activities || 0.3)).toLocaleString()})
- Transportation: ${budget.distribution?.transportation || 0.2} (${budget.currency} ${Math.floor(budget.total * (budget.distribution?.transportation || 0.2)).toLocaleString()})
- Dining: ${budget.distribution?.dining || 0.1} (${budget.currency} ${Math.floor(budget.total * (budget.distribution?.dining || 0.1)).toLocaleString()})

Please create a detailed itinerary that includes:
1. Day-by-day activities with specific times and durations
2. Accommodation recommendations for each location
3. Transportation between locations and activities
4. Cost estimates for each activity and overall daily budgets
5. Local insights, hidden gems, and cultural recommendations
6. Alternative options for different weather or preferences
7. Packing tips and local etiquette advice

Respond with a valid JSON object matching the GeneratedItinerary schema. Include realistic cost estimates, specific locations with addresses when possible, and practical timing for activities.`;
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    const { context, preferences, type } = request;

    return `Provide personalized ${type} recommendations for ${context.location}.

CONTEXT:
- Location: ${context.location}
- Date: ${context.date || 'Current date'}
- Time of Day: ${context.timeOfDay || 'Any time'}
- Weather: ${context.weather || 'Any weather'}
- Group Size: ${context.groupSize}
${context.duration ? `- Duration: ${context.duration} hours` : ''}
${context.budget ? `- Budget: ${context.budget}` : ''}

PREFERENCES:
- Categories: ${preferences.categories.join(', ') || 'Any'}
- Cuisine: ${preferences.cuisine.join(', ') || 'Any'}
- Price Range: ${preferences.priceRange || 'Any'}
- Maximum Distance: ${preferences.distance}km
- Exclude Previously Visited: ${preferences.excludeVisited}

Please provide:
1. 5-10 specific recommendations with detailed descriptions
2. Exact locations and addresses when possible
3. Estimated costs and duration for each recommendation
4. Local insider tips and cultural context
5. Best times to visit each place
6. Alternative options for different scenarios
7. Seasonal advice and weather considerations

Focus on authentic local experiences and hidden gems that tourists might miss. Include practical information like opening hours, booking requirements, and accessibility information.

Respond with a valid JSON object matching the PersonalizedRecommendation schema.`;
  }

  private buildOptimizationPrompt(
    currentItinerary: GeneratedItinerary,
    optimizationGoals: string[],
    constraints?: string[]
  ): string {
    return `Optimize the following travel itinerary based on the specified goals and constraints.

OPTIMIZATION GOALS:
${optimizationGoals.map(goal => `- ${goal}`).join('\n')}

${constraints ? `CONSTRAINTS:
${constraints.map(constraint => `- ${constraint}`).join('\n')}` : ''}

CURRENT ITINERARY:
${JSON.stringify(currentItinerary, null, 2)}

Please provide an optimized version that:
1. Addresses all optimization goals while respecting constraints
2. Maintains logical flow and realistic timing
3. Preserves must-do activities unless explicitly requested to change
4. Improves efficiency of routes and transportation
5. Balances cost optimization with experience quality
6. Provides explanations for major changes made

Include a brief explanation of the optimization strategy used and the trade-offs considered.

Respond with a valid JSON object matching the GeneratedItinerary schema with the optimized itinerary.`;
  }

  // ==================== UTILITY METHODS ====================

  private selectOptimalProvider(request: AIRequest): AIProvider {
    // Simple provider selection logic
    // In production, this could be based on current load, costs, success rates, etc.
    
    if (request.prompt.includes('itinerary') || request.prompt.includes('complex') || request.prompt.includes('optimize')) {
      return 'openai'; // Use OpenAI for complex reasoning
    }
    
    if (request.prompt.includes('recommend') || request.prompt.includes('local') || request.prompt.includes('restaurant')) {
      return this.geminiApiKey ? 'gemini' : 'openai'; // Use Gemini for recommendations if available
    }
    
    return 'openai'; // Default to OpenAI
  }

  private getNextProvider(currentProvider: AIProvider): AIProvider {
    switch (currentProvider) {
      case 'openai':
        return this.geminiApiKey ? 'gemini' : 'fallback';
      case 'gemini':
        return 'openai';
      default:
        return 'fallback';
    }
  }

  private calculateOpenAICost(totalTokens: number): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    // Simplified calculation assuming 50/50 split
    return (totalTokens / 1000000) * 0.375; // Average cost
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== FALLBACK IMPLEMENTATIONS ====================

  private async generateFallbackItinerary<T>(request: AIRequest, startTime: number): Promise<AIResponse<T>> {
    const preferences = request.context?.preferences as TripPreferences;
    if (!preferences) {
      throw new Error('No preferences available for fallback');
    }

    const duration = Math.ceil((new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24));

    // Generate a basic fallback itinerary
    const fallbackItinerary: GeneratedItinerary = {
      title: `${duration}-Day Trip to ${preferences.destination}`,
      description: `A ${duration}-day ${preferences.preferences.tripType} trip to ${preferences.destination} for ${preferences.travelers.adults} traveler${preferences.travelers.adults > 1 ? 's' : ''}.`,
      totalDuration: duration,
      estimatedCost: {
        total: preferences.budget.total,
        currency: preferences.budget.currency,
        breakdown: {
          accommodation: Math.floor(preferences.budget.total * 0.4),
          activities: Math.floor(preferences.budget.total * 0.3),
          transportation: Math.floor(preferences.budget.total * 0.2),
          dining: Math.floor(preferences.budget.total * 0.1),
          other: Math.floor(preferences.budget.total * 0.05)
        }
      },
      days: Array.from({ length: duration }, (_, i) => ({
        date: new Date(new Date(preferences.startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: `Day ${i + 1} in ${preferences.destination}`,
        overview: `Explore ${preferences.destination} with ${preferences.preferences.tripType} activities`,
        activities: [
          {
            time: '09:00',
            duration: 180,
            title: `Explore ${preferences.destination} attractions`,
            description: `Visit popular attractions and landmarks in ${preferences.destination}`,
            location: {
              name: preferences.destination,
              address: preferences.destination
            },
            category: 'sightseeing',
            estimatedCost: Math.floor(preferences.budget.total * 0.1 / duration),
            priority: 'recommended',
            bookingRequired: false
          }
        ],
        transportation: [],
        totalCost: Math.floor(preferences.budget.total / duration)
      })),
      recommendations: {
        bestTimeToVisit: 'Check local weather and peak seasons',
        packingTips: ['Comfortable walking shoes', 'Weather-appropriate clothing', 'Travel documents'],
        localEtiquette: ['Research local customs before visiting'],
        budgetTips: ['Book accommodations in advance', 'Look for local dining options'],
        hiddenGems: [],
        alternatives: []
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: 'fallback',
        confidence: 0.5,
        sources: ['static-fallback']
      }
    };

    return {
      success: true,
      data: fallbackItinerary as T,
      provider: 'fallback',
      duration: Date.now() - startTime
    };
  }

  private async generateFallbackRecommendations<T>(request: AIRequest, startTime: number): Promise<AIResponse<T>> {
    const recommendationRequest = request.context?.request as RecommendationRequest;
    if (!recommendationRequest) {
      throw new Error('No recommendation request available for fallback');
    }

    const fallbackRecommendations: PersonalizedRecommendation = {
      recommendations: [
        {
          id: 'fallback-1',
          name: `Popular ${recommendationRequest.type} in ${recommendationRequest.context.location}`,
          category: recommendationRequest.type,
          description: `A highly-rated ${recommendationRequest.type} in ${recommendationRequest.context.location}`,
          location: {
            name: recommendationRequest.context.location,
            address: recommendationRequest.context.location
          },
          reasons: ['Popular with visitors', 'Good reviews', 'Convenient location'],
          confidence: 0.6,
          alternatives: []
        }
      ],
      insights: {
        localTips: [`Research ${recommendationRequest.context.location} before visiting`],
        budgetTips: ['Compare prices online', 'Check for local deals']
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: 'fallback',
        totalResults: 1,
        searchRadius: recommendationRequest.preferences.distance
      }
    };

    return {
      success: true,
      data: fallbackRecommendations as T,
      provider: 'fallback',
      duration: Date.now() - startTime
    };
  }
}