/**
 * AI Trip Client - Phase 4.2
 * 
 * Client-side service for interacting with AI trip generation APIs
 */

import { TripPreferences, GeneratedItinerary, RecommendationRequest, PersonalizedRecommendation } from './advanced-ai-service';

export interface TripGenerationResponse {
  success: boolean;
  itinerary?: any; // Legacy format for backward compatibility
  enhanced?: {
    fullItinerary: GeneratedItinerary;
    aiMetadata: {
      provider: string;
      confidence: number;
      sources: string[];
    };
  };
  metadata?: {
    generatedAt: string;
    generationTime: number;
    provider: string;
    tier: string;
    version: string;
    enhanced: boolean;
  };
  error?: string;
  code?: string;
  cached?: boolean;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations?: PersonalizedRecommendation['recommendations'];
  insights?: PersonalizedRecommendation['insights'];
  metadata?: {
    generatedAt: string;
    generationTime: number;
    provider: string;
    tier: string;
    version: string;
  };
  error?: string;
  code?: string;
  cached?: boolean;
}

export interface OptimizationResponse {
  success: boolean;
  optimizedItinerary?: GeneratedItinerary;
  optimization?: {
    goals: string[];
    constraints: string[];
    impact: any;
    summary: string[];
  };
  metadata?: {
    optimizedAt: string;
    optimizationTime: number;
    provider: string;
    tier: string;
    version: string;
  };
  error?: string;
  code?: string;
  cached?: boolean;
}

class AITripClient {
  private baseUrl = '/api/ai';

  /**
   * Generate a complete trip itinerary
   */
  async generateTrip(
    preferences: TripPreferences | any, // Support both new and legacy formats
    options: {
      requestId?: string;
      timeout?: number;
    } = {}
  ): Promise<TripGenerationResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 60000);

      const response = await fetch(`${this.baseUrl}/generate-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          requestId: options.requestId || this.generateRequestId()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || 'HTTP_ERROR'
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          code: 'TIMEOUT'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(
    request: RecommendationRequest,
    options: {
      timeout?: number;
    } = {}
  ): Promise<RecommendationResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || 'HTTP_ERROR'
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          code: 'TIMEOUT'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Optimize an existing itinerary
   */
  async optimizeItinerary(
    currentItinerary: GeneratedItinerary,
    optimizationGoals: string[],
    constraints?: string[],
    options: {
      requestId?: string;
      timeout?: number;
    } = {}
  ): Promise<OptimizationResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 90000); // Longer timeout for optimization

      const response = await fetch(`${this.baseUrl}/optimize-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentItinerary,
          optimizationGoals,
          constraints: constraints || [],
          requestId: options.requestId || this.generateRequestId()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || 'HTTP_ERROR'
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          code: 'TIMEOUT'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get health status of AI services
   */
  async getServiceHealth(): Promise<{
    tripGenerator: any;
    recommendations: any;
    optimization: any;
  }> {
    try {
      const [tripGen, recommendations, optimization] = await Promise.allSettled([
        fetch(`${this.baseUrl}/generate-trip`).then(r => r.json()),
        fetch(`${this.baseUrl}/recommendations`).then(r => r.json()),
        fetch(`${this.baseUrl}/optimize-itinerary`).then(r => r.json())
      ]);

      return {
        tripGenerator: tripGen.status === 'fulfilled' ? tripGen.value : { available: false, reason: 'Service unavailable' },
        recommendations: recommendations.status === 'fulfilled' ? recommendations.value : { available: false, reason: 'Service unavailable' },
        optimization: optimization.status === 'fulfilled' ? optimization.value : { available: false, reason: 'Service unavailable' }
      };
    } catch (error) {
      return {
        tripGenerator: { available: false, reason: 'Network error' },
        recommendations: { available: false, reason: 'Network error' },
        optimization: { available: false, reason: 'Network error' }
      };
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiTripClient = new AITripClient();
export default aiTripClient;