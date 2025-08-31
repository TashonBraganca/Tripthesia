"use client"

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetric {
  type: 'core-web-vitals' | 'api-performance' | 'page-load' | 'user-interaction';
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  url?: string;
  timestamp: string;
  additionalData?: Record<string, any>;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export function PerformanceMonitor({
  enabled = true,
  batchSize = 10,
  flushInterval = 5000
}: PerformanceMonitorProps) {
  const metricsQueue = useRef<PerformanceMetric[]>([]);
  const isFlushingRef = useRef(false);
  const sessionId = useRef<string>();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Generate session ID
    sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize Core Web Vitals monitoring
    initializeCoreWebVitals();

    // Initialize Page Load monitoring
    initializePageLoadMonitoring();

    // Initialize User Interaction monitoring
    initializeUserInteractionMonitoring();

    // Set up periodic flush
    const flushIntervalId = setInterval(() => {
      if (metricsQueue.current.length > 0) {
        flushMetrics();
      }
    }, flushInterval);

    // Flush on page unload
    const handleBeforeUnload = () => {
      if (metricsQueue.current.length > 0) {
        flushMetrics(true); // Synchronous flush
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(flushIntervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (metricsQueue.current.length > 0) {
        flushMetrics(true);
      }
    };
  }, [enabled, batchSize, flushInterval]);

  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'timestamp' | 'url' | 'id'>) => {
    if (!enabled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    metricsQueue.current.push(fullMetric);

    // Flush immediately if batch size reached
    if (metricsQueue.current.length >= batchSize) {
      flushMetrics();
    }
  }, [enabled, batchSize]);

  const flushMetrics = useCallback(async (synchronous = false) => {
    if (isFlushingRef.current || metricsQueue.current.length === 0) return;

    isFlushingRef.current = true;
    const metricsToSend = [...metricsQueue.current];
    metricsQueue.current = [];

    const payload = {
      metrics: metricsToSend,
      sessionId: sessionId.current!,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      if (synchronous) {
        // Use sendBeacon for synchronous sending during page unload
        navigator.sendBeacon('/api/monitoring/performance', JSON.stringify(payload));
      } else {
        await fetch('/api/monitoring/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-queue failed metrics
      metricsQueue.current.unshift(...metricsToSend);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const initializeCoreWebVitals = useCallback(() => {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;

          recordMetric({
            type: 'core-web-vitals',
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor'
          });
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fid = (entry as any).processingStart - entry.startTime;
            recordMetric({
              type: 'core-web-vitals',
              name: 'FID',
              value: fid,
              rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
            });
          }
        });

        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }

          recordMetric({
            type: 'core-web-vitals',
            name: 'CLS',
            value: clsValue,
            rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
          });
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              recordMetric({
                type: 'core-web-vitals',
                name: 'FCP',
                value: entry.startTime,
                rating: entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor'
              });
            }
          }
        });

        fcpObserver.observe({ entryTypes: ['paint'] });

      } catch (error) {
        console.error('Error initializing Core Web Vitals monitoring:', error);
      }
    }
  }, [recordMetric]);

  const initializePageLoadMonitoring = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // Total page load time
          recordMetric({
            type: 'page-load',
            name: 'total-load-time',
            value: navigation.loadEventEnd - navigation.fetchStart,
            additionalData: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              firstByte: navigation.responseStart - navigation.requestStart,
              dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcpConnect: navigation.connectEnd - navigation.connectStart
            }
          });

          // DOM Content Loaded
          recordMetric({
            type: 'page-load',
            name: 'dom-content-loaded',
            value: navigation.domContentLoadedEventEnd - navigation.fetchStart
          });

          // Time to First Byte (TTFB)
          recordMetric({
            type: 'core-web-vitals',
            name: 'TTFB',
            value: navigation.responseStart - navigation.requestStart,
            rating: (navigation.responseStart - navigation.requestStart) <= 800 ? 'good' : 
                   (navigation.responseStart - navigation.requestStart) <= 1800 ? 'needs-improvement' : 'poor'
          });
        }
      }, 100);
    });
  }, [recordMetric]);

  const initializeUserInteractionMonitoring = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Track click interactions
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      recordMetric({
        type: 'user-interaction',
        name: 'click',
        value: Date.now(),
        additionalData: {
          tagName,
          className: target.className,
          id: target.id,
          text: target.textContent?.substring(0, 50)
        }
      });
    };

    // Track form submissions
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      recordMetric({
        type: 'user-interaction',
        name: 'form-submit',
        value: Date.now(),
        additionalData: {
          formId: form.id,
          formClass: form.className,
          fieldsCount: form.elements.length
        }
      });
    };

    // Track scroll depth
    let maxScrollDepth = 0;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        if (scrollPercent % 25 === 0) { // Report every 25% milestone
          recordMetric({
            type: 'user-interaction',
            name: 'scroll-depth',
            value: scrollPercent,
            additionalData: {
              scrollTop,
              scrollHeight,
              viewportHeight: window.innerHeight
            }
          });
        }
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [recordMetric]);

  // This component doesn't render anything
  return null;
}

// Hook to manually record performance metrics
export function usePerformanceTracking() {
  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'timestamp' | 'url' | 'id'>) => {
    // This would ideally connect to the same recording system
    // For now, we'll use a simple fetch
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    fetch('/api/monitoring/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [fullMetric],
        sessionId: `session_${Date.now()}`,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Failed to record performance metric:', error);
    });
  }, []);

  return { recordMetric };
}

// API performance tracking helper
export function trackAPIPerformance(endpoint: string, method: string, duration: number, status: number) {
  if (typeof window === 'undefined') return;

  const rating = duration <= 200 ? 'good' : duration <= 1000 ? 'needs-improvement' : 'poor';
  
  fetch('/api/monitoring/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metrics: [{
        type: 'api-performance',
        name: 'response-time',
        value: duration,
        rating,
        id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        additionalData: {
          endpoint,
          method,
          status
        }
      }],
      sessionId: `session_${Date.now()}`,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  }).catch(error => {
    console.error('Failed to track API performance:', error);
  });
}