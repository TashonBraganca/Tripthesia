/**
 * API Monitoring & Cost Tracking System
 * Part of Phase 0: API Key Collection & Infrastructure Setup
 */

import { Redis } from '@upstash/redis';

// API usage tracking interfaces
export interface APIUsageRecord {
  apiName: string;
  endpoint: string;
  method: string;
  timestamp: number;
  responseTime: number;
  status: number;
  success: boolean;
  cost?: number;
  userId?: string;
  requestId: string;
  cacheHit?: boolean;
}

export interface APIQuotaConfig {
  apiName: string;
  dailyLimit: number;
  monthlyLimit: number;
  costPerRequest: number;
  currency: 'USD' | 'EUR';
  resetTime: string; // UTC time for daily reset (e.g., "00:00")
}

export interface APIUsageStats {
  apiName: string;
  period: 'hour' | 'day' | 'month';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCost: number;
  quotaUsage: number; // percentage
  cacheHitRate: number;
  errorRate: number;
}

// API quota configurations
export const API_QUOTAS: APIQuotaConfig[] = [
  // Flight APIs
  { apiName: 'kiwi_tequila', dailyLimit: 33, monthlyLimit: 1000, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  { apiName: 'amadeus', dailyLimit: 333, monthlyLimit: 10000, costPerRequest: 0.005, currency: 'USD', resetTime: '00:00' },
  { apiName: 'aviationstack', dailyLimit: 33, monthlyLimit: 1000, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  
  // Hotel APIs
  { apiName: 'booking_com', dailyLimit: 1000, monthlyLimit: 30000, costPerRequest: 0.001, currency: 'USD', resetTime: '00:00' },
  
  // Transport APIs
  { apiName: 'rome2rio', dailyLimit: 33, monthlyLimit: 1000, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  { apiName: 'cartrawler', dailyLimit: 500, monthlyLimit: 15000, costPerRequest: 0.002, currency: 'USD', resetTime: '00:00' },
  
  // Maps APIs
  { apiName: 'mapbox', dailyLimit: 1667, monthlyLimit: 50000, costPerRequest: 0.0005, currency: 'USD', resetTime: '00:00' },
  { apiName: 'google_maps', dailyLimit: 100, monthlyLimit: 3000, costPerRequest: 0.005, currency: 'USD', resetTime: '00:00' },
  
  // POI APIs
  { apiName: 'opentripmap', dailyLimit: 1000, monthlyLimit: 30000, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  { apiName: 'foursquare', dailyLimit: 950, monthlyLimit: 28500, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  { apiName: 'yelp', dailyLimit: 5000, monthlyLimit: 150000, costPerRequest: 0, currency: 'USD', resetTime: '00:00' },
  
  // AI APIs
  { apiName: 'gemini', dailyLimit: 1500, monthlyLimit: 45000, costPerRequest: 0.0001, currency: 'USD', resetTime: '00:00' },
  { apiName: 'openai', dailyLimit: 200, monthlyLimit: 6000, costPerRequest: 0.01, currency: 'USD', resetTime: '00:00' },
];

export class APIMonitor {
  private redis: Redis;
  private static instance: APIMonitor;
  
  constructor() {
    this.redis = Redis.fromEnv();
  }
  
  public static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor();
    }
    return APIMonitor.instance;
  }
  
  /**
   * Track API usage
   */
  async trackUsage(record: APIUsageRecord): Promise<void> {
    const now = new Date();
    const hourKey = `api:usage:${record.apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}:${now.getHours()}`;
    const dayKey = `api:usage:${record.apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const monthKey = `api:usage:${record.apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const pipeline = this.redis.pipeline();
    
    // Store detailed record
    pipeline.lpush(`api:records:${record.apiName}`, JSON.stringify(record));
    pipeline.expire(`api:records:${record.apiName}`, 86400 * 7); // Keep for 7 days
    
    // Update hourly stats
    pipeline.hincrby(hourKey, 'total_requests', 1);
    pipeline.hincrby(hourKey, record.success ? 'successful_requests' : 'failed_requests', 1);
    pipeline.hincrby(hourKey, 'total_response_time', record.responseTime);
    if (record.cost) pipeline.hincrbyfloat(hourKey, 'total_cost', record.cost);
    if (record.cacheHit) pipeline.hincrby(hourKey, 'cache_hits', 1);
    pipeline.expire(hourKey, 86400 * 2); // Keep hourly data for 2 days
    
    // Update daily stats
    pipeline.hincrby(dayKey, 'total_requests', 1);
    pipeline.hincrby(dayKey, record.success ? 'successful_requests' : 'failed_requests', 1);
    pipeline.hincrby(dayKey, 'total_response_time', record.responseTime);
    if (record.cost) pipeline.hincrbyfloat(dayKey, 'total_cost', record.cost);
    if (record.cacheHit) pipeline.hincrby(dayKey, 'cache_hits', 1);
    pipeline.expire(dayKey, 86400 * 32); // Keep daily data for 32 days
    
    // Update monthly stats
    pipeline.hincrby(monthKey, 'total_requests', 1);
    pipeline.hincrby(monthKey, record.success ? 'successful_requests' : 'failed_requests', 1);
    pipeline.hincrby(monthKey, 'total_response_time', record.responseTime);
    if (record.cost) pipeline.hincrbyfloat(monthKey, 'total_cost', record.cost);
    if (record.cacheHit) pipeline.hincrby(monthKey, 'cache_hits', 1);
    pipeline.expire(monthKey, 86400 * 365); // Keep monthly data for 1 year
    
    await pipeline.exec();
  }
  
  /**
   * Check if API is within quota limits
   */
  async checkQuota(apiName: string): Promise<{ 
    canMakeRequest: boolean; 
    dailyUsage: number; 
    monthlyUsage: number; 
    quotaConfig: APIQuotaConfig | null 
  }> {
    const quotaConfig = API_QUOTAS.find(q => q.apiName === apiName);
    if (!quotaConfig) {
      return { canMakeRequest: true, dailyUsage: 0, monthlyUsage: 0, quotaConfig: null };
    }
    
    const now = new Date();
    const dayKey = `api:usage:${apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const monthKey = `api:usage:${apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const [dailyStats, monthlyStats] = await Promise.all([
      this.redis.hgetall(dayKey),
      this.redis.hgetall(monthKey),
    ]);
    
    const dailyUsage = parseInt((dailyStats?.total_requests as string) || '0');
    const monthlyUsage = parseInt((monthlyStats?.total_requests as string) || '0');
    
    const canMakeRequest = 
      dailyUsage < quotaConfig.dailyLimit && 
      monthlyUsage < quotaConfig.monthlyLimit;
    
    return {
      canMakeRequest,
      dailyUsage,
      monthlyUsage,
      quotaConfig,
    };
  }
  
  /**
   * Get usage statistics for an API
   */
  async getUsageStats(apiName: string, period: 'hour' | 'day' | 'month'): Promise<APIUsageStats | null> {
    const now = new Date();
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `api:usage:${apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}:${now.getHours()}`;
        break;
      case 'day':
        key = `api:usage:${apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        break;
      case 'month':
        key = `api:usage:${apiName}:${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
    }
    
    const stats = await this.redis.hgetall(key);
    if (!stats || Object.keys(stats).length === 0) {
      return null;
    }
    
    const totalRequests = parseInt((stats?.total_requests as string) || '0');
    const successfulRequests = parseInt((stats?.successful_requests as string) || '0');
    const failedRequests = parseInt((stats?.failed_requests as string) || '0');
    const totalResponseTime = parseInt((stats?.total_response_time as string) || '0');
    const totalCost = parseFloat((stats?.total_cost as string) || '0');
    const cacheHits = parseInt((stats?.cache_hits as string) || '0');
    
    const quotaConfig = API_QUOTAS.find(q => q.apiName === apiName);
    const quotaUsage = quotaConfig ? 
      (period === 'day' ? (totalRequests / quotaConfig.dailyLimit) * 100 : 
       period === 'month' ? (totalRequests / quotaConfig.monthlyLimit) * 100 : 0) : 0;
    
    return {
      apiName,
      period,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      totalCost,
      quotaUsage,
      cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
    };
  }
  
  /**
   * Get overall platform statistics
   */
  async getPlatformStats(): Promise<{
    totalAPIs: number;
    totalDailyCost: number;
    totalMonthlyCost: number;
    apiHealthScores: Record<string, number>;
    quotaAlerts: string[];
    costAlerts: string[];
  }> {
    const now = new Date();
    const dayKey = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
    
    let totalDailyCost = 0;
    let totalMonthlyCost = 0;
    const apiHealthScores: Record<string, number> = {};
    const quotaAlerts: string[] = [];
    const costAlerts: string[] = [];
    
    for (const quota of API_QUOTAS) {
      const [dailyStats, monthlyStats] = await Promise.all([
        this.redis.hgetall(`api:usage:${quota.apiName}:${dayKey}`),
        this.redis.hgetall(`api:usage:${quota.apiName}:${monthKey}`),
      ]);
      
      // Calculate costs
      const dailyCost = parseFloat((dailyStats?.total_cost as string) || '0');
      const monthlyCost = parseFloat((monthlyStats?.total_cost as string) || '0');
      totalDailyCost += dailyCost;
      totalMonthlyCost += monthlyCost;
      
      // Calculate health score (based on success rate and response time)
      const totalRequests = parseInt((dailyStats?.total_requests as string) || '0');
      const successfulRequests = parseInt((dailyStats?.successful_requests as string) || '0');
      const totalResponseTime = parseInt((dailyStats?.total_response_time as string) || '0');
      
      if (totalRequests > 0) {
        const successRate = (successfulRequests / totalRequests) * 100;
        const avgResponseTime = totalResponseTime / totalRequests;
        const healthScore = Math.max(0, Math.min(100, 
          (successRate * 0.7) + // 70% weight for success rate
          (Math.max(0, 100 - (avgResponseTime / 1000) * 10) * 0.3) // 30% weight for response time
        ));
        apiHealthScores[quota.apiName] = Math.round(healthScore);
      } else {
        apiHealthScores[quota.apiName] = 100; // No requests = perfect health
      }
      
      // Check quota alerts
      const dailyUsage = parseInt((dailyStats?.total_requests as string) || '0');
      const monthlyUsage = parseInt((monthlyStats?.total_requests as string) || '0');
      
      if (dailyUsage / quota.dailyLimit > 0.8) {
        quotaAlerts.push(`${quota.apiName}: Daily quota 80% exceeded (${dailyUsage}/${quota.dailyLimit})`);
      }
      
      if (monthlyUsage / quota.monthlyLimit > 0.8) {
        quotaAlerts.push(`${quota.apiName}: Monthly quota 80% exceeded (${monthlyUsage}/${quota.monthlyLimit})`);
      }
      
      // Check cost alerts
      if (dailyCost > 10) { // Alert if daily cost > $10
        costAlerts.push(`${quota.apiName}: High daily cost $${dailyCost.toFixed(2)}`);
      }
      
      if (monthlyCost > 100) { // Alert if monthly cost > $100
        costAlerts.push(`${quota.apiName}: High monthly cost $${monthlyCost.toFixed(2)}`);
      }
    }
    
    // Platform-wide cost alerts
    if (totalDailyCost > 50) {
      costAlerts.unshift(`Platform: High daily cost $${totalDailyCost.toFixed(2)}`);
    }
    
    if (totalMonthlyCost > 500) {
      costAlerts.unshift(`Platform: High monthly cost $${totalMonthlyCost.toFixed(2)}`);
    }
    
    return {
      totalAPIs: API_QUOTAS.length,
      totalDailyCost,
      totalMonthlyCost,
      apiHealthScores,
      quotaAlerts,
      costAlerts,
    };
  }
  
  /**
   * Set cost alert thresholds
   */
  async setCostAlert(apiName: string, dailyThreshold: number, monthlyThreshold: number): Promise<void> {
    await this.redis.hset(`api:cost_alerts:${apiName}`, {
      daily_threshold: dailyThreshold,
      monthly_threshold: monthlyThreshold,
    });
  }
  
  /**
   * Get recent API errors for debugging
   */
  async getRecentErrors(apiName: string, limit = 10): Promise<APIUsageRecord[]> {
    const records = await this.redis.lrange(`api:records:${apiName}`, 0, limit * 2); // Get more to filter
    const parsedRecords = records.map(record => JSON.parse(record) as APIUsageRecord);
    
    return parsedRecords
      .filter(record => !record.success)
      .slice(0, limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Clear old data (run daily)
   */
  async cleanup(): Promise<void> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const quota of API_QUOTAS) {
      // Clean up old detailed records
      const records = await this.redis.lrange(`api:records:${quota.apiName}`, 0, -1);
      const validRecords = records
        .map(record => JSON.parse(record) as APIUsageRecord)
        .filter(record => record.timestamp > thirtyDaysAgo)
        .map(record => JSON.stringify(record));
      
      if (validRecords.length < records.length) {
        await this.redis.del(`api:records:${quota.apiName}`);
        if (validRecords.length > 0) {
          await this.redis.lpush(`api:records:${quota.apiName}`, ...validRecords);
        }
      }
    }
  }
}

// Helper function to create API monitoring middleware
export function createAPIMonitoringMiddleware(apiName: string) {
  const monitor = APIMonitor.getInstance();
  
  return async function <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method = 'GET',
    userId?: string
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = `${apiName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check quota before making request
    const quotaCheck = await monitor.checkQuota(apiName);
    if (!quotaCheck.canMakeRequest) {
      throw new Error(`API quota exceeded for ${apiName}. Daily: ${quotaCheck.dailyUsage}/${quotaCheck.quotaConfig?.dailyLimit}, Monthly: ${quotaCheck.monthlyUsage}/${quotaCheck.quotaConfig?.monthlyLimit}`);
    }
    
    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      // Calculate cost
      const quotaConfig = quotaCheck.quotaConfig;
      const cost = quotaConfig ? quotaConfig.costPerRequest : 0;
      
      // Track successful usage
      await monitor.trackUsage({
        apiName,
        endpoint,
        method,
        timestamp: startTime,
        responseTime,
        status: 200,
        success: true,
        cost,
        userId,
        requestId,
      });
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Track failed usage
      await monitor.trackUsage({
        apiName,
        endpoint,
        method,
        timestamp: startTime,
        responseTime,
        status: error instanceof Error && 'status' in error ? (error as any).status : 500,
        success: false,
        cost: 0, // Don't charge for failed requests
        userId,
        requestId,
      });
      
      throw error;
    }
  };
}

export default APIMonitor;