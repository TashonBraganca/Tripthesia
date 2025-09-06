'use client';

// Production Performance Monitoring - Phase 7 Excellence
// Comprehensive monitoring for Core Web Vitals, user interactions, and performance metrics

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  level: 'critical' | 'error' | 'warning';
  timestamp: number;
  url: string;
  userId?: string;
  buildVersion?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds
  private batchTimer: NodeJS.Timeout | null = null;
  private observer: PerformanceObserver | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    // Initialize Core Web Vitals monitoring
    this.initCoreWebVitals();
    
    // Initialize user interaction monitoring
    this.initUserInteractionMonitoring();
    
    // Initialize navigation timing monitoring
    this.initNavigationMonitoring();
    
    // Initialize resource timing monitoring
    this.initResourceMonitoring();
    
    // Initialize error monitoring
    this.initErrorMonitoring();
    
    // Schedule batch reporting
    this.startBatchReporting();
    
    console.log('🔍 Performance Monitor initialized');
  }

  private initCoreWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      this.observePerformanceEntry('largest-contentful-paint', (entries) => {
        const lcpEntry = entries[entries.length - 1];
        this.recordMetric({
          name: 'LCP',
          value: lcpEntry.startTime,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            element: lcpEntry.element?.tagName || 'unknown',
            url: lcpEntry.url || 'none',
            size: lcpEntry.size || 0,
          }
        });
      });

      // First Input Delay (FID)
      this.observePerformanceEntry('first-input', (entries) => {
        const fidEntry = entries[0];
        this.recordMetric({
          name: 'FID',
          value: fidEntry.processingStart - fidEntry.startTime,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            eventType: fidEntry.name,
            target: fidEntry.target?.tagName || 'unknown',
          }
        });
      });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      this.observePerformanceEntry('layout-shift', (entries) => {
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            sessionValue: clsValue,
            entryCount: entries.length,
          }
        });
      });

      // First Contentful Paint (FCP)
      this.observePerformanceEntry('paint', (entries) => {
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.recordMetric({
            name: 'FCP',
            value: fcpEntry.startTime,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        }
      });

      // Time to First Byte (TTFB)
      this.observePerformanceEntry('navigation', (entries) => {
        const navEntry = entries[0];
        this.recordMetric({
          name: 'TTFB',
          value: navEntry.responseStart - navEntry.fetchStart,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            transferSize: navEntry.transferSize || 0,
          }
        });
      });

    } catch (error) {
      console.warn('Core Web Vitals monitoring initialization failed:', error);
    }
  }

  private initUserInteractionMonitoring() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      const selector = this.getElementSelector(target);
      
      this.recordMetric({
        name: 'user_click',
        value: Date.now(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          element: target.tagName,
          selector,
          text: target.textContent?.slice(0, 50) || '',
          x: event.clientX,
          y: event.clientY,
        }
      });
    });

    // Form interaction tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      this.recordMetric({
        name: 'form_submit',
        value: Date.now(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          formId: form.id || 'unknown',
          formAction: form.action || 'unknown',
          fieldCount: form.elements.length,
        }
      });
    });

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.recordMetric({
        name: 'page_visibility',
        value: Date.now(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        }
      });
    });
  }

  private initNavigationMonitoring() {
    // Page load timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.recordMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            download: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            transferSize: navigation.transferSize,
            compressedSize: navigation.encodedBodySize,
            uncompressedSize: navigation.decodedBodySize,
          }
        });
      }, 100);
    });

    // Route changes (for SPA navigation)
    let previousUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== previousUrl) {
        this.recordMetric({
          name: 'spa_navigation',
          value: Date.now(),
          timestamp: Date.now(),
          url: currentUrl,
          userAgent: navigator.userAgent,
          metadata: {
            from: previousUrl,
            to: currentUrl,
            type: 'client_route_change',
          }
        });
        previousUrl = currentUrl;
      }
    };

    // Check for URL changes periodically (for SPAs without proper navigation events)
    setInterval(checkUrlChange, 1000);
  }

  private initResourceMonitoring() {
    this.observePerformanceEntry('resource', (entries) => {
      for (const entry of entries) {
        // Only monitor specific resource types
        if (!['script', 'stylesheet', 'image', 'fetch', 'xmlhttprequest'].includes(entry.initiatorType)) {
          continue;
        }

        this.recordMetric({
          name: 'resource_load',
          value: entry.duration,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            resourceUrl: entry.name,
            resourceType: entry.initiatorType,
            transferSize: entry.transferSize || 0,
            compressedSize: entry.encodedBodySize || 0,
            uncompressedSize: entry.decodedBodySize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
            download: entry.responseEnd - entry.responseStart,
          }
        });
      }
    });
  }

  private initErrorMonitoring() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        errorId: `js_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: event.message || 'Unknown JavaScript error',
        stack: event.error?.stack,
        level: 'error',
        timestamp: Date.now(),
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error',
        }
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        errorId: `promise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        level: 'error',
        timestamp: Date.now(),
        url: window.location.href,
        metadata: {
          reason: event.reason,
          type: 'unhandled_promise_rejection',
        }
      });
    });
  }

  private observePerformanceEntry(type: string, callback: (entries: any[]) => void) {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        
        observer.observe({ type, buffered: true });
        
        if (!this.observer) {
          this.observer = observer;
        }
      }
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Trigger immediate send for critical metrics
    if (['LCP', 'FID', 'CLS'].includes(metric.name) && metric.value > this.getCriticalThreshold(metric.name)) {
      this.sendBatch([metric], []);
    }
  }

  reportError(error: ErrorReport) {
    this.errors.push(error);
    
    // Send critical errors immediately
    if (error.level === 'critical') {
      this.sendBatch([], [error]);
    }
  }

  private getCriticalThreshold(metric: string): number {
    const thresholds: Record<string, number> = {
      'LCP': 4000, // 4 seconds
      'FID': 300,  // 300ms
      'CLS': 0.25, // 0.25
    };
    return thresholds[metric] || Infinity;
  }

  private startBatchReporting() {
    this.batchTimer = setInterval(() => {
      this.sendBatch();
    }, this.batchTimeout);

    // Send batch before page unload
    window.addEventListener('beforeunload', () => {
      this.sendBatch();
    });

    // Send batch when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendBatch();
      }
    });
  }

  private async sendBatch(metricsOverride?: PerformanceMetric[], errorsOverride?: ErrorReport[]) {
    const metricsToSend = metricsOverride || this.metrics.splice(0, this.batchSize);
    const errorsToSend = errorsOverride || this.errors.splice(0, this.batchSize);

    if (metricsToSend.length === 0 && errorsToSend.length === 0) {
      return;
    }

    try {
      const payload = {
        metrics: metricsToSend,
        errors: errorsToSend,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
      };

      // Use sendBeacon if available for reliability
      if ('sendBeacon' in navigator && !metricsOverride && !errorsOverride) {
        navigator.sendBeacon('/api/monitoring/batch', JSON.stringify(payload));
      } else {
        await fetch('/api/monitoring/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }

      console.log(`📊 Sent ${metricsToSend.length} metrics and ${errorsToSend.length} errors to monitoring`);
    } catch (error) {
      console.error('Failed to send monitoring data:', error);
      
      // Re-add to queue on failure (unless it was an override)
      if (!metricsOverride && !errorsOverride) {
        this.metrics.unshift(...metricsToSend);
        this.errors.unshift(...errorsToSend);
      }
    }
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isInitialized = false;
  }

  // Public methods for manual reporting
  trackCustomEvent(name: string, value: number, metadata?: Record<string, any>) {
    this.recordMetric({
      name: `custom_${name}`,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    });
  }

  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
    this.recordMetric({
      name: 'feature_usage',
      value: Date.now(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        feature,
        action,
        ...metadata,
      },
    });
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor, PerformanceMonitor };
export type { PerformanceMetric, ErrorReport };