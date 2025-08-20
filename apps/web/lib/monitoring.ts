import * as Sentry from '@sentry/nextjs';
import { PostHog } from 'posthog-node';

// Initialize Sentry (only in production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
    profilesSampleRate: 0.1, // Set profiling sampling rate
    beforeSend(event, hint) {
      // Filter out noise and PII
      if (event.exception?.values?.[0]?.value?.includes('Non-Error')) {
        return null;
      }
      
      // Remove sensitive data
      if (event.request?.data) {
        delete event.request.data;
      }
      
      return event;
    },
    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction?.includes('/api/health') || 
          event.transaction?.includes('/api/cron/')) {
        return null;
      }
      return event;
    },
    ignoreErrors: [
      // Ignore common browser errors
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
      'Network request failed',
      // Ignore clerk auth errors (handled gracefully)
      'ClerkAPIResponseError',
    ],
  });
}

// Initialize PostHog (server-side)
export const posthog = process.env.NEXT_PUBLIC_POSTHOG_KEY 
  ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  : null;

// Custom error tracking
export function trackError(error: Error | string, context?: Record<string, any>) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error tracked:', errorMessage, context);
  }
  
  // Send to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(typeof error === 'string' ? new Error(error) : error, {
      contexts: { custom: context },
    });
  }
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>, userId?: string) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Event tracked:', eventName, properties);
  }
  
  // Send to PostHog
  if (posthog && userId) {
    posthog.capture({
      distinctId: userId,
      event: eventName,
      properties,
    });
  }
}

// Performance monitoring
export function trackPerformance(
  operation: string, 
  startTime: number, 
  metadata?: Record<string, any>
) {
  const duration = Date.now() - startTime;
  
  // Log slow operations
  if (duration > 1000) {
    console.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
  }
  
  // Track in PostHog
  trackEvent('performance_metric', {
    operation,
    duration,
    ...metadata,
  });
  
  // Send to Sentry for very slow operations
  if (duration > 5000) {
    Sentry.addBreadcrumb({
      message: `Slow operation: ${operation}`,
      level: 'warning',
      data: { duration, ...metadata },
    });
  }
}

// User journey tracking
export function trackUserJourney(step: string, userId?: string, metadata?: Record<string, any>) {
  trackEvent('user_journey', {
    step,
    timestamp: new Date().toISOString(),
    ...metadata,
  }, userId);
}

// Trip generation tracking
export function trackTripGeneration(
  phase: 'started' | 'completed' | 'failed',
  tripId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  trackEvent('trip_generation', {
    phase,
    tripId,
    timestamp: new Date().toISOString(),
    ...metadata,
  }, userId);
  
  if (phase === 'failed' && metadata?.error) {
    trackError(metadata.error as string, { tripId, userId, ...metadata });
  }
}

// API performance tracking
export function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  trackEvent('api_call', {
    endpoint,
    method,
    statusCode,
    duration,
    success: statusCode < 400,
    timestamp: new Date().toISOString(),
  }, userId);
  
  // Track errors separately
  if (statusCode >= 400) {
    trackError(`API Error: ${method} ${endpoint} - ${statusCode}`, {
      endpoint,
      method,
      statusCode,
      duration,
      userId,
    });
  }
}

// Database operation tracking
export function trackDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: string
) {
  trackEvent('database_operation', {
    operation,
    table,
    duration,
    success,
    timestamp: new Date().toISOString(),
  });
  
  if (!success && error) {
    trackError(`Database Error: ${operation} on ${table}`, {
      operation,
      table,
      duration,
      error,
    });
  }
}

// Feature usage tracking
export function trackFeatureUsage(
  feature: string,
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  trackEvent('feature_usage', {
    feature,
    action,
    timestamp: new Date().toISOString(),
    ...metadata,
  }, userId);
}

// Business metrics tracking
export function trackBusinessMetric(
  metric: string,
  value: number,
  userId?: string,
  metadata?: Record<string, any>
) {
  trackEvent('business_metric', {
    metric,
    value,
    timestamp: new Date().toISOString(),
    ...metadata,
  }, userId);
}

// Helper to flush events (useful for serverless)
export async function flushEvents() {
  if (posthog) {
    await posthog.shutdown();
  }
}

// Error boundary helper
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          trackError(error, { context, args });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      trackError(error as Error, { context, args });
      throw error;
    }
  }) as T;
}

// Rate limiting monitoring
export function trackRateLimit(
  identifier: string,
  limit: number,
  current: number,
  window: string
) {
  const percentage = (current / limit) * 100;
  
  trackEvent('rate_limit_status', {
    identifier,
    limit,
    current,
    window,
    percentage,
    timestamp: new Date().toISOString(),
  });
  
  // Alert when approaching limits
  if (percentage > 80) {
    console.warn(`Rate limit warning: ${identifier} at ${percentage}% (${current}/${limit})`);
    
    if (percentage > 95) {
      trackError(`Rate limit nearly exceeded: ${identifier}`, {
        identifier,
        limit,
        current,
        percentage,
      });
    }
  }
}

export { Sentry };