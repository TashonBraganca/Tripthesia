/**
 * Comprehensive Health Check Endpoint
 * Part of Phase 0: API Key Collection & Infrastructure Setup
 */

import { NextRequest } from 'next/server';
import { validateEnvironment, APIAvailabilityChecker } from '@/lib/config/environment';
import APIMonitor from '@/lib/monitoring/api-monitor';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: {
    environment: {
      status: 'pass' | 'fail';
      warnings: string[];
      criticalMissing: string[];
      details?: any;
    };
    database: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    apis: {
      status: 'pass' | 'warning' | 'fail';
      available: Record<string, boolean>;
      summary: {
        total: number;
        available: number;
        unavailable: number;
      };
    };
    monitoring: {
      status: 'pass' | 'fail';
      platformStats?: any;
      error?: string;
    };
  };
  recommendations: string[];
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get('details') === 'true';
    const checkAPIs = url.searchParams.get('apis') !== 'false';
    
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        environment: { status: 'pass', warnings: [], criticalMissing: [] },
        database: { status: 'pass' },
        redis: { status: 'pass' },
        apis: { status: 'pass', available: {}, summary: { total: 0, available: 0, unavailable: 0 } },
        monitoring: { status: 'pass' },
      },
      recommendations: [],
    };
    
    // 1. Environment validation
    console.log('🔧 Checking environment configuration...');
    const envCheck = validateEnvironment();
    
    if (envCheck.success) {
      result.checks.environment.status = 'pass';
      result.checks.environment.warnings = envCheck.warnings || [];
      result.checks.environment.criticalMissing = envCheck.criticalMissing || [];
      
      if (includeDetails) {
        result.checks.environment.details = {
          isProduction: envCheck.isProduction,
          nodeEnv: envCheck.env?.NODE_ENV,
        };
      }
      
      // Add recommendations based on warnings
      if (envCheck.warnings?.length) {
        result.recommendations.push(...envCheck.warnings.map(w => `Environment: ${w}`));
        if (result.status === 'healthy') result.status = 'warning';
      }
      
      if (envCheck.criticalMissing?.length) {
        result.recommendations.push(...envCheck.criticalMissing.map(m => `Critical: ${m}`));
        result.status = 'critical';
      }
      
    } else {
      result.checks.environment.status = 'fail';
      result.checks.environment.criticalMissing = envCheck.details || [];
      result.status = 'critical';
      result.recommendations.push('Fix environment configuration errors before proceeding');
    }
    
    // 2. Database connectivity check
    console.log('💾 Checking database connectivity...');
    try {
      const dbStart = Date.now();
      
      // Simple connectivity test using proper SQL
      if (!db) throw new Error('Database not initialized');
      await db.execute(sql`SELECT 1 as test_column LIMIT 1`);
      
      result.checks.database.responseTime = Date.now() - dbStart;
      result.checks.database.status = 'pass';
      
      if (result.checks.database.responseTime > 1000) {
        result.recommendations.push('Database response time is slow (>1s)');
        if (result.status === 'healthy') result.status = 'warning';
      }
      
    } catch (error) {
      result.checks.database.status = 'fail';
      result.checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
      result.status = 'critical';
      result.recommendations.push('Database connectivity failed - check DATABASE_URL');
    }
    
    // 3. Redis connectivity check
    console.log('🗂️  Checking Redis connectivity...');
    try {
      const redisStart = Date.now();
      const redis = Redis.fromEnv();
      
      // Simple ping test
      await redis.ping();
      
      result.checks.redis.responseTime = Date.now() - redisStart;
      result.checks.redis.status = 'pass';
      
      if (result.checks.redis.responseTime > 500) {
        result.recommendations.push('Redis response time is slow (>500ms)');
        if (result.status === 'healthy') result.status = 'warning';
      }
      
    } catch (error) {
      result.checks.redis.status = 'fail';
      result.checks.redis.error = error instanceof Error ? error.message : 'Unknown Redis error';
      result.status = 'critical';
      result.recommendations.push('Redis connectivity failed - check UPSTASH_REDIS_* variables');
    }
    
    // 4. API availability checks
    if (checkAPIs) {
      console.log('🌐 Checking external API availability...');
      try {
        const apiChecker = APIAvailabilityChecker.getInstance();
        const apiAvailability = await apiChecker.checkAllAPIs();
        
        result.checks.apis.available = apiAvailability;
        
        const totalAPIs = Object.keys(apiAvailability).length;
        const availableAPIs = Object.values(apiAvailability).filter(Boolean).length;
        const unavailableAPIs = totalAPIs - availableAPIs;
        
        result.checks.apis.summary = {
          total: totalAPIs,
          available: availableAPIs,
          unavailable: unavailableAPIs,
        };
        
        if (unavailableAPIs > 0) {
          const unavailableList = Object.entries(apiAvailability)
            .filter(([, available]) => !available)
            .map(([name]) => name);
          
          result.recommendations.push(
            `${unavailableAPIs} APIs unavailable: ${unavailableList.join(', ')}`
          );
          
          if (unavailableAPIs / totalAPIs > 0.5) {
            result.checks.apis.status = 'fail';
            result.status = 'critical';
          } else {
            result.checks.apis.status = 'warning';
            if (result.status === 'healthy') result.status = 'warning';
          }
        }
        
      } catch (error) {
        result.checks.apis.status = 'fail';
        result.status = 'critical';
        result.recommendations.push('API availability checks failed');
      }
    }
    
    // 5. Monitoring system check
    console.log('📊 Checking monitoring system...');
    try {
      const monitor = APIMonitor.getInstance();
      const platformStats = await monitor.getPlatformStats();
      
      result.checks.monitoring.status = 'pass';
      
      if (includeDetails) {
        result.checks.monitoring.platformStats = platformStats;
      }
      
      // Add monitoring-based recommendations
      if (platformStats.quotaAlerts.length > 0) {
        result.recommendations.push(...platformStats.quotaAlerts.map(alert => `Quota: ${alert}`));
        if (result.status === 'healthy') result.status = 'warning';
      }
      
      if (platformStats.costAlerts.length > 0) {
        result.recommendations.push(...platformStats.costAlerts.map(alert => `Cost: ${alert}`));
        if (result.status === 'healthy') result.status = 'warning';
      }
      
      // Check for unhealthy APIs
      const unhealthyAPIs = Object.entries(platformStats.apiHealthScores)
        .filter(([, score]) => score < 70)
        .map(([name, score]) => `${name} (${score}%)`);
      
      if (unhealthyAPIs.length > 0) {
        result.recommendations.push(`Unhealthy APIs detected: ${unhealthyAPIs.join(', ')}`);
        if (result.status === 'healthy') result.status = 'warning';
      }
      
    } catch (error) {
      result.checks.monitoring.status = 'fail';
      result.checks.monitoring.error = error instanceof Error ? error.message : 'Unknown monitoring error';
      result.recommendations.push('Monitoring system check failed');
      if (result.status === 'healthy') result.status = 'warning';
    }
    
    // Overall recommendations
    if (result.recommendations.length === 0) {
      result.recommendations.push('All systems operational ✅');
    }
    
    // Add Phase 0 completion status
    const phase0Complete = 
      result.checks.environment.status === 'pass' &&
      result.checks.database.status === 'pass' &&
      result.checks.redis.status === 'pass' &&
      result.checks.monitoring.status === 'pass';
    
    if (includeDetails && phase0Complete) {
      result.recommendations.unshift('✅ Phase 0: API Infrastructure Setup - COMPLETE');
    } else if (includeDetails) {
      result.recommendations.unshift('⚠️ Phase 0: API Infrastructure Setup - IN PROGRESS');
    }
    
    console.log(`🏥 Health check complete: ${result.status.toUpperCase()}`);
    
    // Return appropriate HTTP status
    const httpStatus = result.status === 'critical' ? 503 : 
                      result.status === 'warning' ? 200 : 200;
    
    return Response.json(result, { status: httpStatus });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return Response.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Simple health endpoint for load balancers
export async function HEAD() {
  try {
    // Quick database ping
    if (!db) throw new Error('Database not initialized');
    await db.execute(sql`SELECT 1 as test_column LIMIT 1`);
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}