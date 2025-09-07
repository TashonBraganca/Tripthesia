/**
 * Cache Middleware - Phase 2.7
 * 
 * Intelligent caching middleware that automatically caches API responses:
 * - Automatic cache key generation based on request parameters
 * - Intelligent TTL selection based on endpoint and data volatility
 * - Request deduplication for concurrent identical requests
 * - Stale-while-revalidate implementation for optimal UX
 * - Cache invalidation strategies based on data relationships
 * - Performance monitoring integration
 * - Geographic and user-specific cache segmentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCacheManager, CacheKeyType } from './redis-cache-manager';
import { createPerformanceOptimizer, measurePerformance } from './performance-optimizer';
import crypto from 'crypto';

// ==================== CACHE CONFIGURATION ====================

export interface CacheMiddlewareConfig {
  enabled: boolean;
  defaultTTL: number;
  enableStaleWhileRevalidate: boolean;
  enableRequestDeduplication: boolean;
  enablePerformanceMonitoring: boolean;
  cacheableStatusCodes: number[];
  excludePatterns: RegExp[];
  includePatterns: RegExp[];
  customKeyGenerator?: (request: NextRequest) => string;
}

export const DEFAULT_CACHE_CONFIG: CacheMiddlewareConfig = {
  enabled: true,
  defaultTTL: 900, // 15 minutes
  enableStaleWhileRevalidate: true,
  enableRequestDeduplication: true,
  enablePerformanceMonitoring: true,
  cacheableStatusCodes: [200, 201, 206, 300, 301, 410],
  excludePatterns: [
    /\/api\/auth\//,
    /\/api\/user\/profile/,
    /\/api\/payment\//,
    /\/api\/admin\//
  ],
  includePatterns: [
    /\/api\/travel\//,
    /\/api\/flights\//,
    /\/api\/hotels\//,
    /\/api\/transport\//,
    /\/api\/poi\//,
    /\/api\/exchange-rates\//
  ]
};

// ==================== ENDPOINT CACHE STRATEGIES ====================

interface EndpointCacheStrategy {
  keyType: CacheKeyType;
  ttl: number;
  enableSWR: boolean;
  varyBy: string[]; // Parameters to include in cache key
  invalidateOn?: string[]; // Events that should invalidate this cache
  compressionEnabled: boolean;
  regionalized: boolean; // Whether to include region in cache key
  personalized: boolean; // Whether to include user ID in cache key
}

const ENDPOINT_STRATEGIES: Record<string, EndpointCacheStrategy> = {
  // Flight search endpoints
  '/api/flights/search': {
    keyType: 'flight_search',
    ttl: 300, // 5 minutes - prices change frequently
    enableSWR: true,
    varyBy: ['from', 'to', 'departureDate', 'returnDate', 'passengers', 'class', 'currency'],
    invalidateOn: ['flight_price_update'],
    compressionEnabled: true,
    regionalized: true,
    personalized: false
  },
  
  '/api/travel/unified': {
    keyType: 'flight_search', // Uses flight search TTL as it's the most volatile
    ttl: 300,
    enableSWR: true,
    varyBy: ['*'], // Include all query parameters
    compressionEnabled: true,
    regionalized: true,
    personalized: true // Include user preferences
  },

  // Hotel search endpoints
  '/api/hotels/search': {
    keyType: 'hotel_search',
    ttl: 900, // 15 minutes
    enableSWR: true,
    varyBy: ['location', 'checkIn', 'checkOut', 'guests', 'currency'],
    invalidateOn: ['hotel_availability_update'],
    compressionEnabled: true,
    regionalized: true,
    personalized: false
  },

  // Transport search
  '/api/transport/search': {
    keyType: 'transport_search',
    ttl: 1800, // 30 minutes - schedules relatively stable
    enableSWR: true,
    varyBy: ['from', 'to', 'date', 'transportTypes'],
    compressionEnabled: true,
    regionalized: true,
    personalized: false
  },

  // Points of Interest
  '/api/poi/search': {
    keyType: 'poi_search',
    ttl: 7200, // 2 hours - POI data rarely changes
    enableSWR: true,
    varyBy: ['location', 'radius', 'category', 'limit'],
    compressionEnabled: false, // Usually small responses
    regionalized: true,
    personalized: false
  },

  // Exchange rates
  '/api/exchange-rates': {
    keyType: 'exchange_rates',
    ttl: 3600, // 1 hour
    enableSWR: true,
    varyBy: ['from', 'to'],
    compressionEnabled: false,
    regionalized: false,
    personalized: false
  },

  // Price comparison
  '/api/price/compare': {
    keyType: 'price_comparison',
    ttl: 300, // 5 minutes
    enableSWR: true,
    varyBy: ['*'],
    compressionEnabled: true,
    regionalized: true,
    personalized: true
  }
};

// ==================== REQUEST DEDUPLICATION ====================

class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<NextResponse>>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request and store promise
    const promise = requestFn();
    this.pendingRequests.set(key, promise as Promise<NextResponse>);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up completed request
      this.pendingRequests.delete(key);
    }
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  clearPending(): void {
    this.pendingRequests.clear();
  }
}

// ==================== MAIN CACHE MIDDLEWARE ====================

export class CacheMiddleware {
  private cacheManager = createCacheManager();
  private performanceOptimizer = createPerformanceOptimizer();
  private deduplicator = new RequestDeduplicator();
  private config: CacheMiddlewareConfig;

  constructor(config: Partial<CacheMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  async handleRequest(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (!this.config.enabled) {
      return handler();
    }

    const startTime = Date.now();
    const pathname = new URL(request.url).pathname;
    const method = request.method;

    // Only cache GET requests by default
    if (method !== 'GET') {
      return handler();
    }

    // Check if endpoint should be cached
    const shouldCache = this.shouldCacheEndpoint(pathname);
    if (!shouldCache) {
      return handler();
    }

    const strategy = this.getEndpointStrategy(pathname);
    const cacheKey = this.generateCacheKey(request, strategy);
    const userId = this.extractUserId(request);
    const region = this.extractRegion(request);

    try {
      // Try cache first (with stale-while-revalidate support)
      const cachedResponse = await this.getCachedResponse(
        cacheKey,
        strategy,
        userId,
        region
      );

      if (cachedResponse) {
        // Record cache hit performance
        if (this.config.enablePerformanceMonitoring) {
          await this.performanceOptimizer.recordAPICall(
            pathname,
            Date.now() - startTime,
            true,
            { userId, cacheHit: true }
          );
        }

        return cachedResponse;
      }

      // Cache miss - execute request (with deduplication if enabled)
      const response = this.config.enableRequestDeduplication ?
        await this.deduplicator.deduplicate(cacheKey, handler) :
        await handler();

      // Cache successful responses
      if (this.shouldCacheResponse(response)) {
        await this.cacheResponse(
          cacheKey,
          response,
          strategy,
          userId,
          region
        );
      }

      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        await this.performanceOptimizer.recordAPICall(
          pathname,
          Date.now() - startTime,
          response.ok,
          { 
            userId, 
            cacheHit: false, 
            statusCode: response.status,
            dataSize: this.estimateResponseSize(response)
          }
        );
      }

      return response;

    } catch (error) {
      // Record error performance
      if (this.config.enablePerformanceMonitoring) {
        await this.performanceOptimizer.recordAPICall(
          pathname,
          Date.now() - startTime,
          false,
          { userId }
        );
      }

      throw error;
    }
  }

  // ==================== CACHE OPERATIONS ====================

  private async getCachedResponse(
    cacheKey: string,
    strategy: EndpointCacheStrategy,
    userId?: string,
    region?: string
  ): Promise<NextResponse | null> {
    const cached = await this.cacheManager.get<{
      status: number;
      headers: Record<string, string>;
      body: any;
    }>(cacheKey, strategy.keyType, { 
      allowStale: strategy.enableSWR,
      userId,
      region
    });

    if (!cached.data) {
      return null;
    }

    // Create response from cached data
    const headers = new Headers(cached.data.headers);
    
    // Add cache status headers
    headers.set('X-Cache', cached.isStale ? 'STALE' : 'HIT');
    headers.set('X-Cache-Key', cacheKey);
    if (cached.metadata) {
      headers.set('X-Cache-Created', new Date(cached.metadata.createdAt).toISOString());
      headers.set('X-Cache-Expires', new Date(cached.metadata.expiresAt).toISOString());
    }

    return new NextResponse(JSON.stringify(cached.data.body), {
      status: cached.data.status,
      headers
    });
  }

  private async cacheResponse(
    cacheKey: string,
    response: NextResponse,
    strategy: EndpointCacheStrategy,
    userId?: string,
    region?: string
  ): Promise<void> {
    try {
      // Clone response to read body without consuming it
      const responseClone = response.clone();
      const body = await responseClone.json();

      // Extract headers to cache
      const headers: Record<string, string> = {};
      responseClone.headers.forEach((value, key) => {
        // Skip headers that shouldn't be cached
        if (!this.shouldCacheHeader(key)) {
          return;
        }
        headers[key] = value;
      });

      const cacheData = {
        status: response.status,
        headers,
        body
      };

      await this.cacheManager.set(
        cacheKey,
        cacheData,
        strategy.keyType,
        {
          customTTL: strategy.ttl,
          userId: strategy.personalized ? userId : undefined,
          region: strategy.regionalized ? region : undefined
        }
      );

    } catch (error) {
      console.error('Failed to cache response:', error);
      // Don't throw - caching failure shouldn't break the request
    }
  }

  // ==================== CACHE KEY GENERATION ====================

  private generateCacheKey(
    request: NextRequest,
    strategy: EndpointCacheStrategy
  ): string {
    if (this.config.customKeyGenerator) {
      return this.config.customKeyGenerator(request);
    }

    const url = new URL(request.url);
    const parts = [url.pathname];

    // Include specified query parameters
    if (strategy.varyBy.includes('*')) {
      // Include all query parameters
      const sortedParams = Array.from(url.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b));
      
      if (sortedParams.length > 0) {
        parts.push(sortedParams.map(([k, v]) => `${k}=${v}`).join('&'));
      }
    } else {
      // Include only specified parameters
      const paramParts = [];
      for (const param of strategy.varyBy) {
        const value = url.searchParams.get(param);
        if (value !== null) {
          paramParts.push(`${param}=${value}`);
        }
      }
      if (paramParts.length > 0) {
        parts.push(paramParts.join('&'));
      }
    }

    // Include headers that affect the response
    const varyHeaders = ['accept-language', 'user-agent'];
    for (const header of varyHeaders) {
      const value = request.headers.get(header);
      if (value && strategy.regionalized) {
        // Hash header value to keep key length manageable
        const hash = crypto.createHash('md5').update(value).digest('hex').substring(0, 8);
        parts.push(`${header}:${hash}`);
      }
    }

    // Create final cache key
    const key = parts.join('|');
    
    // Hash the key if it's too long
    if (key.length > 250) {
      return crypto.createHash('sha256').update(key).digest('hex');
    }
    
    return key;
  }

  // ==================== STRATEGY SELECTION ====================

  private shouldCacheEndpoint(pathname: string): boolean {
    // Check exclude patterns first
    if (this.config.excludePatterns.some(pattern => pattern.test(pathname))) {
      return false;
    }

    // Check include patterns
    return this.config.includePatterns.some(pattern => pattern.test(pathname));
  }

  private getEndpointStrategy(pathname: string): EndpointCacheStrategy {
    // Try exact match first
    if (ENDPOINT_STRATEGIES[pathname]) {
      return ENDPOINT_STRATEGIES[pathname];
    }

    // Try pattern matching
    for (const [pattern, strategy] of Object.entries(ENDPOINT_STRATEGIES)) {
      if (pathname.startsWith(pattern.replace(/\*$/, ''))) {
        return strategy;
      }
    }

    // Default strategy
    return {
      keyType: 'flight_search', // Conservative default
      ttl: this.config.defaultTTL,
      enableSWR: this.config.enableStaleWhileRevalidate,
      varyBy: ['*'],
      compressionEnabled: false,
      regionalized: false,
      personalized: false
    };
  }

  private shouldCacheResponse(response: NextResponse): boolean {
    return this.config.cacheableStatusCodes.includes(response.status);
  }

  private shouldCacheHeader(headerName: string): boolean {
    const excludedHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-request-id',
      'date',
      'server',
      'x-powered-by'
    ];
    
    return !excludedHeaders.includes(headerName.toLowerCase());
  }

  // ==================== UTILITY METHODS ====================

  private extractUserId(request: NextRequest): string | undefined {
    // Try to extract user ID from various sources
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // In production, decode JWT or session token
      return 'user_from_auth'; // Placeholder
    }

    // Try cookies or other user identification methods
    return undefined;
  }

  private extractRegion(request: NextRequest): string | undefined {
    // Try to determine region from headers
    return request.headers.get('cf-ipcountry') || 
           request.headers.get('cloudfront-viewer-country') ||
           request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           undefined;
  }

  private estimateResponseSize(response: NextResponse): number {
    // Rough estimation based on headers
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Fallback estimation
    return 1024; // 1KB default
  }

  // ==================== CACHE INVALIDATION ====================

  async invalidateByPattern(pattern: string): Promise<number> {
    // This would be implemented in production to invalidate cache entries
    // matching a specific pattern (e.g., all flight searches for a route)
    console.log(`Invalidating cache entries matching pattern: ${pattern}`);
    return 0; // Return number of invalidated entries
  }

  async invalidateByEvent(event: string, data?: any): Promise<void> {
    // Invalidate caches based on external events
    const strategiesToInvalidate = Object.entries(ENDPOINT_STRATEGIES)
      .filter(([_, strategy]) => strategy.invalidateOn?.includes(event))
      .map(([endpoint, _]) => endpoint);

    console.log(`Invalidating ${strategiesToInvalidate.length} endpoint strategies for event: ${event}`);
    
    // In production, this would selectively invalidate relevant cache entries
    for (const endpoint of strategiesToInvalidate) {
      await this.invalidateByPattern(endpoint);
    }
  }

  // ==================== MONITORING ====================

  async getMiddlewareStats(): Promise<{
    cacheHitRate: number;
    averageResponseTime: number;
    pendingRequests: number;
    totalRequests: number;
  }> {
    // In production, these stats would be collected from Redis and performance monitor
    return {
      cacheHitRate: 0, // Placeholder
      averageResponseTime: 0, // Placeholder
      pendingRequests: this.deduplicator.getPendingCount(),
      totalRequests: 0 // Placeholder
    };
  }
}

// ==================== FACTORY FUNCTION ====================

let globalCacheMiddleware: CacheMiddleware | null = null;

export function createCacheMiddleware(config?: Partial<CacheMiddlewareConfig>): CacheMiddleware {
  if (!globalCacheMiddleware) {
    globalCacheMiddleware = new CacheMiddleware(config);
  }
  return globalCacheMiddleware;
}

// ==================== NEXT.JS INTEGRATION HELPER ====================

export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<CacheMiddlewareConfig>
) {
  const middleware = createCacheMiddleware(config);
  
  return async (request: NextRequest): Promise<NextResponse> => {
    return middleware.handleRequest(request, () => handler(request));
  };
}

// Types are already exported above as needed