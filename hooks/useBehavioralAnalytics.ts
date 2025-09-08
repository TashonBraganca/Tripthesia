/**
 * Behavioral Analytics React Hook - Phase 4.3.2
 * 
 * Seamless behavioral tracking integration for React components
 * Provides automated event tracking and real-time insights
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

// ==================== TYPES ====================

interface BehaviorEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventType: 'search' | 'view' | 'like' | 'dislike' | 'book' | 'share' | 'save' | 'skip' | 'time_spent' | 'click_through' | 'comparison' | 'filter_apply';
  targetType: string;
  targetId: string;
  eventData: Record<string, any>;
  duration?: number;
  sequence: number;
}

interface SessionContext {
  device: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  referrer?: string;
  utm?: Record<string, string>;
}

interface BehaviorInsights {
  patterns: any[];
  insights: any;
  summary: {
    totalPatterns: number;
    highConfidencePatterns: number;
    engagementScore: number;
    riskFactors: number;
    opportunities: number;
  };
}

interface UseBehavioralAnalyticsOptions {
  autoTrackPageViews?: boolean;
  autoTrackTimeSpent?: boolean;
  batchEvents?: boolean;
  batchSize?: number;
  batchTimeout?: number;
  enableDebug?: boolean;
}

// ==================== HOOK ====================

export function useBehavioralAnalytics(options: UseBehavioralAnalyticsOptions = {}) {
  const {
    autoTrackPageViews = true,
    autoTrackTimeSpent = true,
    batchEvents = true,
    batchSize = 5,
    batchTimeout = 10000, // 10 seconds
    enableDebug = false
  } = options;

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [eventQueue, setEventQueue] = useState<BehaviorEvent[]>([]);
  const [insights, setInsights] = useState<BehaviorInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const sequenceCounterRef = useRef(0);
  const pageStartTimeRef = useRef<number>(Date.now());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<BehaviorEvent | null>(null);

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Start behavioral analytics session
   */
  const startSession = useCallback(async () => {
    if (!user?.id || isSessionActive) return;

    try {
      const context: SessionContext = {
        device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer || undefined,
        utm: extractUtmParams()
      };

      const response = await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          sessionId,
          context
        })
      });

      if (response.ok) {
        setIsSessionActive(true);
        if (enableDebug) console.log('🔍 Behavioral analytics session started:', sessionId);
      }
    } catch (error) {
      if (enableDebug) console.error('Failed to start behavioral analytics session:', error);
    }
  }, [user?.id, sessionId, isSessionActive, enableDebug]);

  /**
   * End behavioral analytics session
   */
  const endSession = useCallback(async () => {
    if (!isSessionActive) return;

    // Flush any remaining events
    if (eventQueue.length > 0) {
      await flushEvents();
    }

    try {
      await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_session',
          sessionId
        })
      });

      setIsSessionActive(false);
      if (enableDebug) console.log('🔍 Behavioral analytics session ended:', sessionId);
    } catch (error) {
      if (enableDebug) console.error('Failed to end behavioral analytics session:', error);
    }
  }, [sessionId, isSessionActive, eventQueue, enableDebug]);

  // ==================== EVENT TRACKING ====================

  /**
   * Track a behavioral event
   */
  const trackEvent = useCallback(async (
    eventType: BehaviorEvent['eventType'],
    targetType: string,
    targetId: string,
    eventData: Record<string, any> = {},
    duration?: number
  ) => {
    if (!isSessionActive) return;

    const event: BehaviorEvent = {
      eventId: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      targetType,
      targetId,
      eventData: {
        ...eventData,
        pathname,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      duration,
      sequence: ++sequenceCounterRef.current
    };

    lastEventRef.current = event;

    if (batchEvents) {
      setEventQueue(prev => [...prev, event]);
      
      // Start batch timeout if not already running
      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(flushEvents, batchTimeout);
      }

      // Flush if batch size reached
      if (eventQueue.length + 1 >= batchSize) {
        flushEvents();
      }
    } else {
      await sendEvents([event]);
    }

    if (enableDebug) {
      console.log('🔍 Event tracked:', event);
    }
  }, [isSessionActive, sessionId, pathname, batchEvents, batchSize, batchTimeout, eventQueue, enableDebug]);

  /**
   * Flush queued events to the server
   */
  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    setEventQueue([]);

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    await sendEvents(eventsToSend);
  }, [eventQueue]);

  /**
   * Send events to the analytics API
   */
  const sendEvents = useCallback(async (events: BehaviorEvent[]) => {
    try {
      const response = await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_events',
          events
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (enableDebug) {
        console.log(`🔍 Sent ${events.length} events to analytics`);
      }
    } catch (error) {
      if (enableDebug) {
        console.error('Failed to send behavioral events:', error);
      }
      // Re-queue events on failure
      setEventQueue(prev => [...events, ...prev]);
    }
  }, [enableDebug]);

  // ==================== SPECIFIC EVENT TRACKERS ====================

  /**
   * Track page view
   */
  const trackPageView = useCallback((page?: string) => {
    const targetId = page || pathname;
    trackEvent('view', 'page', targetId, {
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }, [trackEvent, pathname]);

  /**
   * Track time spent on current page
   */
  const trackTimeSpent = useCallback(() => {
    const duration = Date.now() - pageStartTimeRef.current;
    if (duration > 5000) { // Only track if spent more than 5 seconds
      trackEvent('time_spent', 'page', pathname, {
        title: document.title
      }, Math.floor(duration / 1000));
    }
  }, [trackEvent, pathname]);

  /**
   * Track search event
   */
  const trackSearch = useCallback((query: string, filters?: Record<string, any>) => {
    trackEvent('search', 'search_query', query, {
      query,
      filters: filters || {},
      resultsPage: pathname
    });
  }, [trackEvent, pathname]);

  /**
   * Track interaction with specific content
   */
  const trackInteraction = useCallback((
    action: 'like' | 'dislike' | 'save' | 'share' | 'book',
    contentType: string,
    contentId: string,
    additionalData?: Record<string, any>
  ) => {
    trackEvent(action, contentType, contentId, {
      ...additionalData,
      actionTimestamp: Date.now()
    });
  }, [trackEvent]);

  /**
   * Track click-through events
   */
  const trackClickThrough = useCallback((linkType: string, targetUrl: string, context?: Record<string, any>) => {
    trackEvent('click_through', linkType, targetUrl, {
      targetUrl,
      context: context || {},
      sourceUrl: window.location.href
    });
  }, [trackEvent]);

  /**
   * Track filter application
   */
  const trackFilterApply = useCallback((filterType: string, filterValue: any, context?: Record<string, any>) => {
    trackEvent('filter_apply', filterType, String(filterValue), {
      filterType,
      filterValue,
      context: context || {},
      appliedAt: Date.now()
    });
  }, [trackEvent]);

  // ==================== INSIGHTS ====================

  /**
   * Fetch behavioral insights
   */
  const fetchInsights = useCallback(async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    if (!user?.id) return null;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/behavior?timeframe=${timeframe}&includePatterns=true&includeRecommendations=true`);
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.data);
        return data.data;
      }
    } catch (error) {
      if (enableDebug) console.error('Failed to fetch behavioral insights:', error);
    } finally {
      setIsLoading(false);
    }

    return null;
  }, [user?.id, enableDebug]);

  // ==================== EFFECTS ====================

  // Initialize session when user loads
  useEffect(() => {
    if (isLoaded && user?.id && !isSessionActive) {
      startSession();
    }
  }, [isLoaded, user?.id, isSessionActive, startSession]);

  // Track page views automatically
  useEffect(() => {
    if (autoTrackPageViews && isSessionActive) {
      pageStartTimeRef.current = Date.now();
      trackPageView();
    }
  }, [pathname, autoTrackPageViews, isSessionActive, trackPageView]);

  // Track time spent on page change or component unmount
  useEffect(() => {
    return () => {
      if (autoTrackTimeSpent && isSessionActive) {
        trackTimeSpent();
      }
    };
  }, [pathname, autoTrackTimeSpent, isSessionActive, trackTimeSpent]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoTrackTimeSpent && isSessionActive) {
        trackTimeSpent();
      }
      if (eventQueue.length > 0) {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon('/api/analytics/behavior', JSON.stringify({
          action: 'track_events',
          events: eventQueue
        }));
      }
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoTrackTimeSpent, isSessionActive, eventQueue, trackTimeSpent, endSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // ==================== UTILITY FUNCTIONS ====================

  function extractUtmParams(): Record<string, string> | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) utmParams[param] = value;
    });

    return Object.keys(utmParams).length > 0 ? utmParams : undefined;
  }

  // ==================== RETURN HOOK INTERFACE ====================

  return {
    // Session management
    sessionId,
    isSessionActive,
    startSession,
    endSession,

    // Event tracking
    trackEvent,
    trackPageView,
    trackSearch,
    trackInteraction,
    trackClickThrough,
    trackFilterApply,
    flushEvents,

    // Insights
    insights,
    fetchInsights,
    isLoading,

    // Utilities
    lastEvent: lastEventRef.current,
    eventQueueSize: eventQueue.length
  };
}

// ==================== HELPER HOOKS ====================

/**
 * Simplified hook for basic event tracking
 */
export function useSimpleBehaviorTracking() {
  const { trackInteraction, trackSearch, trackClickThrough } = useBehavioralAnalytics();

  return {
    trackLike: (contentType: string, contentId: string) => 
      trackInteraction('like', contentType, contentId),
    trackSave: (contentType: string, contentId: string) => 
      trackInteraction('save', contentType, contentId),
    trackShare: (contentType: string, contentId: string) => 
      trackInteraction('share', contentType, contentId),
    trackBook: (contentType: string, contentId: string) => 
      trackInteraction('book', contentType, contentId),
    trackSearch,
    trackClickThrough
  };
}

/**
 * Hook for insights and analytics dashboard
 */
export function useBehavioralInsights(timeframe: 'day' | 'week' | 'month' = 'week') {
  const { insights, fetchInsights, isLoading } = useBehavioralAnalytics();

  useEffect(() => {
    fetchInsights(timeframe);
  }, [timeframe, fetchInsights]);

  return {
    insights,
    isLoading,
    refresh: () => fetchInsights(timeframe)
  };
}