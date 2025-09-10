/**
 * Performance Monitoring Utilities
 * 
 * Provides comprehensive performance tracking and optimization utilities
 * for the TripThesia application.
 */

import React from 'react';

// ==================== TYPES ====================

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  props: Record<string, any>;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  size?: number;
}

// ==================== PERFORMANCE MONITOR CLASS ====================

class PerformanceMonitorClass {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private apiMetrics: APIMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    this.initializeObservers();
  }

  // ==================== INITIALIZATION ====================

  private initializeObservers() {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    // Observe Web Vitals
    if ('PerformanceObserver' in window) {
      // Core Web Vitals
      this.observeWebVitals();
      
      // Resource loading
      this.observeResourceLoading();
      
      // Navigation timing
      this.observeNavigation();
    }
  }

  private observeWebVitals() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', {
              name: 'Largest Contentful Paint',
              startTime: entry.startTime,
              endTime: entry.startTime,
              duration: entry.startTime,
              metadata: { element: entry.element }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('webvitals', observer);
    } catch (error) {
      console.warn('Web Vitals observer not supported:', error);
    }
  }

  private observeResourceLoading() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric(`resource-${resourceEntry.name}`, {
              name: `Resource: ${resourceEntry.name}`,
              startTime: resourceEntry.startTime,
              endTime: resourceEntry.responseEnd,
              duration: resourceEntry.duration,
              metadata: {
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
                status: (resourceEntry as any).responseStatus
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resources', observer);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }
  }

  private observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('navigation', {
              name: 'Page Navigation',
              startTime: navEntry.startTime,
              endTime: navEntry.loadEventEnd,
              duration: navEntry.loadEventEnd - navEntry.startTime,
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
                firstPaint: navEntry.responseEnd - navEntry.startTime,
                type: navEntry.type
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }
  }

  // ==================== METRIC RECORDING ====================

  recordMetric(key: string, metric: Omit<PerformanceMetrics, 'duration'>) {
    if (!this.isEnabled) return;

    const duration = metric.endTime && metric.startTime 
      ? metric.endTime - metric.startTime 
      : undefined;

    this.metrics.set(key, {
      ...metric,
      duration
    });

    // Log significant performance issues
    if (duration && duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${duration}ms`);
    }
  }

  startTimer(key: string, name: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    this.metrics.set(key, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  endTimer(key: string) {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(key);
    if (metric && !metric.endTime) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;

      this.metrics.set(key, {
        ...metric,
        endTime,
        duration
      });

      return duration;
    }
  }

  // ==================== COMPONENT METRICS ====================

  recordComponentRender(name: string, renderTime: number, props: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(name);
    
    if (existing) {
      const totalTime = existing.averageRenderTime * existing.renderCount + renderTime;
      const newCount = existing.renderCount + 1;
      
      this.componentMetrics.set(name, {
        ...existing,
        renderCount: newCount,
        averageRenderTime: totalTime / newCount,
        lastRenderTime: renderTime,
        props
      });
    } else {
      this.componentMetrics.set(name, {
        name,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        props
      });
    }

    // Warn about slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render: ${name} took ${renderTime.toFixed(2)}ms`);
    }
  }

  // ==================== API METRICS ====================

  recordAPICall(endpoint: string, method: string, startTime: number, endTime: number, status: number, size?: number) {
    if (!this.isEnabled) return;

    this.apiMetrics.push({
      endpoint,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      size
    });

    // Keep only last 100 API calls to prevent memory leaks
    if (this.apiMetrics.length > 100) {
      this.apiMetrics = this.apiMetrics.slice(-100);
    }
  }

  // ==================== UTILITIES ====================

  mark(name: string) {
    if (!this.isEnabled || typeof performance === 'undefined') return;
    
    try {
      performance.mark(name);
    } catch (error) {
      console.warn('Performance mark failed:', error);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (!this.isEnabled || typeof performance === 'undefined') return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];
      
      if (lastMeasure) {
        this.recordMetric(name, {
          name,
          startTime: lastMeasure.startTime,
          endTime: lastMeasure.startTime + lastMeasure.duration,
          duration: lastMeasure.duration
        });
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  // ==================== REPORTING ====================

  getMetrics() {
    return {
      general: Array.from(this.metrics.values()),
      components: Array.from(this.componentMetrics.values()),
      api: this.apiMetrics.slice()
    };
  }

  getSlowComponents(threshold: number = 10): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values())
      .filter(component => component.averageRenderTime > threshold)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  getPerformanceSummary() {
    const metrics = this.getMetrics();
    const slowComponents = this.getSlowComponents();
    const slowAPIs = metrics.api.filter(api => (api.duration || 0) > 1000);

    return {
      totalMetrics: metrics.general.length,
      trackedComponents: metrics.components.length,
      slowComponents: slowComponents.length,
      slowAPIs: slowAPIs.length,
      averageAPITime: metrics.api.reduce((sum, api) => sum + (api.duration || 0), 0) / metrics.api.length,
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const slowComponents = this.getSlowComponents();
    const metrics = this.getMetrics();

    if (slowComponents.length > 0) {
      recommendations.push(`${slowComponents.length} components are rendering slowly. Consider memoization.`);
    }

    const slowAPIs = metrics.api.filter(api => (api.duration || 0) > 1000);
    if (slowAPIs.length > 0) {
      recommendations.push(`${slowAPIs.length} API calls are slow. Consider caching or optimization.`);
    }

    const heavyResources = metrics.general.filter(m => 
      m.name.includes('Resource:') && m.metadata?.size && m.metadata.size > 100000
    );
    if (heavyResources.length > 0) {
      recommendations.push(`${heavyResources.length} resources are over 100KB. Consider compression.`);
    }

    return recommendations;
  }

  // ==================== CLEANUP ====================

  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.componentMetrics.clear();
    this.apiMetrics.length = 0;
  }
}

// ==================== SINGLETON INSTANCE ====================

export const PerformanceMonitor = new PerformanceMonitorClass();

// ==================== REACT HOOKS ====================

export const usePerformanceMonitor = () => {
  return {
    startTimer: PerformanceMonitor.startTimer.bind(PerformanceMonitor),
    endTimer: PerformanceMonitor.endTimer.bind(PerformanceMonitor),
    recordComponentRender: PerformanceMonitor.recordComponentRender.bind(PerformanceMonitor),
    mark: PerformanceMonitor.mark.bind(PerformanceMonitor),
    measure: PerformanceMonitor.measure.bind(PerformanceMonitor),
    getMetrics: PerformanceMonitor.getMetrics.bind(PerformanceMonitor),
    getPerformanceSummary: PerformanceMonitor.getPerformanceSummary.bind(PerformanceMonitor)
  };
};

// ==================== HOC FOR COMPONENT MONITORING ====================

export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = React.memo((props: P) => {
    const startTime = React.useRef(0);

    React.useLayoutEffect(() => {
      startTime.current = performance.now();
    });

    React.useLayoutEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      PerformanceMonitor.recordComponentRender(componentName, renderTime, props as any);
    });

    return <Component {...props} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}

// ==================== BUNDLE ANALYSIS UTILITIES ====================

export const BundleAnalyzer = {
  logChunkSizes() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

    // This would integrate with webpack-bundle-analyzer data
    console.group('📦 Bundle Analysis');
    console.log('Use ANALYZE=true npm run build to get detailed bundle analysis');
    console.groupEnd();
  },

  trackDynamicImports() {
    // Track when dynamic imports are loaded
    const originalImport = window.import || (() => Promise.resolve());
    
    (window as any).import = (module: string) => {
      PerformanceMonitor.startTimer(`dynamic-import-${module}`, `Dynamic Import: ${module}`);
      
      return originalImport(module).then((result: any) => {
        PerformanceMonitor.endTimer(`dynamic-import-${module}`);
        return result;
      });
    };
  }
};

export default PerformanceMonitor;