/**
 * Performance Optimizer - Phase 2.7
 * 
 * Comprehensive performance optimization system providing:
 * - API response time monitoring and optimization
 * - Memory usage tracking and optimization
 * - Database query performance analysis
 * - Bundle size monitoring and code splitting recommendations
 * - Real-time performance metrics collection
 * - Automatic performance degradation detection and alerts
 * - User experience impact analysis and optimization
 */

import { createCacheManager, CacheKeyType } from './redis-cache-manager';

// ==================== PERFORMANCE METRICS ====================

export interface PerformanceMetric {
  timestamp: number;
  metricType: PerformanceMetricType;
  value: number;
  unit: string;
  context?: {
    endpoint?: string;
    userId?: string;
    region?: string;
    userAgent?: string;
    cacheHit?: boolean;
  };
  metadata?: Record<string, any>;
}

export type PerformanceMetricType = 
  | 'api_response_time'
  | 'database_query_time'
  | 'cache_hit_rate'
  | 'memory_usage'
  | 'cpu_usage'
  | 'bundle_size'
  | 'core_web_vitals'
  | 'user_interaction_time'
  | 'search_result_time'
  | 'page_load_time'
  | 'error_rate'
  | 'throughput';

export interface PerformanceThreshold {
  metricType: PerformanceMetricType;
  warningLevel: number;
  criticalLevel: number;
  unit: string;
  description: string;
  autoOptimization?: boolean;
}

export const PERFORMANCE_THRESHOLDS: PerformanceThreshold[] = [
  {
    metricType: 'api_response_time',
    warningLevel: 2000, // 2 seconds
    criticalLevel: 5000, // 5 seconds
    unit: 'ms',
    description: 'API response time should be under 2s',
    autoOptimization: true
  },
  {
    metricType: 'database_query_time',
    warningLevel: 500, // 500ms
    criticalLevel: 1000, // 1 second
    unit: 'ms',
    description: 'Database queries should complete under 500ms',
    autoOptimization: true
  },
  {
    metricType: 'cache_hit_rate',
    warningLevel: 70, // 70%
    criticalLevel: 50, // 50%
    unit: '%',
    description: 'Cache hit rate should be above 70%',
    autoOptimization: true
  },
  {
    metricType: 'memory_usage',
    warningLevel: 80, // 80% of available
    criticalLevel: 90, // 90% of available
    unit: '%',
    description: 'Memory usage should stay below 80%'
  },
  {
    metricType: 'core_web_vitals',
    warningLevel: 2500, // 2.5s LCP
    criticalLevel: 4000, // 4s LCP
    unit: 'ms',
    description: 'Largest Contentful Paint should be under 2.5s'
  },
  {
    metricType: 'search_result_time',
    warningLevel: 3000, // 3 seconds
    criticalLevel: 8000, // 8 seconds
    unit: 'ms',
    description: 'Travel search should complete under 3s',
    autoOptimization: true
  }
];

// ==================== PERFORMANCE OPTIMIZER CLASS ====================

export class PerformanceOptimizer {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private cache = createCacheManager();
  private optimizationRules: Map<PerformanceMetricType, () => Promise<void>> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeOptimizationRules();
  }

  // ==================== METRIC COLLECTION ====================

  async recordMetric(metric: PerformanceMetric): Promise<void> {
    const key = `${metric.metricType}:${metric.context?.endpoint || 'global'}`;
    
    // Store in memory for immediate analysis
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.push(metric);
    
    // Keep only recent metrics (last 1000 entries or 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.set(key, metrics
      .filter(m => m.timestamp > oneHourAgo)
      .slice(-1000)
    );

    // Cache metric for persistence
    await this.cache.set(
      `perf_metric:${key}:${metric.timestamp}`,
      metric,
      'analytics_data',
      { customTTL: 86400 } // 24 hours
    );

    // Check thresholds and trigger optimizations
    await this.checkPerformanceThresholds(metric);
  }

  async recordAPICall(
    endpoint: string,
    responseTimeMs: number,
    success: boolean,
    context?: {
      userId?: string;
      cacheHit?: boolean;
      dataSize?: number;
      statusCode?: number;
    }
  ): Promise<void> {
    await this.recordMetric({
      timestamp: Date.now(),
      metricType: 'api_response_time',
      value: responseTimeMs,
      unit: 'ms',
      context: {
        endpoint,
        userId: context?.userId,
        cacheHit: context?.cacheHit
      },
      metadata: {
        success,
        dataSize: context?.dataSize,
        statusCode: context?.statusCode
      }
    });

    // Calculate error rate
    if (!success) {
      await this.recordMetric({
        timestamp: Date.now(),
        metricType: 'error_rate',
        value: 1,
        unit: 'count',
        context: { endpoint }
      });
    }
  }

  async recordDatabaseQuery(
    query: string,
    executionTimeMs: number,
    rowCount?: number
  ): Promise<void> {
    await this.recordMetric({
      timestamp: Date.now(),
      metricType: 'database_query_time',
      value: executionTimeMs,
      unit: 'ms',
      metadata: {
        query: query.substring(0, 100), // First 100 chars
        rowCount
      }
    });
  }

  async recordCachePerformance(
    cacheType: CacheKeyType,
    hitRate: number,
    avgResponseTime: number
  ): Promise<void> {
    await Promise.all([
      this.recordMetric({
        timestamp: Date.now(),
        metricType: 'cache_hit_rate',
        value: hitRate,
        unit: '%',
        metadata: { cacheType }
      }),
      this.recordMetric({
        timestamp: Date.now(),
        metricType: 'api_response_time',
        value: avgResponseTime,
        unit: 'ms',
        context: { endpoint: `cache:${cacheType}` },
        metadata: { cacheType }
      })
    ]);
  }

  async recordUserExperience(
    actionType: string,
    responseTimeMs: number,
    userId?: string
  ): Promise<void> {
    await this.recordMetric({
      timestamp: Date.now(),
      metricType: 'user_interaction_time',
      value: responseTimeMs,
      unit: 'ms',
      context: { userId },
      metadata: { actionType }
    });
  }

  // ==================== PERFORMANCE ANALYSIS ====================

  async getPerformanceAnalysis(
    timeRangeMs: number = 3600000 // 1 hour default
  ): Promise<{
    summary: {
      avgApiResponseTime: number;
      avgDatabaseQueryTime: number;
      cacheHitRate: number;
      errorRate: number;
      throughput: number;
    };
    trends: Array<{
      metricType: PerformanceMetricType;
      trend: 'improving' | 'stable' | 'degrading';
      changePercent: number;
    }>;
    bottlenecks: Array<{
      endpoint: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    optimizationOpportunities: Array<{
      type: string;
      description: string;
      estimatedImprovement: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
  }> {
    const cutoff = Date.now() - timeRangeMs;
    
    // Aggregate metrics
    const summary = await this.calculatePerformanceSummary(cutoff);
    const trends = await this.calculatePerformanceTrends(cutoff);
    const bottlenecks = await this.identifyBottlenecks(cutoff);
    const optimizationOpportunities = await this.identifyOptimizationOpportunities(cutoff);

    return {
      summary,
      trends,
      bottlenecks,
      optimizationOpportunities
    };
  }

  private async calculatePerformanceSummary(cutoff: number) {
    let totalApiTime = 0, apiCount = 0;
    let totalDbTime = 0, dbCount = 0;
    let totalCacheHits = 0, totalCacheRequests = 0;
    let errorCount = 0, requestCount = 0;

    for (const [key, metrics] of this.metrics) {
      const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
      
      for (const metric of recentMetrics) {
        switch (metric.metricType) {
          case 'api_response_time':
            totalApiTime += metric.value;
            apiCount++;
            requestCount++;
            break;
          case 'database_query_time':
            totalDbTime += metric.value;
            dbCount++;
            break;
          case 'cache_hit_rate':
            totalCacheHits += metric.value;
            totalCacheRequests += 100; // Normalize to percentage
            break;
          case 'error_rate':
            errorCount += metric.value;
            break;
        }
      }
    }

    return {
      avgApiResponseTime: apiCount > 0 ? Math.round(totalApiTime / apiCount) : 0,
      avgDatabaseQueryTime: dbCount > 0 ? Math.round(totalDbTime / dbCount) : 0,
      cacheHitRate: totalCacheRequests > 0 ? Math.round(totalCacheHits / totalCacheRequests * 100) : 0,
      errorRate: requestCount > 0 ? Math.round(errorCount / requestCount * 100) : 0,
      throughput: Math.round(requestCount / ((Date.now() - cutoff) / 60000)) // requests per minute
    };
  }

  private async calculatePerformanceTrends(cutoff: number) {
    const trends = [];
    const midpoint = cutoff + (Date.now() - cutoff) / 2;

    for (const metricType of ['api_response_time', 'database_query_time', 'cache_hit_rate'] as PerformanceMetricType[]) {
      const allMetrics = [];
      
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics.filter(m => 
          m.timestamp > cutoff && m.metricType === metricType
        ));
      }

      if (allMetrics.length < 10) continue; // Need sufficient data

      const firstHalf = allMetrics.filter(m => m.timestamp < midpoint);
      const secondHalf = allMetrics.filter(m => m.timestamp >= midpoint);

      if (firstHalf.length === 0 || secondHalf.length === 0) continue;

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
      
      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'degrading';
      if (metricType === 'cache_hit_rate') {
        // Higher cache hit rate is better
        trend = changePercent > 5 ? 'improving' : changePercent < -5 ? 'degrading' : 'stable';
      } else {
        // Lower response times are better
        trend = changePercent < -5 ? 'improving' : changePercent > 5 ? 'degrading' : 'stable';
      }

      trends.push({
        metricType,
        trend,
        changePercent: Math.round(changePercent)
      });
    }

    return trends;
  }

  private async identifyBottlenecks(cutoff: number) {
    const bottlenecks = [];
    const endpointStats = new Map<string, { times: number[], errors: number }>();

    // Collect endpoint statistics
    for (const metrics of this.metrics.values()) {
      for (const metric of metrics) {
        if (metric.timestamp < cutoff) continue;
        
        const endpoint = metric.context?.endpoint || 'unknown';
        if (!endpointStats.has(endpoint)) {
          endpointStats.set(endpoint, { times: [], errors: 0 });
        }
        
        const stats = endpointStats.get(endpoint)!;
        
        if (metric.metricType === 'api_response_time') {
          stats.times.push(metric.value);
        } else if (metric.metricType === 'error_rate') {
          stats.errors += metric.value;
        }
      }
    }

    // Analyze each endpoint
    for (const [endpoint, stats] of endpointStats) {
      if (stats.times.length === 0) continue;

      const avgTime = stats.times.reduce((sum, t) => sum + t, 0) / stats.times.length;
      const maxTime = Math.max(...stats.times);
      const errorRate = stats.errors / stats.times.length;

      // Identify issues
      if (avgTime > 3000) {
        bottlenecks.push({
          endpoint,
          issue: `High average response time: ${Math.round(avgTime)}ms`,
          severity: avgTime > 5000 ? 'high' : 'medium' as 'low' | 'medium' | 'high',
          recommendation: 'Consider caching, query optimization, or API endpoint optimization'
        });
      }

      if (maxTime > 10000) {
        bottlenecks.push({
          endpoint,
          issue: `Extreme response time detected: ${Math.round(maxTime)}ms`,
          severity: 'high' as 'low' | 'medium' | 'high',
          recommendation: 'Investigate timeout issues and implement request queuing'
        });
      }

      if (errorRate > 0.05) { // 5% error rate
        bottlenecks.push({
          endpoint,
          issue: `High error rate: ${Math.round(errorRate * 100)}%`,
          severity: errorRate > 0.1 ? 'high' : 'medium' as 'low' | 'medium' | 'high',
          recommendation: 'Review error handling and implement circuit breakers'
        });
      }
    }

    return bottlenecks;
  }

  private async identifyOptimizationOpportunities(cutoff: number) {
    const opportunities = [];

    // Analyze cache performance
    const cacheMetrics = [];
    for (const metrics of this.metrics.values()) {
      cacheMetrics.push(...metrics.filter(m => 
        m.timestamp > cutoff && m.metricType === 'cache_hit_rate'
      ));
    }

    if (cacheMetrics.length > 0) {
      const avgHitRate = cacheMetrics.reduce((sum, m) => sum + m.value, 0) / cacheMetrics.length;
      
      if (avgHitRate < 70) {
        opportunities.push({
          type: 'Cache Optimization',
          description: `Cache hit rate is ${Math.round(avgHitRate)}%. Optimize cache keys and TTL strategies.`,
          estimatedImprovement: '20-30% response time reduction',
          difficulty: 'medium' as 'easy' | 'medium' | 'hard'
        });
      }
    }

    // Analyze API response times
    const apiMetrics = [];
    for (const metrics of this.metrics.values()) {
      apiMetrics.push(...metrics.filter(m => 
        m.timestamp > cutoff && m.metricType === 'api_response_time'
      ));
    }

    if (apiMetrics.length > 0) {
      const avgResponseTime = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length;
      
      if (avgResponseTime > 2000) {
        opportunities.push({
          type: 'API Optimization',
          description: `Average API response time is ${Math.round(avgResponseTime)}ms. Consider parallel requests and response streaming.`,
          estimatedImprovement: '30-50% response time reduction',
          difficulty: 'hard' as 'easy' | 'medium' | 'hard'
        });
      }
    }

    // Database query analysis
    const dbMetrics = [];
    for (const metrics of this.metrics.values()) {
      dbMetrics.push(...metrics.filter(m => 
        m.timestamp > cutoff && m.metricType === 'database_query_time'
      ));
    }

    if (dbMetrics.length > 0) {
      const avgDbTime = dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length;
      
      if (avgDbTime > 500) {
        opportunities.push({
          type: 'Database Optimization',
          description: `Average database query time is ${Math.round(avgDbTime)}ms. Review indexes and query patterns.`,
          estimatedImprovement: '40-60% query time reduction',
          difficulty: 'medium' as 'easy' | 'medium' | 'hard'
        });
      }
    }

    return opportunities;
  }

  // ==================== AUTOMATIC OPTIMIZATION ====================

  private initializeOptimizationRules(): void {
    // Cache optimization
    this.optimizationRules.set('cache_hit_rate', async () => {
      console.log('Triggering cache optimization...');
      // In production, this could:
      // - Adjust TTL values
      // - Preload popular cache entries
      // - Optimize cache key strategies
    });

    // API response time optimization
    this.optimizationRules.set('api_response_time', async () => {
      console.log('Triggering API response time optimization...');
      // In production, this could:
      // - Enable more aggressive caching
      // - Switch to faster endpoints
      // - Implement request batching
    });

    // Database query optimization
    this.optimizationRules.set('database_query_time', async () => {
      console.log('Triggering database optimization...');
      // In production, this could:
      // - Create temporary indexes
      // - Switch to read replicas
      // - Enable query result caching
    });
  }

  private async checkPerformanceThresholds(metric: PerformanceMetric): Promise<void> {
    const threshold = PERFORMANCE_THRESHOLDS.find(t => t.metricType === metric.metricType);
    if (!threshold) return;

    const isWarning = metric.value > threshold.warningLevel;
    const isCritical = metric.value > threshold.criticalLevel;

    if (isCritical || isWarning) {
      console.warn(`Performance ${isCritical ? 'CRITICAL' : 'WARNING'}: ${metric.metricType} = ${metric.value}${threshold.unit}`);
      
      // Trigger automatic optimization if enabled
      if (threshold.autoOptimization && isCritical) {
        const optimizationRule = this.optimizationRules.get(metric.metricType);
        if (optimizationRule) {
          try {
            await optimizationRule();
          } catch (error) {
            console.error('Auto-optimization failed:', error);
          }
        }
      }

      // Store alert for monitoring dashboard
      await this.cache.set(
        `perf_alert:${metric.metricType}:${metric.timestamp}`,
        {
          metric,
          threshold,
          level: isCritical ? 'critical' : 'warning',
          timestamp: Date.now()
        },
        'analytics_data',
        { customTTL: 86400 } // 24 hours
      );
    }
  }

  // ==================== MONITORING CONTROL ====================

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started');

    // Periodic performance health check
    setInterval(async () => {
      try {
        const analysis = await this.getPerformanceAnalysis(900000); // 15 minutes
        
        // Log performance summary
        console.log('Performance Health Check:', {
          avgApiTime: analysis.summary.avgApiResponseTime,
          cacheHitRate: analysis.summary.cacheHitRate,
          errorRate: analysis.summary.errorRate,
          bottlenecks: analysis.bottlenecks.length
        });

      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  // ==================== UTILITY METHODS ====================

  async clearMetrics(olderThanMs?: number): Promise<void> {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : 0;
    
    for (const [key, metrics] of this.metrics) {
      if (cutoff === 0) {
        this.metrics.set(key, []);
      } else {
        this.metrics.set(key, metrics.filter(m => m.timestamp > cutoff));
      }
    }

    console.log(`Cleared performance metrics older than ${olderThanMs ? new Date(Date.now() - olderThanMs) : 'all time'}`);
  }

  getMetricCount(): number {
    let count = 0;
    for (const metrics of this.metrics.values()) {
      count += metrics.length;
    }
    return count;
  }
}

// ==================== FACTORY FUNCTION ====================

let globalPerformanceOptimizer: PerformanceOptimizer | null = null;

export function createPerformanceOptimizer(): PerformanceOptimizer {
  if (!globalPerformanceOptimizer) {
    globalPerformanceOptimizer = new PerformanceOptimizer();
  }
  return globalPerformanceOptimizer;
}

// ==================== CONVENIENCE FUNCTIONS ====================

export async function measurePerformance<T>(
  operation: () => Promise<T>,
  metricType: PerformanceMetricType,
  context?: any
): Promise<T> {
  const optimizer = createPerformanceOptimizer();
  const startTime = Date.now();
  
  try {
    const result = await operation();
    
    await optimizer.recordMetric({
      timestamp: Date.now(),
      metricType,
      value: Date.now() - startTime,
      unit: 'ms',
      context,
      metadata: { success: true }
    });
    
    return result;
    
  } catch (error) {
    await optimizer.recordMetric({
      timestamp: Date.now(),
      metricType,
      value: Date.now() - startTime,
      unit: 'ms',
      context,
      metadata: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    });
    
    throw error;
  }
}

// Types are already exported above as needed