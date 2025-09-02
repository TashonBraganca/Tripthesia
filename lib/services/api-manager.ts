/**
 * Comprehensive API management with error handling, caching, and monitoring
 */

interface APIConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimitWindow?: number;
  rateLimitMax?: number;
}

interface CacheConfig {
  enabled?: boolean;
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  attempts: number;
  errors: any[];
  success: boolean;
}

// Rate limiting storage
const rateLimitStore = new Map<string, { requests: number[]; }>();

// Request tracking for monitoring
const requestMetrics = new Map<string, RequestMetrics>();

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIManager {
  private config: APIConfig;
  private cacheConfig: CacheConfig;

  constructor(config: APIConfig, cacheConfig: CacheConfig = {}) {
    this.config = {
      timeout: 10000, // 10 seconds default
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      rateLimitWindow: 60000, // 1 minute
      rateLimitMax: 100, // 100 requests per minute
      ...config,
    };
    
    this.cacheConfig = {
      enabled: true,
      ttl: 300, // 5 minutes default
      prefix: 'api_cache',
      ...cacheConfig,
    };
  }

  /**
   * Main API request method with comprehensive error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const requestId = this.generateRequestId(endpoint);
    const metrics = this.initializeMetrics(requestId);

    try {
      // Check rate limiting
      await this.checkRateLimit(endpoint);

      // Try cache first if enabled
      if (this.cacheConfig.enabled && cacheKey) {
        const cachedResult = await this.getFromCache<T>(cacheKey);
        if (cachedResult) {
          this.updateMetrics(requestId, { success: true, fromCache: true });
          return cachedResult;
        }
      }

      // Make request with retry logic
      const result = await this.requestWithRetry<T>(endpoint, options, requestId);

      // Cache successful result
      if (this.cacheConfig.enabled && cacheKey && result) {
        await this.setCache(cacheKey, result);
      }

      this.updateMetrics(requestId, { success: true });
      return result;

    } catch (error) {
      this.updateMetrics(requestId, { success: false, error });
      throw this.enhanceError(error, endpoint);
    }
  }

  /**
   * Request with exponential backoff retry logic
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    requestId: string
  ): Promise<T> {
    let lastError: any;
    const maxAttempts = this.config.retryAttempts || 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tripthesia/1.0',
            ...options.headers,
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new APIError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            this.config.baseUrl,
            this.isRetryableStatus(response.status)
          );
        }

        const result = await response.json();
        
        // Update metrics for successful request
        this.updateMetrics(requestId, { attempts: attempt });
        
        return result;

      } catch (error) {
        lastError = error;
        
        // Update metrics for failed attempt
        this.updateMetrics(requestId, { attempts: attempt, errors: [error] });

        // Don't retry if it's the last attempt or non-retryable error
        if (attempt === maxAttempts || !this.isRetryableError(error)) {
          break;
        }

        // Wait with exponential backoff
        const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(endpoint: string): Promise<void> {
    const key = `${this.config.baseUrl}:${endpoint}`;
    const now = Date.now();
    const window = this.config.rateLimitWindow!;
    const max = this.config.rateLimitMax!;

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { requests: [] });
    }

    const store = rateLimitStore.get(key)!;
    
    // Remove old requests outside the window
    store.requests = store.requests.filter(time => now - time < window);

    // Check if we've exceeded the limit
    if (store.requests.length >= max) {
      throw new APIError(
        `Rate limit exceeded for ${endpoint}. Max ${max} requests per ${window}ms`,
        429,
        this.config.baseUrl,
        true
      );
    }

    // Add current request
    store.requests.push(now);
  }

  /**
   * Cache operations (simplified - in production use Redis)
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // In production, this would use Redis or another cache
      // For now, use a simple in-memory cache with TTL
      const cacheKey = `${this.cacheConfig.prefix}:${key}`;
      const cached = (global as any).__apiCache?.[cacheKey];
      
      if (!cached || Date.now() > cached.expires) {
        return null;
      }
      
      console.log(`[APIManager] Cache hit for key: ${key}`);
      return cached.data;
    } catch (error) {
      console.error('[APIManager] Cache read error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      // Initialize global cache if it doesn't exist
      if (!(global as any).__apiCache) {
        (global as any).__apiCache = {};
      }
      
      const cacheKey = `${this.cacheConfig.prefix}:${key}`;
      (global as any).__apiCache[cacheKey] = {
        data,
        expires: Date.now() + (this.cacheConfig.ttl! * 1000),
      };
      
      console.log(`[APIManager] Cached data for key: ${key}`);
    } catch (error) {
      console.error('[APIManager] Cache write error:', error);
    }
  }

  /**
   * Error handling utilities
   */
  private enhanceError(error: any, endpoint: string): APIError {
    if (error instanceof APIError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new APIError(
        `Request timeout for ${endpoint}`,
        408,
        this.config.baseUrl,
        true,
        error
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new APIError(
        `Network error for ${endpoint}: ${error.message}`,
        0,
        this.config.baseUrl,
        true,
        error
      );
    }

    return new APIError(
      `API request failed for ${endpoint}: ${error.message}`,
      500,
      this.config.baseUrl,
      false,
      error
    );
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof APIError) {
      return error.retryable;
    }

    // Network errors are generally retryable
    return error.name === 'AbortError' || 
           error.code === 'ECONNREFUSED' || 
           error.code === 'ENOTFOUND';
  }

  private isRetryableStatus(status: number): boolean {
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Metrics and monitoring utilities
   */
  private generateRequestId(endpoint: string): string {
    return `${this.config.baseUrl}:${endpoint}:${Date.now()}:${Math.random()}`;
  }

  private initializeMetrics(requestId: string): RequestMetrics {
    const metrics: RequestMetrics = {
      startTime: Date.now(),
      attempts: 0,
      errors: [],
      success: false,
    };
    
    requestMetrics.set(requestId, metrics);
    return metrics;
  }

  private updateMetrics(requestId: string, updates: Partial<RequestMetrics & { fromCache?: boolean; error?: any }>): void {
    const metrics = requestMetrics.get(requestId);
    if (!metrics) return;

    if (updates.attempts) metrics.attempts = updates.attempts;
    if (updates.error) metrics.errors.push(updates.error);
    if (updates.success !== undefined) {
      metrics.success = updates.success;
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
    }

    // Log metrics for monitoring
    if (updates.success !== undefined) {
      const logLevel = updates.success ? 'info' : 'error';
      console.log(`[APIManager] Request ${updates.success ? 'successful' : 'failed'}:`, {
        requestId,
        duration: metrics.duration,
        attempts: metrics.attempts,
        errors: metrics.errors.length,
        fromCache: updates.fromCache,
      });
    }
  }

  /**
   * Public methods for monitoring and health checks
   */
  static getRequestMetrics(): Map<string, RequestMetrics> {
    return requestMetrics;
  }

  static getRateLimitStats(): Map<string, { requests: number[]; }> {
    return rateLimitStore;
  }

  static clearMetrics(): void {
    requestMetrics.clear();
    rateLimitStore.clear();
  }

  /**
   * Health check for the API endpoint
   */
  async healthCheck(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.request('/health', { method: 'GET' }, 'health_check');
      
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create configured API managers
 */
export function createAPIManager(
  provider: 'aviationstack' | 'rapidapi' | 'openrouteservice' | 'custom',
  apiKey?: string,
  customConfig?: Partial<APIConfig>
): APIManager {
  const configs: Record<string, APIConfig> = {
    aviationstack: {
      baseUrl: 'http://api.aviationstack.com/v1',
      timeout: 15000,
      retryAttempts: 2,
      rateLimitMax: 50, // Free tier limit
    },
    rapidapi: {
      baseUrl: 'https://skyscanner80.p.rapidapi.com/api/v1',
      timeout: 10000,
      retryAttempts: 3,
      rateLimitMax: 100,
    },
    openrouteservice: {
      baseUrl: 'https://api.openrouteservice.org',
      timeout: 8000,
      retryAttempts: 2,
      rateLimitMax: 200,
    },
    custom: {
      baseUrl: customConfig?.baseUrl || 'https://api.custom.com',
      timeout: customConfig?.timeout || 10000,
      retryAttempts: customConfig?.retryAttempts || 3,
      rateLimitMax: customConfig?.rateLimitMax || 100,
    },
  };

  const config = { ...configs[provider], ...customConfig };
  
  return new APIManager(config, {
    enabled: true,
    ttl: provider === 'aviationstack' ? 1800 : 300, // 30min for flight data, 5min for others
    prefix: `${provider}_cache`,
  });
}

export default APIManager;