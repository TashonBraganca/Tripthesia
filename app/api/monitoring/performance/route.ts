import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Performance metrics schema
const PerformanceMetricSchema = z.object({
  type: z.enum(['core-web-vitals', 'api-performance', 'page-load', 'user-interaction']),
  name: z.string(),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string(),
  url: z.string().optional(),
  timestamp: z.string(),
  additionalData: z.record(z.any()).optional()
});

const PerformanceBatchSchema = z.object({
  metrics: z.array(PerformanceMetricSchema),
  sessionId: z.string(),
  userId: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string()
});

// In-memory storage for development (use Redis/Database in production)
const performanceStore = new Map<string, any>();
const alertThresholds = {
  'core-web-vitals': {
    'CLS': { good: 0.1, poor: 0.25 },
    'FID': { good: 100, poor: 300 },
    'LCP': { good: 2500, poor: 4000 },
    'FCP': { good: 1800, poor: 3000 },
    'TTFB': { good: 800, poor: 1800 }
  },
  'api-performance': {
    'response-time': { good: 200, poor: 1000 },
    'error-rate': { good: 1, poor: 5 }
  },
  'page-load': {
    'total-load-time': { good: 3000, poor: 5000 },
    'dom-content-loaded': { good: 1500, poor: 3000 }
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PerformanceBatchSchema.parse(body);

    // Process each metric
    for (const metric of validatedData.metrics) {
      await processPerformanceMetric(metric, validatedData);
    }

    return NextResponse.json({
      success: true,
      processed: validatedData.metrics.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing performance metrics:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

async function processPerformanceMetric(metric: any, batch: any): Promise<void> {
  const key = `${metric.type}-${metric.name}`;
  
  // Store metric with aggregation
  let storedMetric = performanceStore.get(key);
  if (!storedMetric) {
    storedMetric = {
      type: metric.type,
      name: metric.name,
      values: [],
      count: 0,
      sum: 0,
      min: metric.value,
      max: metric.value,
      avg: metric.value,
      p50: 0,
      p90: 0,
      p95: 0,
      firstRecorded: metric.timestamp,
      lastRecorded: metric.timestamp
    };
  }

  // Update aggregated data
  storedMetric.values.push(metric.value);
  storedMetric.count++;
  storedMetric.sum += metric.value;
  storedMetric.min = Math.min(storedMetric.min, metric.value);
  storedMetric.max = Math.max(storedMetric.max, metric.value);
  storedMetric.avg = storedMetric.sum / storedMetric.count;
  storedMetric.lastRecorded = metric.timestamp;

  // Calculate percentiles
  const sortedValues = [...storedMetric.values].sort((a, b) => a - b);
  const len = sortedValues.length;
  storedMetric.p50 = sortedValues[Math.floor(len * 0.5)] || 0;
  storedMetric.p90 = sortedValues[Math.floor(len * 0.9)] || 0;
  storedMetric.p95 = sortedValues[Math.floor(len * 0.95)] || 0;

  // Keep only last 1000 values to prevent memory issues
  if (storedMetric.values.length > 1000) {
    storedMetric.values = storedMetric.values.slice(-1000);
  }

  performanceStore.set(key, storedMetric);

  // Check for alerts
  await checkPerformanceAlerts(metric, storedMetric);

  // Log performance data
  logPerformanceMetric(metric, storedMetric);
}

async function checkPerformanceAlerts(metric: any, aggregated: any): Promise<void> {
  const thresholds = alertThresholds[metric.type as keyof typeof alertThresholds];
  if (!thresholds) return;

  const metricThreshold = (thresholds as any)[metric.name];
  if (!metricThreshold) return;

  let alertLevel: 'warning' | 'critical' | null = null;

  // Determine alert level based on thresholds
  if (metric.value > metricThreshold.poor) {
    alertLevel = 'critical';
  } else if (metric.value > metricThreshold.good) {
    alertLevel = 'warning';
  }

  // Also check if P95 is consistently poor
  if (aggregated.count > 10 && aggregated.p95 > metricThreshold.poor) {
    alertLevel = 'critical';
  }

  if (alertLevel) {
    await sendPerformanceAlert({
      level: alertLevel,
      metric: metric.name,
      type: metric.type,
      value: metric.value,
      threshold: metricThreshold,
      aggregated,
      url: metric.url,
      timestamp: metric.timestamp
    });
  }
}

async function sendPerformanceAlert(alertData: any): Promise<void> {
  console.warn('🚨 PERFORMANCE ALERT:', {
    level: alertData.level,
    metric: `${alertData.type}:${alertData.metric}`,
    value: alertData.value,
    threshold: alertData.threshold,
    url: alertData.url,
    p95: alertData.aggregated.p95,
    count: alertData.aggregated.count
  });

  // Send to external monitoring services
  try {
    if (process.env.PERFORMANCE_ALERT_WEBHOOK) {
      await fetch(process.env.PERFORMANCE_ALERT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 Performance Alert: ${alertData.metric}`,
          attachments: [
            {
              color: alertData.level === 'critical' ? 'danger' : 'warning',
              fields: [
                {
                  title: 'Metric',
                  value: `${alertData.type}:${alertData.metric}`,
                  short: true
                },
                {
                  title: 'Value',
                  value: `${alertData.value}ms`,
                  short: true
                },
                {
                  title: 'Threshold',
                  value: `Good: ${alertData.threshold.good}ms, Poor: ${alertData.threshold.poor}ms`,
                  short: false
                },
                {
                  title: 'URL',
                  value: alertData.url || 'Unknown',
                  short: false
                },
                {
                  title: 'P95',
                  value: `${alertData.aggregated.p95}ms (${alertData.aggregated.count} samples)`,
                  short: true
                }
              ]
            }
          ]
        })
      });
    }
  } catch (error) {
    console.error('Failed to send performance alert:', error);
  }
}

function logPerformanceMetric(metric: any, aggregated: any): void {
  // Log different levels based on performance
  const logLevel = metric.rating === 'poor' ? 'warn' : 
                   metric.rating === 'needs-improvement' ? 'info' : 'debug';

  const logFunction = console[logLevel as 'warn' | 'info' | 'debug'] as (message?: any, ...optionalParams: any[]) => void;
  logFunction(`[PERF] ${metric.type}:${metric.name}`, {
    value: metric.value,
    avg: aggregated.avg.toFixed(2),
    p95: aggregated.p95,
    count: aggregated.count,
    url: metric.url,
    rating: metric.rating
  });
}

// GET endpoint for performance dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let metrics;
    if (type) {
      // Filter by type
      metrics = Array.from(performanceStore.entries())
        .filter(([key, _]) => key.startsWith(type))
        .map(([key, value]) => ({ key, ...value }))
        .slice(0, limit);
    } else {
      // All metrics
      metrics = Array.from(performanceStore.entries())
        .map(([key, value]) => ({ key, ...value }))
        .slice(0, limit);
    }

    const dashboard = {
      timestamp: new Date().toISOString(),
      totalMetrics: performanceStore.size,
      metrics,
      summary: generatePerformanceSummary(),
      recommendations: generatePerformanceRecommendations()
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error generating performance dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance dashboard' },
      { status: 500 }
    );
  }
}

function generatePerformanceSummary() {
  const coreWebVitals = Array.from(performanceStore.entries())
    .filter(([key, _]) => key.startsWith('core-web-vitals'))
    .reduce((acc, [key, metric]) => {
      const metricName = key.replace('core-web-vitals-', '');
      acc[metricName] = {
        avg: parseFloat(metric.avg.toFixed(2)),
        p95: metric.p95,
        count: metric.count,
        rating: getRating(metricName, metric.p95)
      };
      return acc;
    }, {} as any);

  const apiPerformance = Array.from(performanceStore.entries())
    .filter(([key, _]) => key.startsWith('api-performance'))
    .reduce((acc, [key, metric]) => {
      const metricName = key.replace('api-performance-', '');
      acc[metricName] = {
        avg: parseFloat(metric.avg.toFixed(2)),
        p95: metric.p95,
        count: metric.count
      };
      return acc;
    }, {} as any);

  return {
    coreWebVitals,
    apiPerformance,
    overallScore: calculateOverallScore(coreWebVitals)
  };
}

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const coreWebVitalsThresholds = alertThresholds['core-web-vitals'];
  const thresholds = (coreWebVitalsThresholds as any)[metricName];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function calculateOverallScore(coreWebVitals: any): number {
  const metrics = Object.values(coreWebVitals);
  if (metrics.length === 0) return 100;

  const scores = metrics.map((metric: any) => {
    switch (metric.rating) {
      case 'good': return 100;
      case 'needs-improvement': return 70;
      case 'poor': return 30;
      default: return 100;
    }
  });

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function generatePerformanceRecommendations(): Array<{level: string, issue: string, suggestion: string}> {
  const recommendations = [];

  const coreWebVitals = Array.from(performanceStore.entries())
    .filter(([key, _]) => key.startsWith('core-web-vitals'));

  for (const [key, metric] of coreWebVitals) {
    const metricName = key.replace('core-web-vitals-', '');
    const rating = getRating(metricName, metric.p95);

    if (rating === 'poor') {
      recommendations.push({
        level: 'HIGH',
        issue: `Poor ${metricName} performance (P95: ${metric.p95}ms)`,
        suggestion: getPerformanceSuggestion(metricName)
      });
    } else if (rating === 'needs-improvement') {
      recommendations.push({
        level: 'MEDIUM',
        issue: `${metricName} needs improvement (P95: ${metric.p95}ms)`,
        suggestion: getPerformanceSuggestion(metricName)
      });
    }
  }

  return recommendations;
}

function getPerformanceSuggestion(metricName: string): string {
  const suggestions = {
    'CLS': 'Reduce layout shifts by setting image dimensions, avoiding dynamically injected content above fold',
    'FID': 'Reduce main thread blocking time, minimize JavaScript execution time, use web workers',
    'LCP': 'Optimize image loading, improve server response time, eliminate render-blocking resources',
    'FCP': 'Minimize render-blocking resources, optimize web fonts, improve server response time',
    'TTFB': 'Optimize server performance, use CDN, implement proper caching strategies'
  };

  return suggestions[metricName as keyof typeof suggestions] || 'Optimize resource loading and reduce execution time';
}