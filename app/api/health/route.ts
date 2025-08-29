import { NextRequest, NextResponse } from 'next/server';
import { healthMonitor } from '@/lib/monitoring/health-check';
import { performanceTracker } from '@/lib/monitoring/performance';
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@/lib/api/error-handler';
import { withPerformanceTracking } from '@/lib/monitoring/performance';

async function healthHandler(request: NextRequest) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  const includePerf = url.searchParams.get('performance') === 'true';

  // Run comprehensive health checks
  const healthResult = await healthMonitor.runHealthChecks();

  // Add performance data if requested
  let performanceData = undefined;
  if (includePerf) {
    performanceData = performanceTracker.getSummary();
  }

  const response = {
    ...healthResult,
    performance: performanceData,
  };

  // Return appropriate status based on health
  const statusCode = healthResult.overall === 'healthy' ? 200 : 
                    healthResult.overall === 'degraded' ? 200 : 503;

  // If not detailed, return minimal response
  if (!detailed && !includePerf) {
    return createSuccessResponse({
      status: healthResult.overall,
      uptime: healthResult.uptime,
      timestamp: healthResult.timestamp,
    }, statusCode);
  }

  return createSuccessResponse(response, statusCode);
}

// Wrap with performance tracking
export const GET = withPerformanceTracking(healthHandler, '/api/health');

// Simple HEAD request for basic availability check
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}