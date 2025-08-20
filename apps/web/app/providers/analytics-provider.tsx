'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Initialize PostHog only on client side
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        
        // Configuration
        autocapture: false, // We'll manually track important events
        capture_pageview: true,
        capture_pageleave: true,
        
        // Privacy settings
        mask_all_element_attributes: true,
        mask_all_text: false,
        
        // Performance
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
        
        // Persistence
        persistence: 'localStorage+cookie',
        
        // Session recording (disabled for privacy by default)
        disable_session_recording: true,
        
        // Feature flags
        bootstrap: {
          // Add any bootstrap feature flags here
        },
      });
    }
  }, []);

  useEffect(() => {
    // Identify user when available
    if (isLoaded && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        // Don't include sensitive data
      });
    } else if (isLoaded && !user) {
      // Reset when user logs out
      posthog.reset();
    }
  }, [user, isLoaded]);

  const track = (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(event, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    }
  };

  const identify = (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  };

  const reset = () => {
    if (typeof window !== 'undefined') {
      posthog.reset();
    }
  };

  const value: AnalyticsContextType = {
    track,
    identify,
    reset,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Convenience hooks for common tracking scenarios
export function useTrackPageView() {
  const { track } = useAnalytics();
  
  useEffect(() => {
    track('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
    });
  }, [track]);
}

export function useTrackFeature(feature: string) {
  const { track } = useAnalytics();
  
  return (action: string, properties?: Record<string, any>) => {
    track('feature_usage', {
      feature,
      action,
      ...properties,
    });
  };
}

export function useTrackUserJourney() {
  const { track } = useAnalytics();
  
  return (step: string, properties?: Record<string, any>) => {
    track('user_journey', {
      step,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  };
}

export function useTrackConversion() {
  const { track } = useAnalytics();
  
  return (event: string, value?: number, properties?: Record<string, any>) => {
    track('conversion', {
      event,
      value,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  };
}