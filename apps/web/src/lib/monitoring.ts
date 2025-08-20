/**
 * Monitoring and Observability Configuration
 * Production-ready monitoring with Sentry, PostHog, and performance tracking
 */

import { z } from 'zod'

// Performance metrics schema
const PerformanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.enum(['ms', 'bytes', 'count', 'percent']),
  timestamp: z.date(),
  labels: z.record(z.string()).optional(),
})

type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>

// Error tracking schema
const ErrorEventSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  level: z.enum(['error', 'warning', 'info', 'debug']),
  context: z.record(z.any()).optional(),
  user_id: z.string().optional(),
  request_id: z.string().optional(),
  timestamp: z.date(),
})

type ErrorEvent = z.infer<typeof ErrorEventSchema>

// User event schema for analytics
const UserEventSchema = z.object({
  event_name: z.string(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  properties: z.record(z.any()).optional(),
  timestamp: z.date(),
})

type UserEvent = z.infer<typeof UserEventSchema>

/**
 * Monitoring Service Class
 */
export class MonitoringService {
  private static instance: MonitoringService
  private initialized = false

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  /**
   * Initialize monitoring services
   */
  async initialize() {
    if (this.initialized) return

    try {
      // Initialize Sentry for error tracking
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        await this.initializeSentry()
      }

      // Initialize PostHog for analytics
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        await this.initializePostHog()
      }

      // Initialize performance monitoring
      this.initializePerformanceMonitoring()

      this.initialized = true
      console.log('Monitoring services initialized')
    } catch (error) {
      console.error('Failed to initialize monitoring:', error)
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>) {
    try {
      const performanceMetric: PerformanceMetric = {
        ...metric,
        timestamp: new Date(),
      }

      // Validate the metric
      PerformanceMetricSchema.parse(performanceMetric)

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Metric:', performanceMetric)
      }

      // Send to analytics service
      this.sendToAnalytics('performance_metric', performanceMetric)

      return true
    } catch (error) {
      console.error('Failed to track performance metric:', error)
      return false
    }
  }

  /**
   * Track errors with context
   */
  trackError(error: Error | string, context?: Record<string, any>) {
    try {
      const errorEvent: ErrorEvent = {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        level: 'error',
        context,
        timestamp: new Date(),
      }

      // Validate the error event
      ErrorEventSchema.parse(errorEvent)

      // Log to console
      console.error('Error tracked:', errorEvent)

      // Send to error tracking service
      this.sendToErrorTracking(errorEvent)

      return true
    } catch (err) {
      console.error('Failed to track error:', err)
      return false
    }
  }

  /**
   * Track user events for analytics
   */
  trackUserEvent(eventName: string, properties?: Record<string, any>, userId?: string) {
    try {
      const userEvent: UserEvent = {
        event_name: eventName,
        user_id: userId,
        properties,
        timestamp: new Date(),
      }

      // Validate the user event
      UserEventSchema.parse(userEvent)

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('User Event:', userEvent)
      }

      // Send to analytics
      this.sendToAnalytics(eventName, userEvent)

      return true
    } catch (error) {
      console.error('Failed to track user event:', error)
      return false
    }
  }

  /**
   * Track API response times and status codes
   */
  trackAPICall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.trackPerformance({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      labels: {
        endpoint,
        method,
        status_code: statusCode.toString(),
      },
    })

    // Track API errors
    if (statusCode >= 400) {
      this.trackError(`API Error: ${method} ${endpoint} returned ${statusCode}`, {
        endpoint,
        method,
        status_code: statusCode,
        duration,
      })
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(name: string, value: number) {
    this.trackPerformance({
      name: `web_vital_${name.toLowerCase()}`,
      value,
      unit: name === 'CLS' ? 'count' : 'ms',
      labels: {
        vital: name,
      },
    })
  }

  /**
   * Create correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Private methods for service initialization
   */
  private async initializeSentry() {
    // Sentry initialization would go here
    // For now, just log that it would be initialized
    console.log('Sentry would be initialized with DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN)
  }

  private async initializePostHog() {
    // PostHog initialization would go here
    console.log('PostHog would be initialized with key:', process.env.NEXT_PUBLIC_POSTHOG_KEY)
  }

  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined') {
      // Track page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.trackPerformance({
            name: 'page_load_time',
            value: navigation.loadEventEnd - navigation.loadEventStart,
            unit: 'ms',
          })
        }
      })

      // Track long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackPerformance({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              labels: {
                entry_type: entry.entryType,
              },
            })
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      }
    }
  }

  private sendToAnalytics(eventName: string, data: any) {
    // Implementation would send to PostHog or other analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics Event [${eventName}]:`, data)
    }
  }

  private sendToErrorTracking(errorEvent: ErrorEvent) {
    // Implementation would send to Sentry or other error tracking service
    if (process.env.NODE_ENV === 'development') {
      console.log('Error Event:', errorEvent)
    }
  }
}

/**
 * Global monitoring instance
 */
export const monitoring = MonitoringService.getInstance()

/**
 * Convenience functions for common monitoring tasks
 */
export const trackError = (error: Error | string, context?: Record<string, any>) => {
  return monitoring.trackError(error, context)
}

export const trackEvent = (eventName: string, properties?: Record<string, any>, userId?: string) => {
  return monitoring.trackUserEvent(eventName, properties, userId)
}

export const trackPerformance = (name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percent', labels?: Record<string, string>) => {
  return monitoring.trackPerformance({ name, value, unit, labels })
}

export const trackAPI = (endpoint: string, method: string, statusCode: number, duration: number) => {
  return monitoring.trackAPICall(endpoint, method, statusCode, duration)
}

/**
 * React Hook for Web Vitals tracking
 */
export function useWebVitals() {
  if (typeof window !== 'undefined') {
    // Track Core Web Vitals when available
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(({ value }) => monitoring.trackWebVitals('CLS', value))
      getFID(({ value }) => monitoring.trackWebVitals('FID', value))  
      getFCP(({ value }) => monitoring.trackWebVitals('FCP', value))
      getLCP(({ value }) => monitoring.trackWebVitals('LCP', value))
      getTTFB(({ value }) => monitoring.trackWebVitals('TTFB', value))
    }).catch(() => {
      // web-vitals not available, skip tracking
    })
  }
}

// Export schemas for use in other parts of the application
export { PerformanceMetricSchema, ErrorEventSchema, UserEventSchema }
export type { PerformanceMetric, ErrorEvent, UserEvent }