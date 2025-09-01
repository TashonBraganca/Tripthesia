/**
 * Analytics Event Tracking System
 * Phase 1 Implementation - Privacy-focused event tracking without PII
 */

// Event definitions for Phase 1
export const ANALYTICS_EVENTS = {
  // Landing and navigation
  LANDING_VIEWED: 'landing_viewed',
  
  // Authentication flow
  SIGNIN_STARTED: 'signin_started',
  SIGNIN_COMPLETED: 'signin_completed',
  
  // Trip creation wizard
  WIZARD_STARTED: 'wizard_started',
  FIELD_SUGGEST_USED: 'field_suggest_used',
  DATE_RANGE_SET: 'date_range_set',
  TRIP_TYPE_SELECTED: 'trip_type_selected',
  STEPPER_JUMP: 'stepper_jump',
  PLAN_CREATED: 'plan_created',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Safe event properties (no PII)
export interface BaseEventProperties {
  // Device information
  device_type: 'desktop' | 'mobile' | 'tablet';
  user_agent: string;
  screen_resolution: string;
  
  // Geographic (IP-based, no precise location)
  country?: string;
  timezone: string;
  
  // Session context
  referrer?: string;
  page_path: string;
  session_id: string;
  
  // Timestamp
  timestamp: string;
}

// Specific event properties
export interface LandingViewedProperties extends BaseEventProperties {
  landing_section?: 'hero' | 'features' | 'pricing';
}

export interface AuthEventProperties extends BaseEventProperties {
  auth_method?: 'google' | 'email' | 'github';
}

export interface WizardEventProperties extends BaseEventProperties {
  wizard_step?: number;
  wizard_step_name?: string;
}

export interface FieldSuggestProperties extends BaseEventProperties {
  field_type: 'location_from' | 'location_to';
  suggestion_count: number;
  query_length: number;
}

export interface DateRangeProperties extends BaseEventProperties {
  date_range_days: number;
  preset_used?: 'weekend' | '3days' | '5days' | '7days';
  manual_selection: boolean;
}

export interface TripTypeProperties extends BaseEventProperties {
  trip_type: 'adventure' | 'business' | 'culture' | 'beach' | 'family' | 'foodie' | 'mixed';
  preview_viewed: boolean;
}

export interface StepperJumpProperties extends BaseEventProperties {
  from_step: number;
  to_step: number;
  step_name: string;
}

export interface PlanCreatedProperties extends BaseEventProperties {
  trip_duration: number;
  destination_count: number;
  trip_type: string;
  budget_range?: 'low' | 'medium' | 'high';
}

// Event property types union
export type EventProperties = 
  | LandingViewedProperties
  | AuthEventProperties  
  | WizardEventProperties
  | FieldSuggestProperties
  | DateRangeProperties
  | TripTypeProperties
  | StepperJumpProperties
  | PlanCreatedProperties
  | BaseEventProperties;

/**
 * Core analytics tracking function
 */
class AnalyticsTracker {
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined' && !this.isDevelopment();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBaseProperties(): BaseEventProperties {
    if (typeof window === 'undefined') {
      return {
        device_type: 'desktop',
        user_agent: '',
        screen_resolution: '',
        timezone: 'UTC',
        page_path: '/',
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      country: undefined, // Would be set by IP geolocation service
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || undefined,
      page_path: window.location.pathname,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvent, properties: Partial<EventProperties> = {}) {
    const eventData = {
      event,
      properties: {
        ...this.getBaseProperties(),
        ...properties,
      },
    };

    // In development, log to console
    if (this.isDevelopment()) {
      console.log('📊 Analytics Event:', eventData);
      return;
    }

    // In production, send to analytics service
    this.sendToAnalytics(eventData);
  }

  private sendToAnalytics(eventData: any) {
    // TODO: Integrate with analytics service (PostHog, Google Analytics, etc.)
    // For now, we'll just log in production as well for testing
    if (this.isEnabled) {
      console.log('📊 Analytics Event (Production):', eventData);
      
      // Example: Send to PostHog or similar service
      // posthog.capture(eventData.event, eventData.properties);
      
      // Example: Send to custom analytics endpoint
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData)
      // });
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();

// Convenience functions for common events
export const trackLandingView = (section?: 'hero' | 'features' | 'pricing') => {
  analytics.track(ANALYTICS_EVENTS.LANDING_VIEWED, { landing_section: section });
};

export const trackSigninStarted = (method?: 'google' | 'email' | 'github') => {
  analytics.track(ANALYTICS_EVENTS.SIGNIN_STARTED, { auth_method: method });
};

export const trackSigninCompleted = (method?: 'google' | 'email' | 'github') => {
  analytics.track(ANALYTICS_EVENTS.SIGNIN_COMPLETED, { auth_method: method });
};

export const trackWizardStarted = () => {
  analytics.track(ANALYTICS_EVENTS.WIZARD_STARTED, { wizard_step: 1, wizard_step_name: 'destination' });
};

export const trackFieldSuggest = (fieldType: 'location_from' | 'location_to', suggestionCount: number, queryLength: number) => {
  analytics.track(ANALYTICS_EVENTS.FIELD_SUGGEST_USED, {
    field_type: fieldType,
    suggestion_count: suggestionCount,
    query_length: queryLength,
  });
};

export const trackDateRangeSet = (days: number, preset?: 'weekend' | '3days' | '5days' | '7days') => {
  analytics.track(ANALYTICS_EVENTS.DATE_RANGE_SET, {
    date_range_days: days,
    preset_used: preset,
    manual_selection: !preset,
  });
};

export const trackTripTypeSelected = (tripType: string, previewViewed: boolean = true) => {
  analytics.track(ANALYTICS_EVENTS.TRIP_TYPE_SELECTED, {
    trip_type: tripType as any,
    preview_viewed: previewViewed,
  });
};

export const trackStepperJump = (fromStep: number, toStep: number, stepName: string) => {
  analytics.track(ANALYTICS_EVENTS.STEPPER_JUMP, {
    from_step: fromStep,
    to_step: toStep,
    step_name: stepName,
  });
};

export const trackPlanCreated = (duration: number, destinationCount: number, tripType: string, budgetRange?: 'low' | 'medium' | 'high') => {
  analytics.track(ANALYTICS_EVENTS.PLAN_CREATED, {
    trip_duration: duration,
    destination_count: destinationCount,
    trip_type: tripType,
    budget_range: budgetRange,
  });
};