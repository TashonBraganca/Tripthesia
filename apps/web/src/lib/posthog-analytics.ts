/**
 * PostHog Analytics Integration
 * User journey tracking and conversion funnel monitoring
 */

import { PostHog } from 'posthog-js';

// Initialize PostHog client-side
let posthog: PostHog | null = null;

export const initPostHog = () => {
  if (typeof window === 'undefined' || posthog) return;

  const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!POSTHOG_KEY) {
    console.warn('PostHog API key not found');
    return;
  }

  // Dynamic import to avoid SSR issues
  import('posthog-js').then(({ default: PostHogJS }) => {
    posthog = PostHogJS.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll capture manually
      capture_pageleave: true,
      loaded: (posthog) => {
        console.log('PostHog loaded successfully');
      },
      // Enable session recording for user experience insights
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true
        }
      },
      // Autocapture settings
      autocapture: {
        dom_event_allowlist: ['click', 'change', 'submit'],
        url_allowlist: [window.location.host],
        element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea']
      }
    });
  });
};

// Get PostHog instance
export const getPostHog = () => posthog;

// User identification
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (!posthog) return;
  
  posthog.identify(userId, {
    userId,
    ...traits,
    platform: 'web',
    source: 'tripthesia'
  });
};

// Reset user on logout
export const resetUser = () => {
  if (!posthog) return;
  posthog.reset();
};

// Page tracking
export const trackPage = (pageName: string, properties?: Record<string, any>) => {
  if (!posthog) return;
  
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    $pathname: window.location.pathname,
    page_name: pageName,
    ...properties
  });
};

// Event tracking with custom properties
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!posthog) return;
  
  posthog.capture(eventName, {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    pathname: window.location.pathname,
    ...properties
  });
};

// Trip Planning Funnel Events
export const trackTripPlanningFunnel = {
  // Landing page interactions
  landingPageView: (source?: string, campaign?: string) => {
    trackEvent('funnel_landing_view', {
      funnel_step: 1,
      step_name: 'landing_page',
      traffic_source: source,
      campaign
    });
  },

  demoWidgetInteraction: (action: string) => {
    trackEvent('funnel_demo_interaction', {
      funnel_step: 1.5,
      step_name: 'demo_widget',
      action
    });
  },

  // Trip wizard steps
  wizardStarted: () => {
    trackEvent('funnel_wizard_started', {
      funnel_step: 2,
      step_name: 'wizard_start'
    });
  },

  wizardStepCompleted: (step: number, stepName: string, data?: any) => {
    trackEvent('funnel_wizard_step', {
      funnel_step: 2 + (step * 0.25),
      step_name: `wizard_${stepName}`,
      wizard_step: step,
      step_data: data
    });
  },

  wizardCompleted: (tripData: any) => {
    trackEvent('funnel_wizard_completed', {
      funnel_step: 3,
      step_name: 'wizard_complete',
      destination: tripData.destination,
      duration: tripData.duration,
      budget: tripData.budget,
      trip_type: tripData.tripType
    });
  },

  // Trip generation
  generationStarted: (tripId: string) => {
    trackEvent('funnel_generation_started', {
      funnel_step: 4,
      step_name: 'generation_start',
      trip_id: tripId
    });
  },

  generationCompleted: (tripId: string, duration: number) => {
    trackEvent('funnel_generation_completed', {
      funnel_step: 5,
      step_name: 'generation_complete',
      trip_id: tripId,
      generation_duration: duration
    });
  },

  // Planner interactions
  plannerViewed: (tripId: string) => {
    trackEvent('funnel_planner_view', {
      funnel_step: 6,
      step_name: 'planner_view',
      trip_id: tripId
    });
  },

  plannerEngagement: (tripId: string, action: string, duration: number) => {
    trackEvent('funnel_planner_engagement', {
      funnel_step: 6.5,
      step_name: 'planner_engage',
      trip_id: tripId,
      action,
      engagement_duration: duration
    });
  },

  // Subscription conversion
  subscriptionViewed: (tier?: string) => {
    trackEvent('funnel_subscription_view', {
      funnel_step: 7,
      step_name: 'subscription_view',
      tier
    });
  },

  subscriptionStarted: (tier: string) => {
    trackEvent('funnel_subscription_started', {
      funnel_step: 8,
      step_name: 'subscription_start',
      tier
    });
  },

  subscriptionCompleted: (tier: string, amount: number, currency: string) => {
    trackEvent('funnel_subscription_completed', {
      funnel_step: 9,
      step_name: 'subscription_complete',
      tier,
      amount,
      currency,
      $set: {
        subscription_tier: tier,
        is_subscriber: true
      }
    });
  }
};

// User Journey Events
export const trackUserJourney = {
  // Session events
  sessionStart: () => {
    trackEvent('session_start', {
      session_timestamp: Date.now()
    });
  },

  sessionEnd: (duration: number) => {
    trackEvent('session_end', {
      session_duration: duration
    });
  },

  // Feature usage
  featureUsed: (feature: string, context?: any) => {
    trackEvent('feature_used', {
      feature,
      context
    });
  },

  // Search and discovery
  searchPerformed: (query: string, results: number, type: 'destination' | 'activity' | 'transport') => {
    trackEvent('search_performed', {
      search_query: query,
      search_type: type,
      results_count: results
    });
  },

  filterApplied: (filterType: string, filterValue: any) => {
    trackEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue
    });
  },

  // Booking interactions
  bookingClicked: (provider: string, type: 'flight' | 'hotel' | 'activity', price?: number) => {
    trackEvent('booking_clicked', {
      booking_provider: provider,
      booking_type: type,
      booking_price: price
    });
  },

  // Social sharing
  contentShared: (type: 'trip' | 'activity' | 'destination', method: string) => {
    trackEvent('content_shared', {
      share_type: type,
      share_method: method
    });
  },

  // Error tracking
  errorEncountered: (error: string, context: any) => {
    trackEvent('error_encountered', {
      error_message: error,
      error_context: context,
      page: window.location.pathname
    });
  }
};

// A/B Testing Support
export const trackExperiment = (experimentName: string, variant: string) => {
  if (!posthog) return;
  
  posthog.capture('$experiment_started', {
    experiment_name: experimentName,
    variant
  });
  
  // Set user property for cohort analysis
  posthog.setPersonProperties({
    [`experiment_${experimentName}`]: variant
  });
};

// Feature Flags
export const getFeatureFlag = (flagKey: string): boolean | string | undefined => {
  if (!posthog) return undefined;
  return posthog.getFeatureFlag(flagKey);
};

export const isFeatureEnabled = (flagKey: string): boolean => {
  if (!posthog) return false;
  return posthog.isFeatureEnabled(flagKey);
};

// User Properties Management
export const setUserProperties = (properties: Record<string, any>) => {
  if (!posthog) return;
  posthog.setPersonProperties(properties);
};

export const setUserProperty = (key: string, value: any) => {
  if (!posthog) return;
  posthog.setPersonProperties({ [key]: value });
};

// Group Analytics (for team/company tracking)
export const identifyGroup = (groupType: string, groupKey: string, properties?: Record<string, any>) => {
  if (!posthog) return;
  posthog.group(groupType, groupKey, properties);
};

// Revenue Tracking
export const trackRevenue = (amount: number, currency: string, tier: string) => {
  if (!posthog) return;
  
  trackEvent('subscription_revenue', {
    revenue: amount,
    currency,
    tier,
    $set: {
      total_revenue: amount
    }
  });
};

// Performance Tracking
export const trackPerformance = (metric: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') => {
  if (!posthog) return;
  
  trackEvent('performance_metric', {
    metric_name: metric,
    metric_value: value,
    metric_unit: unit,
    page: window.location.pathname
  });
};

// Custom Cohort Events
export const trackCohortEvent = (cohortName: string, eventData: Record<string, any>) => {
  if (!posthog) return;
  
  trackEvent(`cohort_${cohortName}`, {
    cohort: cohortName,
    ...eventData
  });
};

// Debug mode for development
export const enableDebugMode = () => {
  if (!posthog || process.env.NODE_ENV !== 'development') return;
  
  console.log('PostHog debug mode enabled');
  posthog.debug(true);
};

// Consent management
export const optIn = () => {
  if (!posthog) return;
  posthog.opt_in_capturing();
};

export const optOut = () => {
  if (!posthog) return;
  posthog.opt_out_capturing();
};

// Session replay controls
export const startSessionRecording = () => {
  if (!posthog) return;
  posthog.startSessionRecording();
};

export const stopSessionRecording = () => {
  if (!posthog) return;
  posthog.stopSessionRecording();
};

// Initialize on client-side
if (typeof window !== 'undefined') {
  initPostHog();
}