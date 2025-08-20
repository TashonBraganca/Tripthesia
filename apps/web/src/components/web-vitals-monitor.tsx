/**
 * Web Vitals Monitoring Component
 * Tracks Core Web Vitals and sends data to monitoring service
 */

"use client";

import { useEffect } from 'react';
import { trackPerformance } from '@/lib/monitoring';

// Web Vitals thresholds (Google's recommended values)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay  
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
};

type VitalName = keyof typeof THRESHOLDS;

interface WebVital {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export function WebVitalsMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    let isFirstLoad = true;

    // Function to get rating based on value and thresholds
    const getRating = (name: VitalName, value: number): WebVital['rating'] => {
      const threshold = THRESHOLDS[name];
      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'needs-improvement';
      return 'poor';
    };

    // Function to handle each web vital
    const handleWebVital = (vital: WebVital) => {
      const rating = getRating(vital.name, vital.value);
      
      // Track the metric
      trackPerformance(
        `web_vital_${vital.name.toLowerCase()}`,
        vital.value,
        vital.name === 'CLS' ? 'count' : 'ms',
        {
          rating,
          page: window.location.pathname,
          navigation_type: vital.navigationType,
          connection_type: getConnectionType(),
          device_type: getDeviceType(),
          is_first_load: isFirstLoad.toString()
        }
      );

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${vital.name}: ${vital.value} (${rating})`, vital);
      }

      // Send to analytics if poor performance
      if (rating === 'poor') {
        console.warn(`Poor ${vital.name} performance:`, {
          value: vital.value,
          threshold: THRESHOLDS[vital.name].good,
          page: window.location.pathname
        });
      }
    };

    // Get connection type
    const getConnectionType = (): string => {
      const connection = (navigator as any)?.connection;
      return connection?.effectiveType || connection?.type || 'unknown';
    };

    // Get device type
    const getDeviceType = (): string => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    // Measure page load performance
    const measurePageLoad = () => {
      if (window.performance && window.performance.navigation) {
        const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (perfData) {
          // DNS Lookup Time
          const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
          trackPerformance('dns_lookup_time', dnsTime, 'ms');

          // TCP Connection Time  
          const tcpTime = perfData.connectEnd - perfData.connectStart;
          trackPerformance('tcp_connection_time', tcpTime, 'ms');

          // Server Response Time
          const serverTime = perfData.responseStart - perfData.requestStart;
          trackPerformance('server_response_time', serverTime, 'ms');

          // DOM Processing Time
          const domTime = perfData.domContentLoadedEventEnd - perfData.responseEnd;
          trackPerformance('dom_processing_time', domTime, 'ms');

          // Total Page Load Time
          const loadTime = perfData.loadEventEnd - perfData.navigationStart;
          if (loadTime > 0) {
            trackPerformance('page_load_time', loadTime, 'ms', {
              page: window.location.pathname
            });
          }
        }
      }
    };

    // Measure resource loading performance
    const measureResourceLoading = () => {
      const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalImageSize = 0;
      let totalImageTime = 0;
      let imageCount = 0;
      
      let totalJSSize = 0;
      let totalJSTime = 0;
      let jsCount = 0;
      
      let totalCSSTime = 0;
      let cssCount = 0;

      resources.forEach((resource) => {
        const duration = resource.responseEnd - resource.startTime;
        const size = resource.transferSize || 0;
        
        if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          totalImageSize += size;
          totalImageTime += duration;
          imageCount++;
        } else if (resource.name.match(/\.(js)$/i)) {
          totalJSSize += size;
          totalJSTime += duration;
          jsCount++;
        } else if (resource.name.match(/\.(css)$/i)) {
          totalCSSTime += duration;
          cssCount++;
        }
      });

      // Track resource metrics
      if (imageCount > 0) {
        trackPerformance('avg_image_load_time', totalImageTime / imageCount, 'ms');
        trackPerformance('total_image_size', totalImageSize, 'bytes');
      }
      
      if (jsCount > 0) {
        trackPerformance('avg_js_load_time', totalJSTime / jsCount, 'ms');
        trackPerformance('total_js_size', totalJSSize, 'bytes');
      }
      
      if (cssCount > 0) {
        trackPerformance('avg_css_load_time', totalCSSTime / cssCount, 'ms');
      }
    };

    // Import and initialize web-vitals
    const initWebVitals = async () => {
      try {
        const webVitalsModule = await import('web-vitals');
        
        // Measure all Core Web Vitals
        webVitalsModule.getCLS(handleWebVital);
        webVitalsModule.getFID(handleWebVital);  
        webVitalsModule.getFCP(handleWebVital);
        webVitalsModule.getLCP(handleWebVital);
        webVitalsModule.getTTFB(handleWebVital);
        
        // Mark as no longer first load after initial measurements
        setTimeout(() => { isFirstLoad = false; }, 1000);
        
      } catch (error) {
        console.error('Failed to load web-vitals:', error);
      }
    };

    // Initialize measurements
    initWebVitals();
    
    // Measure page load performance after load event
    if (document.readyState === 'complete') {
      measurePageLoad();
      measureResourceLoading();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          measurePageLoad();
          measureResourceLoading();
        }, 100);
      });
    }

    // Track route changes (for SPA navigation)
    const handleRouteChange = () => {
      trackPerformance('route_change', performance.now(), 'ms', {
        to: window.location.pathname
      });
    };

    // Listen for history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };
    
    window.addEventListener('popstate', handleRouteChange);

    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              trackPerformance('long_task', entry.duration, 'ms', {
                page: window.location.pathname,
                entry_type: entry.entryType
              });
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Long task observer not supported
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

// Hook for manual performance tracking
export function useWebVitals() {
  useEffect(() => {
    // This will be handled by the WebVitalsMonitor component
  }, []);
}

// Utility function to get current page performance metrics
export async function getCurrentWebVitals(): Promise<Record<string, number>> {
  if (typeof window === 'undefined') return {};
  
  try {
    const webVitals = await import('web-vitals');
    const metrics: Record<string, number> = {};
    
    return new Promise((resolve) => {
      let count = 0;
      const totalMetrics = 5;
      
      const checkComplete = () => {
        count++;
        if (count >= totalMetrics) {
          resolve(metrics);
        }
      };
      
      webVitals.getCLS((metric) => { metrics.CLS = metric.value; checkComplete(); });
      webVitals.getFID((metric) => { metrics.FID = metric.value; checkComplete(); });
      webVitals.getFCP((metric) => { metrics.FCP = metric.value; checkComplete(); });
      webVitals.getLCP((metric) => { metrics.LCP = metric.value; checkComplete(); });
      webVitals.getTTFB((metric) => { metrics.TTFB = metric.value; checkComplete(); });
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(metrics), 5000);
    });
  } catch (error) {
    console.error('Error getting web vitals:', error);
    return {};
  }
}