import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const PerformanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  timestamp: z.number(),
  url: z.string().url(),
  userAgent: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const ErrorReportSchema = z.object({
  errorId: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  level: z.enum(['critical', 'error', 'warning']),
  timestamp: z.number(),
  url: z.string().url(),
  userId: z.string().optional(),
  buildVersion: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const MonitoringBatchSchema = z.object({
  metrics: z.array(PerformanceMetricSchema),
  errors: z.array(ErrorReportSchema),
  timestamp: z.number(),
  sessionId: z.string(),
  buildVersion: z.string(),
});

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Max requests per window per IP
};

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (existing.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
        }
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = MonitoringBatchSchema.parse(body);
    
    const { metrics, errors, sessionId, buildVersion } = validatedData;
    
    // Process metrics
    for (const metric of metrics) {
      await processMetric(metric, sessionId, ip);
    }
    
    // Process errors
    for (const error of errors) {
      await processError(error, sessionId, ip);
    }
    
    // Log summary for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Monitoring batch processed: ${metrics.length} metrics, ${errors.length} errors`);
      
      // Log critical metrics
      const criticalMetrics = metrics.filter(m => isCriticalMetric(m));
      if (criticalMetrics.length > 0) {
        console.warn('⚠️ Critical performance metrics detected:', criticalMetrics);
      }
      
      // Log all errors in development
      if (errors.length > 0) {
        console.error('🚨 Errors reported:', errors);
      }
    }
    
    return new NextResponse('OK', { 
      status: 200,
      headers: {
        'X-Processed-Metrics': metrics.length.toString(),
        'X-Processed-Errors': errors.length.toString(),
      }
    });
    
  } catch (error) {
    console.error('Monitoring batch processing error:', error);
    
    // Return different status codes based on error type
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request format', { status: 400 });
    }
    
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Process individual metric
async function processMetric(metric: any, sessionId: string, ip: string) {
  try {
    // Core Web Vitals analysis
    if (isCoreWebVital(metric.name)) {
      await analyzeCoreWebVital(metric);
    }
    
    // User interaction analysis
    if (isUserInteraction(metric.name)) {
      await analyzeUserInteraction(metric);
    }
    
    // Performance regression detection
    if (isPerformanceMetric(metric.name)) {
      await checkPerformanceRegression(metric);
    }
    
    // Store metric for aggregation (in production, use a time-series database)
    await storeMetric(metric, sessionId, ip);
    
  } catch (error) {
    console.error('Metric processing error:', error);
  }
}

// Process individual error
async function processError(error: any, sessionId: string, ip: string) {
  try {
    // Immediate alerting for critical errors
    if (error.level === 'critical') {
      await sendCriticalErrorAlert(error);
    }
    
    // Error pattern detection
    await detectErrorPatterns(error);
    
    // Store error for analysis
    await storeError(error, sessionId, ip);
    
    // Auto-create bug reports for new error patterns
    if (await isNewErrorPattern(error)) {
      await createBugReport(error);
    }
    
  } catch (processingError) {
    console.error('Error processing error:', processingError);
  }
}

// Core Web Vitals analysis
async function analyzeCoreWebVital(metric: any) {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };
  
  const threshold = thresholds[metric.name];
  if (!threshold) return;
  
  let performance = 'good';
  if (metric.value > threshold.poor) {
    performance = 'poor';
  } else if (metric.value > threshold.good) {
    performance = 'needs-improvement';
  }
  
  // Alert on poor performance
  if (performance === 'poor') {
    console.warn(`⚠️ Poor ${metric.name} detected:`, {
      value: metric.value,
      threshold: threshold.poor,
      url: metric.url,
      userAgent: metric.userAgent,
    });
  }
}

// User interaction analysis
async function analyzeUserInteraction(metric: any) {
  // Track popular clicks
  if (metric.name === 'user_click') {
    // Could store click heat maps, popular elements, etc.
  }
  
  // Track form submissions
  if (metric.name === 'form_submit') {
    // Could track form completion rates, field drop-offs, etc.
  }
}

// Performance regression detection
async function checkPerformanceRegression(metric: any) {
  // Simple implementation - in production, compare against historical averages
  const criticalThresholds = {
    page_load_time: 5000, // 5 seconds
    LCP: 4000,
    FID: 300,
    CLS: 0.25,
  };
  
  const threshold = criticalThresholds[metric.name];
  if (threshold && metric.value > threshold) {
    console.warn(`📈 Performance regression detected for ${metric.name}:`, metric);
  }
}

// Store metric (replace with actual database in production)
async function storeMetric(metric: any, sessionId: string, ip: string) {
  // In production, store in time-series database like InfluxDB, TimescaleDB, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log('Storing metric:', { ...metric, sessionId });
  }
}

// Store error (replace with actual database in production)
async function storeError(error: any, sessionId: string, ip: string) {
  // In production, store in error tracking system like Sentry, Rollbar, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log('Storing error:', { ...error, sessionId });
  }
}

// Critical error alerting
async function sendCriticalErrorAlert(error: any) {
  // In production, send to Slack, email, PagerDuty, etc.
  console.error('🚨 CRITICAL ERROR ALERT:', error);
}

// Error pattern detection
async function detectErrorPatterns(error: any) {
  // Implement pattern detection logic
  // Could look for error spikes, new error types, etc.
}

// Check if error pattern is new
async function isNewErrorPattern(error: any): Promise<boolean> {
  // Simple implementation - in production, check against historical data
  return false;
}

// Create bug report
async function createBugReport(error: any) {
  // In production, integrate with issue tracking system
  console.log('Would create bug report for:', error.errorId);
}

// Helper functions
function isCriticalMetric(metric: any): boolean {
  const criticalThresholds = {
    LCP: 4000,
    FID: 300,
    CLS: 0.25,
    page_load_time: 5000,
  };
  
  const threshold = criticalThresholds[metric.name];
  return threshold && metric.value > threshold;
}

function isCoreWebVital(name: string): boolean {
  return ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(name);
}

function isUserInteraction(name: string): boolean {
  return ['user_click', 'form_submit', 'page_visibility'].includes(name);
}

function isPerformanceMetric(name: string): boolean {
  return ['page_load_time', 'resource_load', 'spa_navigation'].includes(name);
}

// Health check endpoint
export async function GET() {
  return new NextResponse(JSON.stringify({
    status: 'healthy',
    service: 'monitoring-batch',
    timestamp: Date.now(),
    rateLimitActive: rateLimitMap.size > 0,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}