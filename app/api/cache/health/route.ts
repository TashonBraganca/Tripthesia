/**
 * Cache Health Check API - Phase 2.7
 * 
 * Comprehensive health monitoring endpoint for cache and performance systems:
 * - Redis connectivity and performance metrics
 * - Cache hit rates and efficiency analysis
 * - Performance optimization status and recommendations
 * - System resource utilization monitoring
 * - Automated health scoring and alerting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCacheManager } from '@/lib/cache/redis-cache-manager';
import { createPerformanceOptimizer } from '@/lib/cache/performance-optimizer';

export async function GET(request: NextRequest) {
  try {
    // Authentication check (optional - allow health checks without auth for monitoring systems)
    const { userId } = auth();
    const isAuthenticated = !!userId;

    // Get query parameters for detailed analysis
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const timeRangeHours = parseInt(searchParams.get('timeRange') || '1');

    const startTime = Date.now();

    // Initialize monitoring systems
    const cacheManager = createCacheManager();
    const performanceOptimizer = createPerformanceOptimizer();

    // Parallel health checks
    const [
      cacheHealth,
      cacheStats,
      performanceAnalysis
    ] = await Promise.allSettled([
      cacheManager.healthCheck(),
      detailed ? cacheManager.getCacheStats() : Promise.resolve(null),
      detailed ? performanceOptimizer.getPerformanceAnalysis(timeRangeHours * 3600000) : Promise.resolve(null)
    ]);

    // Process results
    const cacheHealthResult = cacheHealth.status === 'fulfilled' ? cacheHealth.value : {
      status: 'unhealthy',
      latency: 0,
      details: { error: 'Cache health check failed' }
    };

    const cacheStatsResult = cacheStats.status === 'fulfilled' ? cacheStats.value : null;
    const performanceResult = performanceAnalysis.status === 'fulfilled' ? performanceAnalysis.value : null;

    // Calculate overall health score
    const healthScore = calculateHealthScore(cacheHealthResult, cacheStatsResult, performanceResult);

    // Build response
    const response = {
      status: healthScore.overall,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      healthScore: healthScore.score,
      
      cache: {
        status: cacheHealthResult.status,
        latency: cacheHealthResult.latency,
        details: isAuthenticated ? cacheHealthResult.details : undefined
      },

      ...(detailed && isAuthenticated && {
        detailed: {
          cacheStats: cacheStatsResult,
          performance: performanceResult,
          recommendations: generateRecommendations(cacheHealthResult, cacheStatsResult, performanceResult),
          systemInfo: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
          }
        }
      }),

      ...(healthScore.overall !== 'healthy' && {
        alerts: healthScore.alerts
      })
    };

    // Set appropriate status code based on health
    const statusCode = healthScore.overall === 'healthy' ? 200 : 
                      healthScore.overall === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Score': healthScore.score.toString(),
        'X-Cache-Status': cacheHealthResult.status,
        'X-Response-Time': (Date.now() - startTime).toString()
      }
    });

  } catch (error) {
    console.error('Cache health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Score': '0'
      }
    });
  }
}

// ==================== HEALTH SCORING ====================

function calculateHealthScore(
  cacheHealth: any,
  cacheStats: any,
  performance: any
): {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  alerts: string[];
} {
  let score = 100;
  const alerts: string[] = [];

  // Cache health scoring (40% of total)
  if (cacheHealth.status === 'unhealthy') {
    score -= 40;
    alerts.push('Cache system is unhealthy');
  } else if (cacheHealth.status === 'degraded') {
    score -= 20;
    alerts.push('Cache system is experiencing performance issues');
  }

  // Cache latency scoring
  if (cacheHealth.latency > 100) {
    score -= Math.min(20, (cacheHealth.latency - 100) / 10);
    if (cacheHealth.latency > 500) {
      alerts.push(`High cache latency: ${cacheHealth.latency}ms`);
    }
  }

  // Cache stats scoring (30% of total)
  if (cacheStats) {
    // Calculate average hit rate across all cache types
    const hitRates = Object.values(cacheStats.typeStats).map((stat: any) => 
      stat.hits > 0 ? stat.hits : 0
    );
    
    if (hitRates.length > 0) {
      const avgHitRate = hitRates.reduce((sum: number, rate: number) => sum + rate, 0) / hitRates.length;
      if (avgHitRate < 50) {
        score -= 20;
        alerts.push('Low cache hit rates detected');
      } else if (avgHitRate < 70) {
        score -= 10;
        alerts.push('Cache hit rates could be improved');
      }
    }
  }

  // Performance analysis scoring (30% of total)
  if (performance) {
    // API response time
    if (performance.summary.avgApiResponseTime > 5000) {
      score -= 20;
      alerts.push(`High API response times: ${performance.summary.avgApiResponseTime}ms`);
    } else if (performance.summary.avgApiResponseTime > 2000) {
      score -= 10;
      alerts.push('API response times are above optimal levels');
    }

    // Error rate
    if (performance.summary.errorRate > 5) {
      score -= 15;
      alerts.push(`High error rate: ${performance.summary.errorRate}%`);
    }

    // Database query performance
    if (performance.summary.avgDatabaseQueryTime > 1000) {
      score -= 10;
      alerts.push(`Slow database queries: ${performance.summary.avgDatabaseQueryTime}ms`);
    }

    // Check for degrading trends
    const degradingTrends = performance.trends.filter((t: any) => t.trend === 'degrading');
    if (degradingTrends.length > 0) {
      score -= 5 * degradingTrends.length;
      alerts.push(`Performance degradation detected in: ${degradingTrends.map((t: any) => t.metricType).join(', ')}`);
    }

    // High severity bottlenecks
    const criticalBottlenecks = performance.bottlenecks.filter((b: any) => b.severity === 'high');
    if (criticalBottlenecks.length > 0) {
      score -= 15;
      alerts.push(`${criticalBottlenecks.length} critical performance bottlenecks detected`);
    }
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, Math.round(score));

  // Determine overall status
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (score >= 85) {
    overall = 'healthy';
  } else if (score >= 60) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  return { overall, score, alerts };
}

// ==================== RECOMMENDATIONS ====================

function generateRecommendations(
  cacheHealth: any,
  cacheStats: any,
  performance: any
): Array<{
  type: 'critical' | 'warning' | 'optimization';
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
}> {
  const recommendations = [];

  // Critical cache issues
  if (cacheHealth.status === 'unhealthy') {
    recommendations.push({
      type: 'critical' as const,
      title: 'Cache System Failure',
      description: 'Redis cache is not responding properly',
      action: 'Check Redis server status, network connectivity, and resource availability',
      estimatedImpact: 'Immediate performance degradation across all services'
    });
  }

  // High latency issues
  if (cacheHealth.latency > 500) {
    recommendations.push({
      type: 'critical' as const,
      title: 'High Cache Latency',
      description: `Cache responses are taking ${cacheHealth.latency}ms`,
      action: 'Investigate network issues, Redis server performance, or consider cache partitioning',
      estimatedImpact: 'Significant user experience degradation'
    });
  }

  // Cache efficiency recommendations
  if (cacheStats) {
    const lowPerformanceTypes = Object.entries(cacheStats.typeStats)
      .filter(([_, stats]: [string, any]) => stats.hits < 100 && stats.hits > 0)
      .map(([type, _]) => type);

    if (lowPerformanceTypes.length > 0) {
      recommendations.push({
        type: 'optimization' as const,
        title: 'Low Cache Utilization',
        description: `Cache types with low hit rates: ${lowPerformanceTypes.join(', ')}`,
        action: 'Review TTL settings, cache key strategies, and usage patterns for these cache types',
        estimatedImpact: 'Potential 20-40% performance improvement'
      });
    }
  }

  // Performance optimization recommendations
  if (performance) {
    // API response time optimization
    if (performance.summary.avgApiResponseTime > 2000) {
      recommendations.push({
        type: performance.summary.avgApiResponseTime > 5000 ? 'critical' : 'warning' as const,
        title: 'High API Response Times',
        description: `Average API response time is ${performance.summary.avgApiResponseTime}ms`,
        action: 'Implement request parallelization, optimize external API calls, increase cache TTL for stable data',
        estimatedImpact: 'Potential 30-50% response time improvement'
      });
    }

    // Database optimization
    if (performance.summary.avgDatabaseQueryTime > 500) {
      recommendations.push({
        type: performance.summary.avgDatabaseQueryTime > 1000 ? 'critical' : 'warning' as const,
        title: 'Slow Database Queries',
        description: `Average database query time is ${performance.summary.avgDatabaseQueryTime}ms`,
        action: 'Add database indexes, optimize query patterns, implement query result caching',
        estimatedImpact: 'Potential 40-70% query time reduction'
      });
    }

    // Error rate concerns
    if (performance.summary.errorRate > 2) {
      recommendations.push({
        type: performance.summary.errorRate > 5 ? 'critical' : 'warning' as const,
        title: 'High Error Rate',
        description: `Current error rate is ${performance.summary.errorRate}%`,
        action: 'Implement circuit breakers, improve error handling, review external API reliability',
        estimatedImpact: 'Improved system reliability and user experience'
      });
    }

    // Bottleneck-specific recommendations
    for (const bottleneck of performance.bottlenecks) {
      if (bottleneck.severity === 'high') {
        recommendations.push({
          type: 'critical' as const,
          title: `Performance Bottleneck: ${bottleneck.endpoint}`,
          description: bottleneck.issue,
          action: bottleneck.recommendation,
          estimatedImpact: 'Significant performance improvement for affected endpoints'
        });
      }
    }

    // Optimization opportunities
    for (const opportunity of performance.optimizationOpportunities) {
      recommendations.push({
        type: 'optimization' as const,
        title: opportunity.type,
        description: opportunity.description,
        action: `Difficulty: ${opportunity.difficulty}. Consider implementation based on resource availability.`,
        estimatedImpact: opportunity.estimatedImprovement
      });
    }
  }

  // Sort recommendations by priority
  recommendations.sort((a, b) => {
    const priority: Record<string, number> = { critical: 0, warning: 1, optimization: 2 };
    return (priority[a.type] || 3) - (priority[b.type] || 3);
  });

  return recommendations.slice(0, 10) as Array<{
    type: 'critical' | 'warning' | 'optimization';
    title: string;
    description: string;
    action: string;
    estimatedImpact: string;
  }>; // Limit to top 10 recommendations
}

// ==================== OPTIONS HANDLER ====================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}