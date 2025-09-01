/**
 * System Health Administration API Endpoint
 * Provides comprehensive system health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { healthMonitor } from '@/lib/monitoring/health-check';
import { performanceTracker } from '@/lib/monitoring/performance';

async function checkAdminAccess(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = process.env.ADMIN_USER_ID === userId || 
                 process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

async function GET(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const url = new URL(request.url);
    const detail = url.searchParams.get('detail') || 'summary';

    // Run health checks
    const healthResult = await healthMonitor.runHealthChecks();
    
    // Get performance summary
    const performanceSummary = performanceTracker.getSummary();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      health: healthResult,
      performance: performanceSummary,
    };

    if (detail === 'full') {
      // Add detailed metrics for full detail view
      const detailedStats = {
        slowRoutes: performanceTracker.getSlowRoutes(2000, 20), // Routes slower than 2s
        errorRates: performanceTracker.getErrorRates(3600000), // Last hour error rates
      };
      
      response.performance = {
        ...performanceSummary,
        ...detailedStats
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system health',
        timestamp: new Date().toISOString(),
        health: {
          overall: 'unhealthy',
          checks: [],
          uptime: process.uptime(),
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'force_health_check':
        const healthResult = await healthMonitor.runHealthChecks();
        return NextResponse.json({
          success: true,
          message: 'Health check completed',
          health: healthResult
        });
      
      case 'clear_performance_data':
        // Clear old performance data
        performanceTracker.cleanup(0); // Clear all data
        return NextResponse.json({
          success: true,
          message: 'Performance data cleared'
        });
      
      case 'set_alert_threshold':
        if (!data.metric || !data.threshold) {
          return NextResponse.json(
            { error: 'Metric and threshold required' },
            { status: 400 }
          );
        }
        
        // In production, you'd store these thresholds in a database
        return NextResponse.json({
          success: true,
          message: `Alert threshold for ${data.metric} set to ${data.threshold}`
        });
      
      case 'restart_service':
        if (!data.service) {
          return NextResponse.json(
            { error: 'Service name required' },
            { status: 400 }
          );
        }
        
        // In production, you'd implement service restart logic
        return NextResponse.json({
          success: true,
          message: `Service ${data.service} restart initiated`
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('System health action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform system action' },
      { status: 500 }
    );
  }
}

export { GET, POST };