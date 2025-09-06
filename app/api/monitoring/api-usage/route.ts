/**
 * API Usage Monitoring Endpoint
 * Part of Phase 0: API Key Collection & Infrastructure Setup
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import APIMonitor from '@/lib/monitoring/api-monitor';
import { z } from 'zod';

// Request validation schemas
const StatsQuerySchema = z.object({
  apiName: z.string().optional(),
  period: z.enum(['hour', 'day', 'month']).default('day'),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // TODO: Add admin role check in production
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return new Response('Forbidden', { status: 403 });
    // }
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    const monitor = APIMonitor.getInstance();
    
    switch (action) {
      case 'stats': {
        const { apiName, period } = StatsQuerySchema.parse({
          apiName: url.searchParams.get('apiName'),
          period: url.searchParams.get('period'),
        });
        
        if (apiName) {
          // Get stats for specific API
          const stats = await monitor.getUsageStats(apiName, period);
          return Response.json({ stats });
        } else {
          // Get platform-wide stats
          const platformStats = await monitor.getPlatformStats();
          return Response.json({ platformStats });
        }
      }
      
      case 'quota': {
        const apiName = url.searchParams.get('apiName');
        if (!apiName) {
          return new Response('API name required for quota check', { status: 400 });
        }
        
        const quotaInfo = await monitor.checkQuota(apiName);
        return Response.json({ quota: quotaInfo });
      }
      
      case 'errors': {
        const apiName = url.searchParams.get('apiName');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!apiName) {
          return new Response('API name required for error logs', { status: 400 });
        }
        
        const errors = await monitor.getRecentErrors(apiName, limit);
        return Response.json({ errors });
      }
      
      case 'health': {
        const platformStats = await monitor.getPlatformStats();
        
        // Calculate overall health score
        const healthScores = Object.values(platformStats.apiHealthScores);
        const overallHealth = healthScores.length > 0 
          ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
          : 100;
        
        const healthStatus = {
          overall: Math.round(overallHealth),
          status: overallHealth >= 90 ? 'healthy' : 
                  overallHealth >= 70 ? 'warning' : 'critical',
          apis: platformStats.apiHealthScores,
          alerts: {
            quota: platformStats.quotaAlerts,
            cost: platformStats.costAlerts,
          },
          costs: {
            daily: platformStats.totalDailyCost,
            monthly: platformStats.totalMonthlyCost,
          },
        };
        
        return Response.json({ health: healthStatus });
      }
      
      case 'all-stats': {
        // Get comprehensive stats for all APIs
        const apiNames = [
          'kiwi_tequila', 'amadeus', 'aviationstack',
          'booking_com', 'rome2rio', 'cartrawler',
          'mapbox', 'google_maps', 'opentripmap',
          'foursquare', 'yelp', 'gemini', 'openai'
        ];
        
        const { period } = StatsQuerySchema.parse({
          period: url.searchParams.get('period'),
        });
        
        const allStats = await Promise.all(
          apiNames.map(async (apiName) => {
            const stats = await monitor.getUsageStats(apiName, period);
            return { apiName, stats };
          })
        );
        
        const validStats = allStats.filter(({ stats }) => stats !== null);
        
        return Response.json({ 
          allStats: validStats,
          period,
          timestamp: new Date().toISOString(),
        });
      }
      
      default:
        return new Response('Invalid action', { status: 400 });
    }
    
  } catch (error) {
    console.error('API monitoring endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // TODO: Add admin role check in production
    
    const body = await request.json();
    const monitor = APIMonitor.getInstance();
    
    const { action } = body;
    
    switch (action) {
      case 'set-cost-alert': {
        const schema = z.object({
          apiName: z.string(),
          dailyThreshold: z.number().positive(),
          monthlyThreshold: z.number().positive(),
        });
        
        const { apiName, dailyThreshold, monthlyThreshold } = schema.parse(body);
        
        await monitor.setCostAlert(apiName, dailyThreshold, monthlyThreshold);
        
        return Response.json({ success: true, message: 'Cost alert thresholds set' });
      }
      
      case 'cleanup': {
        // Manual cleanup trigger (should normally run on schedule)
        await monitor.cleanup();
        
        return Response.json({ success: true, message: 'Cleanup completed' });
      }
      
      case 'track-usage': {
        // Manual usage tracking (for testing)
        const schema = z.object({
          apiName: z.string(),
          endpoint: z.string(),
          method: z.string().default('GET'),
          responseTime: z.number(),
          status: z.number(),
          success: z.boolean(),
          cost: z.number().optional(),
          cacheHit: z.boolean().optional(),
        });
        
        const record = schema.parse(body);
        
        await monitor.trackUsage({
          ...record,
          timestamp: Date.now(),
          requestId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
        });
        
        return Response.json({ success: true, message: 'Usage tracked' });
      }
      
      default:
        return new Response('Invalid action', { status: 400 });
    }
    
  } catch (error) {
    console.error('API monitoring POST error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}