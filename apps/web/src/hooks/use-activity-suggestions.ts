import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from './use-subscription';
import { trackEvent } from '@/lib/monitoring';

interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface WeatherCondition {
  condition: string;
  temperature: number;
  precipitation?: number;
}

interface UserPreferences {
  interests?: string[];
  budget?: 'low' | 'medium' | 'high';
  mobility?: 'walking' | 'public_transport' | 'car' | 'bike';
  group_size?: number;
}

interface CurrentActivity {
  id: string;
  name: string;
  category: string;
  time: string;
}

interface ActivitySuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
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
  confidence: number;
}

interface SuggestActivitiesParams {
  location: Location;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: WeatherCondition;
  userPreferences?: UserPreferences;
  currentItinerary?: CurrentActivity[];
  exclude?: string[];
}

interface SuggestionsResponse {
  suggestions: ActivitySuggestion[];
  timestamp: string;
  location: Location;
  timeOfDay: string;
}

export function useActivitySuggestions() {
  const queryClient = useQueryClient();
  const { isPro } = useSubscription();

  // Mutation for generating new suggestions
  const generateSuggestions = useMutation({
    mutationFn: async (params: SuggestActivitiesParams): Promise<SuggestionsResponse> => {
      const response = await fetch('/api/ai/suggest-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate activity suggestions');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Cache the suggestions
      const cacheKey = ['activity-suggestions', variables.location.city, variables.timeOfDay];
      queryClient.setQueryData(cacheKey, data);

      // Track successful generation
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.track('activity_suggestions_generated', {
          location: `${variables.location.city}, ${variables.location.country}`,
          timeOfDay: variables.timeOfDay,
          suggestionsCount: data.suggestions.length,
          hasWeather: !!variables.weather,
          hasPreferences: !!variables.userPreferences,
        });
      }
    },
    onError: (error) => {
      console.error('Activity suggestions failed:', error);
      
      // Track error
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.track('activity_suggestions_failed', {
          error: error.message,
        });
      }
    },
  });

  // Query for cached suggestions
  const getCachedSuggestions = (location: Location, timeOfDay: string) => {
    return useQuery({
      queryKey: ['activity-suggestions', location.city, timeOfDay],
      queryFn: () => null, // We only use cached data
      enabled: false, // Never refetch automatically
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  return {
    generateSuggestions: generateSuggestions.mutate,
    isGenerating: generateSuggestions.isPending,
    generationError: generateSuggestions.error,
    getCachedSuggestions,
    isPro, // Include subscription status
  };
}

// Hook for real-time weather-aware suggestions
export function useWeatherAwareSuggestions(
  location: Location,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  enabled = true
) {
  const { generateSuggestions, isGenerating, generationError } = useActivitySuggestions();
  
  // Fetch current weather (mock implementation)
  const { data: weather } = useQuery({
    queryKey: ['weather', location.city],
    queryFn: async (): Promise<WeatherCondition> => {
      // In a real implementation, this would call a weather API
      // For now, return mock data
      return {
        condition: 'partly_cloudy',
        temperature: 22,
        precipitation: 10,
      };
    },
    enabled: enabled && !!location.city,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });

  const getSuggestions = (
    userPreferences?: UserPreferences,
    currentItinerary?: CurrentActivity[],
    exclude?: string[]
  ) => {
    if (!weather) return;
    
    generateSuggestions({
      location,
      timeOfDay,
      weather,
      userPreferences,
      currentItinerary,
      exclude,
    });
  };

  return {
    getSuggestions,
    weather,
    isGenerating,
    generationError,
  };
}

// Hook for suggestion analytics and tracking
export function useSuggestionTracking() {
  const trackSuggestionClick = (suggestion: ActivitySuggestion, context: {
    location: string;
    timeOfDay: string;
    position: number;
  }) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('activity_suggestion_clicked', {
        suggestionId: suggestion.id,
        suggestionName: suggestion.name,
        category: suggestion.category,
        confidence: suggestion.confidence,
        location: context.location,
        timeOfDay: context.timeOfDay,
        position: context.position,
      });
    }
  };

  const trackSuggestionBooking = (suggestion: ActivitySuggestion) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('activity_suggestion_booked', {
        suggestionId: suggestion.id,
        suggestionName: suggestion.name,
        category: suggestion.category,
        priceRange: suggestion.priceRange,
      });
    }
  };

  const trackSuggestionRejection = (suggestion: ActivitySuggestion, reason?: string) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('activity_suggestion_rejected', {
        suggestionId: suggestion.id,
        suggestionName: suggestion.name,
        category: suggestion.category,
        reason,
      });
    }
  };

  return {
    trackSuggestionClick,
    trackSuggestionBooking,
    trackSuggestionRejection,
  };
}

// Helper hook for time-based suggestions
export function useTimeBasedSuggestions(location: Location) {
  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const timeOfDay = getCurrentTimeOfDay();
  
  return useWeatherAwareSuggestions(location, timeOfDay);
}