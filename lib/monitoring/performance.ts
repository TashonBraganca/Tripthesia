/**
 * Performance monitoring and metrics collection system
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  timestamp: string;
  labels?: Record<string, string>;
}

interface RouteMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private routeMetrics: RouteMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly MAX_ROUTE_METRICS_HISTORY = 5000;

  // Track API route performance
  trackRoute(metrics: RouteMetrics) {
    this.routeMetrics.push(metrics);
    
    // Keep only recent metrics
    if (this.routeMetrics.length > this.MAX_ROUTE_METRICS_HISTORY) {
      this.routeMetrics = this.routeMetrics.slice(-this.MAX_ROUTE_METRICS_HISTORY);
    }
    
    // Also track as performance metric
    this.recordMetric({
      name: `route_duration_${metrics.method.toLowerCase()}_${metrics.path.replace(/\//g, '_')}`,
      value: metrics.duration,
      unit: 'ms',
      timestamp: metrics.timestamp,
      labels: {
        method: metrics.method,
        path: metrics.path,
        status: metrics.statusCode.toString(),
      },
    });
  }

  // Record custom performance metric
  recordMetric(metric: PerformanceMetric) {
    const key = metric.name;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metricsList = this.metrics.get(key)!;
    metricsList.push(metric);
    
    // Keep only recent metrics
    if (metricsList.length > this.MAX_METRICS_HISTORY) {
      this.metrics.set(key, metricsList.slice(-this.MAX_METRICS_HISTORY));
    }
  }

  // Get performance statistics for a metric
  getMetricStats(metricName: string, timeWindow: number = 3600000): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length === 0) return null;
    
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
    
    if (recentMetrics.length === 0) return null;
    
    const values = recentMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  // Get slow routes (above threshold)
  getSlowRoutes(thresholdMs: number = 1000, limit: number = 10): RouteMetrics[] {
    const oneHourAgo = Date.now() - 3600000;
    
    return this.routeMetrics
      .filter(r => new Date(r.timestamp).getTime() > oneHourAgo && r.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Get error rate by route
  getErrorRates(timeWindow: number = 3600000): Record<string, { total: number; errors: number; rate: number }> {
    const cutoff = Date.now() - timeWindow;
    const recentRoutes = this.routeMetrics.filter(r => new Date(r.timestamp).getTime() > cutoff);
    
    const routeStats: Record<string, { total: number; errors: number; rate: number }> = {};
    
    for (const route of recentRoutes) {
      const key = `${route.method} ${route.path}`;
      
      if (!routeStats[key]) {
        routeStats[key] = { total: 0, errors: 0, rate: 0 };
      }
      
      const stats = routeStats[key];
      stats.total++;
      
      if (route.statusCode >= 400) {
        stats.errors++;
      }
      
      stats.rate = (stats.errors / stats.total) * 100;
    }
    
    return routeStats;
  }

  // Get system resource metrics
  getSystemMetrics(): Record<string, PerformanceMetric> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const timestamp = new Date().toISOString();
    
    return {
      memoryHeapUsed: {
        name: 'memory_heap_used',
        value: memUsage.heapUsed,
        unit: 'bytes',
        timestamp,
      },
      memoryHeapTotal: {
        name: 'memory_heap_total',
        value: memUsage.heapTotal,
        unit: 'bytes',
        timestamp,
      },
      memoryRSS: {
        name: 'memory_rss',
        value: memUsage.rss,
        unit: 'bytes',
        timestamp,
      },
      cpuUser: {
        name: 'cpu_user_time',
        value: cpuUsage.user,
        unit: 'ms',
        timestamp,
      },
      cpuSystem: {
        name: 'cpu_system_time',
        value: cpuUsage.system,
        unit: 'ms',
        timestamp,
      },
      uptime: {
        name: 'process_uptime',
        value: process.uptime() * 1000,
        unit: 'ms',
        timestamp,
      },
    };
  }

  // Get performance summary
  getSummary(): {
    systemMetrics: Record<string, PerformanceMetric>;
    slowRoutes: RouteMetrics[];
    errorRates: Record<string, { total: number; errors: number; rate: number }>;
    topMetrics: Record<string, any>;
  } {
    const errorRates = this.getErrorRates();
    
    // Get top metrics by name
    const topMetricNames = Array.from(this.metrics.keys()).slice(0, 10);
    const topMetrics: Record<string, ReturnType<typeof this.getMetricStats>> = {};
    
    for (const metricName of topMetricNames) {
      topMetrics[metricName] = this.getMetricStats(metricName);
    }
    
    return {
      systemMetrics: this.getSystemMetrics(),
      slowRoutes: this.getSlowRoutes(),
      errorRates,
      topMetrics,
    };
  }

  // Clear old data
  cleanup(maxAge: number = 24 * 3600000) { // 24 hours default
    const cutoff = Date.now() - maxAge;
    
    // Clean route metrics
    this.routeMetrics = this.routeMetrics.filter(r => new Date(r.timestamp).getTime() > cutoff);
    
    // Clean performance metrics
    const metricsEntries = Array.from(this.metrics.entries());
    for (const [metricName, metrics] of metricsEntries) {
      const filteredMetrics = metrics.filter((m: PerformanceMetric) => new Date(m.timestamp).getTime() > cutoff);
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(metricName);
      } else {
        this.metrics.set(metricName, filteredMetrics);
      }
    }
  }
}

// Middleware wrapper for automatic performance tracking
export function withPerformanceTracking(handler: Function, routePath: string) {
  return async function(this: any, ...args: any[]) {
    const startTime = Date.now();
    const request = args[0]; // Assuming first arg is request
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Extract request info
      const method = request.method || 'UNKNOWN';
      const userAgent = request.headers?.get?.('user-agent') || undefined;
      
      // Track successful request
      performanceTracker.trackRoute({
        path: routePath,
        method,
        statusCode: result.status || 200,
        duration,
        timestamp: new Date().toISOString(),
        userAgent,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed request
      performanceTracker.trackRoute({
        path: routePath,
        method: request.method || 'UNKNOWN',
        statusCode: 500,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: request.headers?.get?.('user-agent') || undefined,
      });
      
      throw error;
    }
  };
}

// Timer utility for custom performance tracking
export class PerformanceTimer {
  private startTime: number;
  private metricName: string;
  private labels?: Record<string, string>;

  constructor(metricName: string, labels?: Record<string, string>) {
    this.startTime = Date.now();
    this.metricName = metricName;
    this.labels = labels;
  }

  end() {
    const duration = Date.now() - this.startTime;
    
    performanceTracker.recordMetric({
      name: this.metricName,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      labels: this.labels,
    });
    
    return duration;
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Cleanup interval (run every hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceTracker.cleanup();
  }, 3600000);
}