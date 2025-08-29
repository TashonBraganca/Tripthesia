/**
 * Advanced health check system for monitoring application status
 */

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: string;
  error?: string;
  details?: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  uptime: number;
  version: string;
  timestamp: string;
}

export class HealthMonitor {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks() {
    this.registerCheck('database', this.checkDatabase);
    this.registerCheck('redis', this.checkRedis);
    this.registerCheck('external-apis', this.checkExternalAPIs);
    this.registerCheck('auth', this.checkAuth);
    this.registerCheck('disk-space', this.checkDiskSpace);
  }

  registerCheck(name: string, checkFn: () => Promise<HealthCheckResult>) {
    this.checks.set(name, checkFn);
  }

  async runHealthChecks(): Promise<SystemHealth> {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];
    
    // Run all checks in parallel with timeout
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
      try {
        const timeout = new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        );
        
        return await Promise.race([checkFn(), timeout]);
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    checks.push(...await Promise.all(checkPromises));

    // Determine overall health
    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      checks,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Dynamic import to avoid circular dependencies
      const dbModule = await import('../db');
      const { sql } = await import('drizzle-orm');
      
      const db = dbModule.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      await db.execute(sql`SELECT 1 as health_check`);
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          provider: 'PostgreSQL',
          connection: 'active',
        },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const redisModule = await import('../redis');
      
      // Test Redis connectivity
      const redis = redisModule.redis;
      const testKey = `health-check-${Date.now()}`;
      
      // Check if it's MockRedis or real Redis
      if ('set' in redis && typeof redis.set === 'function') {
        await redis.set(testKey, 'ok', { ex: 10 });
        const result = await redis.get(testKey);
        await redis.del(testKey);
        
        if (result !== 'ok') {
          throw new Error('Redis read/write test failed');
        }
      } else {
        // Mock Redis fallback
        throw new Error('Redis not properly configured');
      }
      
      return {
        service: 'redis',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          provider: 'Upstash',
          operation: 'read/write',
        },
      };
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkExternalAPIs(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const apiTests = [];
    
    try {
      // Test OpenAI API
      if (process.env.OPENAI_API_KEY) {
        apiTests.push(
          fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            signal: AbortSignal.timeout(5000),
          })
        );
      }
      
      // Test Amadeus API (if available)
      if (process.env.AMADEUS_CLIENT_ID) {
        apiTests.push(
          fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=client_credentials',
            signal: AbortSignal.timeout(5000),
          })
        );
      }
      
      if (apiTests.length === 0) {
        return {
          service: 'external-apis',
          status: 'degraded',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          details: { message: 'No external APIs configured' },
        };
      }
      
      const results = await Promise.allSettled(apiTests);
      const failedCount = results.filter(r => r.status === 'rejected').length;
      
      return {
        service: 'external-apis',
        status: failedCount === 0 ? 'healthy' : failedCount < results.length ? 'degraded' : 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          tested: results.length,
          failed: failedCount,
          apis: ['OpenAI', 'Amadeus'].slice(0, results.length),
        },
      };
    } catch (error) {
      return {
        service: 'external-apis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkAuth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test Clerk webhook endpoint availability
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/clerk`;
      
      // Simple HEAD request to check if the endpoint exists
      const response = await fetch(webhookUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      return {
        service: 'auth',
        status: response.status === 405 ? 'healthy' : 'degraded', // 405 is expected for HEAD on webhook
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          provider: 'Clerk',
          endpoint: 'webhook',
          statusCode: response.status,
        },
      };
    } catch (error) {
      return {
        service: 'auth',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // In Node.js environment, we'll check memory usage as a proxy
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const freeMemPercent = ((totalMem - usedMem) / totalMem) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (freeMemPercent < 10) {
        status = 'unhealthy';
      } else if (freeMemPercent < 25) {
        status = 'degraded';
      }
      
      return {
        service: 'disk-space',
        status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          heapUsed: Math.round(usedMem / 1024 / 1024),
          heapTotal: Math.round(totalMem / 1024 / 1024),
          freePercent: Math.round(freeMemPercent),
          unit: 'MB',
        },
      };
    } catch (error) {
      return {
        service: 'disk-space',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();