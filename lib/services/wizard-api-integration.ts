/**
 * Wizard API Integration Service
 * 
 * Connects the API Gateway with TripWizardContext for seamless
 * state management and real-time data synchronization.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGateway, APIGatewayService } from '@/lib/services/api-gateway';
import { useTripWizard, TripFormData, WizardStep } from '@/contexts/TripWizardContext';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';

// ==================== TYPES ====================

interface WizardAPIState {
  isSearching: boolean;
  searchResults: {
    flights: any[];
    hotels: any[];
    activities: any[];
    transport: any[];
  };
  errors: {
    [key in WizardStep]?: string;
  };
  lastUpdate: Date | null;
  searchMetadata: {
    totalSearchTime: number;
    providersUsed: string[];
    resultCount: number;
  };
}

interface SearchOptions {
  debounceMs?: number;
  enableRealTimeUpdates?: boolean;
  cacheResults?: boolean;
  parallelSearch?: boolean;
}

interface RealTimeUpdateConfig {
  enabled: boolean;
  interval: number; // milliseconds
  priceThreshold: number; // percentage change threshold
  availabilityCheck: boolean;
}

// ==================== CUSTOM HOOK ====================

export const useWizardAPI = (options: SearchOptions = {}) => {
  const {
    state: wizardState,
    updateFormData,
    completeCurrentStep,
    validateCurrentStep
  } = useTripWizard();

  const searchOptionsRef = useRef<SearchOptions>({
    debounceMs: 500,
    enableRealTimeUpdates: false,
    cacheResults: true,
    parallelSearch: true,
    ...options
  });

  // API state management
  const [apiState, setAPIState] = useState<WizardAPIState>({
    isSearching: false,
    searchResults: {
      flights: [],
      hotels: [],
      activities: [],
      transport: []
    },
    errors: {},
    lastUpdate: null,
    searchMetadata: {
      totalSearchTime: 0,
      providersUsed: [],
      resultCount: 0
    }
  });

  // Debounced search function
  const debouncedSearch = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // ==================== SEARCH FUNCTIONS ====================

  const searchTripData = useCallback(async (
    formData: TripFormData,
    currentStep: WizardStep,
    searchOptions: Partial<SearchOptions> = {}
  ) => {
    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const mergedOptions = {
      ...searchOptionsRef.current,
      ...searchOptions
    };

    setAPIState(prev => ({
      ...prev,
      isSearching: true,
      errors: {}
    }));

    PerformanceMonitor.startTimer(
      'wizard-api-search',
      'Wizard API Search',
      { step: currentStep, destination: formData.to?.name }
    );

    try {
      const searchContext = {
        formData,
        currentStep,
        preferences: getUserPreferences(formData),
        budget: getBudgetConstraints(formData)
      };

      // Determine what to search based on current step
      const searchIncludes = getSearchIncludesForStep(currentStep);
      
      const result = await apiGateway.searchComprehensiveTrip(
        searchContext,
        searchIncludes
      );

      if (result.success) {
        setAPIState(prev => ({
          ...prev,
          isSearching: false,
          searchResults: {
            flights: result.data.flights || prev.searchResults.flights,
            hotels: result.data.hotels || prev.searchResults.hotels,
            activities: result.data.activities || prev.searchResults.activities,
            transport: result.data.transport || prev.searchResults.transport
          },
          lastUpdate: new Date(),
          searchMetadata: {
            totalSearchTime: result.metadata.responseTime,
            providersUsed: result.data.summary?.providersUsed || [],
            resultCount: result.data.summary?.totalResults || 0
          }
        }));

        // Auto-update form data with relevant results
        if (mergedOptions.parallelSearch) {
          updateFormDataWithResults(result.data, currentStep);
        }

      } else {
        setAPIState(prev => ({
          ...prev,
          isSearching: false,
          errors: {
            ...prev.errors,
            [currentStep]: result.error?.message || 'Search failed'
          }
        }));
      }

    } catch (error) {
      console.error('[WizardAPI] Search failed:', error);
      
      setAPIState(prev => ({
        ...prev,
        isSearching: false,
        errors: {
          ...prev.errors,
          [currentStep]: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      PerformanceMonitor.endTimer('wizard-api-search');
    }
  }, [updateFormData]);

  // ==================== STEP-SPECIFIC SEARCH ====================

  const searchFlights = useCallback(async (formData: TripFormData) => {
    if (!formData.from || !formData.to || !formData.dates.startDate) return;

    const result = await apiGateway.searchFlights({
      formData,
      currentStep: 'transport'
    });

    setAPIState(prev => ({
      ...prev,
      searchResults: {
        ...prev.searchResults,
        flights: result.flights
      }
    }));

    return result;
  }, []);

  const searchHotels = useCallback(async (formData: TripFormData) => {
    if (!formData.to || !formData.dates.startDate) return;

    const result = await apiGateway.searchHotels({
      formData,
      currentStep: 'accommodation'
    });

    setAPIState(prev => ({
      ...prev,
      searchResults: {
        ...prev.searchResults,
        hotels: result.hotels
      }
    }));

    return result;
  }, []);

  const searchActivities = useCallback(async (formData: TripFormData) => {
    if (!formData.to) return;

    const result = await apiGateway.searchActivities({
      formData,
      currentStep: 'activities'
    });

    setAPIState(prev => ({
      ...prev,
      searchResults: {
        ...prev.searchResults,
        activities: result.activities
      }
    }));

    return result;
  }, []);

  // ==================== REAL-TIME UPDATES ====================

  const realTimeUpdateConfig = useRef<RealTimeUpdateConfig>({
    enabled: searchOptionsRef.current.enableRealTimeUpdates || false,
    interval: 30000, // 30 seconds
    priceThreshold: 5, // 5% change
    availabilityCheck: true
  });

  useEffect(() => {
    if (!realTimeUpdateConfig.current.enabled || !apiState.lastUpdate) return;

    const interval = setInterval(async () => {
      try {
        // Check for price updates and availability changes
        await refreshSearchResults();
      } catch (error) {
        console.error('[WizardAPI] Real-time update failed:', error);
      }
    }, realTimeUpdateConfig.current.interval);

    return () => clearInterval(interval);
  }, [apiState.lastUpdate]);

  const refreshSearchResults = useCallback(async () => {
    if (apiState.isSearching) return;

    const hasSignificantChanges = await checkForSignificantChanges();
    
    if (hasSignificantChanges) {
      await searchTripData(
        wizardState.formData,
        wizardState.currentStep,
        { cacheResults: false }
      );
    }
  }, [apiState.isSearching, wizardState.formData, wizardState.currentStep]);

  // ==================== AUTO-SEARCH ON FORM CHANGES ====================

  useEffect(() => {
    const shouldTriggerSearch = shouldAutoSearch(
      wizardState.currentStep,
      wizardState.formData,
      wizardState.completedSteps
    );

    if (shouldTriggerSearch) {
      // Clear existing debounce timer
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }

      // Set new debounced search
      debouncedSearch.current = setTimeout(() => {
        searchTripData(wizardState.formData, wizardState.currentStep);
      }, searchOptionsRef.current.debounceMs);
    }

    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }
    };
  }, [
    wizardState.formData.from,
    wizardState.formData.to,
    wizardState.formData.dates,
    wizardState.formData.travelers,
    wizardState.currentStep
  ]);

  // ==================== UTILITY FUNCTIONS ====================

  const updateFormDataWithResults = useCallback((tripData: any, step: WizardStep) => {
    const updates: Partial<TripFormData> = {};

    switch (step) {
      case 'transport':
        if (tripData.flights?.length > 0) {
          updates.transport = {
            selectedFlight: tripData.flights[0],
            alternatives: tripData.flights.slice(1, 4)
          };
        }
        break;
      
      case 'accommodation':
        if (tripData.hotels?.length > 0) {
          updates.accommodation = {
            selectedHotel: tripData.hotels[0],
            alternatives: tripData.hotels.slice(1, 4)
          };
        }
        break;
      
      case 'activities':
        if (tripData.activities?.length > 0) {
          updates.activities = tripData.activities.slice(0, 8);
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
    }
  }, [updateFormData]);

  const getSearchIncludesForStep = (step: WizardStep) => {
    const baseIncludes = {
      includeFlights: false,
      includeHotels: false,
      includeActivities: false,
      includeTransport: false
    };

    switch (step) {
      case 'destination':
      case 'dates':
        return { ...baseIncludes }; // No API searches yet
      
      case 'transport':
        return { ...baseIncludes, includeFlights: true, includeTransport: true };
      
      case 'accommodation':
        return { ...baseIncludes, includeHotels: true };
      
      case 'activities':
        return { ...baseIncludes, includeActivities: true };
      
      case 'review':
        return {
          includeFlights: true,
          includeHotels: true,
          includeActivities: true,
          includeTransport: true
        };
      
      default:
        return baseIncludes;
    }
  };

  const shouldAutoSearch = (
    step: WizardStep,
    formData: TripFormData,
    completedSteps: Set<WizardStep>
  ): boolean => {
    // Only auto-search if we have minimum required data
    if (!formData.to) return false;
    
    switch (step) {
      case 'transport':
        return Boolean(formData.from && formData.dates.startDate);
      
      case 'accommodation':
        return Boolean(formData.dates.startDate && formData.dates.endDate);
      
      case 'activities':
        return Boolean(formData.dates.startDate);
      
      case 'review':
        return completedSteps.has('destination') && completedSteps.has('dates');
      
      default:
        return false;
    }
  };

  const getUserPreferences = (formData: TripFormData) => {
    // Extract preferences from form data and trip type
    const preferences = {
      travelStyle: determineTravelStyle(formData.budget, formData.travelers),
      interests: getInterestsFromTripType(formData.tripType),
      accessibility: undefined, // Would come from user profile
      dietary: undefined // Would come from user profile
    };

    return preferences;
  };

  const getBudgetConstraints = (formData: TripFormData) => {
    return {
      total: formData.budget,
      currency: 'USD',
      allocation: {
        transport: Math.floor(formData.budget * 0.4),
        accommodation: Math.floor(formData.budget * 0.35),
        activities: Math.floor(formData.budget * 0.15),
        food: Math.floor(formData.budget * 0.08),
        misc: Math.floor(formData.budget * 0.02)
      }
    };
  };

  const checkForSignificantChanges = async (): Promise<boolean> => {
    // In a real implementation, this would check for price changes
    // For now, return false to avoid unnecessary updates
    return false;
  };

  const determineTravelStyle = (budget: number, travelers: number): 'luxury' | 'mid-range' | 'budget' => {
    const perPersonBudget = budget / travelers;
    
    if (perPersonBudget > 3000) return 'luxury';
    if (perPersonBudget > 1500) return 'mid-range';
    return 'budget';
  };

  const getInterestsFromTripType = (tripType: string): string[] => {
    const interestMap: Record<string, string[]> = {
      'adventure': ['hiking', 'climbing', 'outdoor-sports'],
      'culture': ['museums', 'history', 'art', 'architecture'],
      'beach': ['relaxation', 'water-sports', 'spa'],
      'business': ['conference', 'networking', 'efficiency'],
      'family': ['family-friendly', 'entertainment', 'education'],
      'foodie': ['restaurants', 'cooking', 'food-tours', 'wine'],
      'mixed': ['sightseeing', 'culture', 'relaxation']
    };

    return interestMap[tripType] || ['general'];
  };

  // ==================== CLEANUP ====================

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }
    };
  }, []);

  // ==================== RETURN API ====================

  return {
    // State
    isSearching: apiState.isSearching,
    searchResults: apiState.searchResults,
    errors: apiState.errors,
    lastUpdate: apiState.lastUpdate,
    searchMetadata: apiState.searchMetadata,
    
    // Search functions
    searchTripData,
    searchFlights,
    searchHotels,
    searchActivities,
    refreshSearchResults,
    
    // Configuration
    setSearchOptions: (newOptions: Partial<SearchOptions>) => {
      searchOptionsRef.current = { ...searchOptionsRef.current, ...newOptions };
    },
    
    setRealTimeUpdates: (config: Partial<RealTimeUpdateConfig>) => {
      realTimeUpdateConfig.current = { ...realTimeUpdateConfig.current, ...config };
    },
    
    // Utilities
    clearErrors: () => setAPIState(prev => ({ ...prev, errors: {} })),
    clearResults: () => setAPIState(prev => ({
      ...prev,
      searchResults: { flights: [], hotels: [], activities: [], transport: [] }
    }))
  };
};

// ==================== WIZARD API SERVICE CLASS ====================

export class WizardAPIIntegrationService {
  private apiGateway: APIGatewayService;
  private subscribers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.apiGateway = apiGateway;
  }

  /**
   * Subscribe to real-time data updates for a specific search type
   */
  subscribe(
    searchType: 'flights' | 'hotels' | 'activities' | 'transport',
    callback: (data: any) => void
  ): () => void {
    const subscriptionId = `${searchType}-${Date.now()}-${Math.random()}`;
    this.subscribers.set(subscriptionId, callback);

    return () => {
      this.subscribers.delete(subscriptionId);
    };
  }

  /**
   * Notify subscribers of data updates
   */
  private notifySubscribers(searchType: string, data: any) {
    this.subscribers.forEach((callback, id) => {
      if (id.startsWith(searchType)) {
        callback(data);
      }
    });
  }

  /**
   * Batch search multiple services
   */
  async batchSearch(
    formData: TripFormData,
    services: ('flights' | 'hotels' | 'activities' | 'transport')[]
  ) {
    const searchContext = {
      formData,
      currentStep: 'review' as WizardStep
    };

    const searchIncludes = {
      includeFlights: services.includes('flights'),
      includeHotels: services.includes('hotels'),
      includeActivities: services.includes('activities'),
      includeTransport: services.includes('transport')
    };

    const result = await this.apiGateway.searchComprehensiveTrip(
      searchContext,
      searchIncludes
    );

    // Notify subscribers
    if (result.success) {
      services.forEach(service => {
        const data = result.data[service === 'flights' ? 'flights' : 
                                service === 'hotels' ? 'hotels' :
                                service === 'activities' ? 'activities' : 'transport'];
        this.notifySubscribers(service, data);
      });
    }

    return result;
  }

  dispose() {
    this.subscribers.clear();
    this.apiGateway.dispose();
  }
}

// ==================== SINGLETON INSTANCE ====================

export const wizardAPIService = new WizardAPIIntegrationService();

export default useWizardAPI;