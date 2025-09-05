// Tripthesia Service Worker for Enhanced Caching - Phase 7 Production Excellence
const CACHE_NAME = 'tripthesia-v1.2.0';
const STATIC_CACHE = 'tripthesia-static-v1.2.0';
const DYNAMIC_CACHE = 'tripthesia-dynamic-v1.2.0';
const API_CACHE = 'tripthesia-api-v1.2.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/new',
  '/transport',
  '/trips',
  '/offline',
  '/manifest.json'
];

// API endpoints to cache with enhanced draft trip support
const CACHEABLE_APIS = [
  '/api/currency/rates',
  '/api/currency/convert',
  '/api/health',
  '/api/flights/search',
  '/api/transport/search',
  '/api/trips/draft',
  '/api/ai/suggestions',
  '/api/ai/route-planning'
];

// Enhanced API caching with different TTL strategies - Phase 7 optimization
const API_CACHE_CONFIG = {
  '/api/currency/rates': { ttl: 4 * 60 * 60 * 1000, priority: 'high' }, // 4 hours
  '/api/currency/convert': { ttl: 4 * 60 * 60 * 1000, priority: 'high' }, // 4 hours
  '/api/flights/search': { ttl: 2 * 60 * 60 * 1000, priority: 'medium' }, // 2 hours
  '/api/transport/search': { ttl: 2 * 60 * 60 * 1000, priority: 'medium' }, // 2 hours
  '/api/trips/draft': { ttl: 24 * 60 * 60 * 1000, priority: 'critical' }, // 24 hours - critical for resumption
  '/api/ai/suggestions': { ttl: 6 * 60 * 60 * 1000, priority: 'medium' }, // 6 hours
  '/api/ai/route-planning': { ttl: 6 * 60 * 60 * 1000, priority: 'medium' }, // 6 hours
  '/api/health': { ttl: 5 * 60 * 1000, priority: 'low' }, // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE
          )
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Enhanced API request handler with comprehensive caching and error handling
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const cacheConfig = getCacheConfig(url.pathname);
  
  if (!cacheConfig) {
    return handleNonCacheableAPI(request);
  }
  
  try {
    // Strategy: Network first with intelligent cache fallback
    const networkResponse = await fetchWithTimeout(request, 8000); // 8 second timeout
    
    if (networkResponse.ok) {
      await cacheResponseWithMetadata(request, networkResponse, cacheConfig);
      return networkResponse;
    } else {
      // Network returned error, try cache as fallback
      return await handleAPIFallback(request, networkResponse);
    }
    
  } catch (error) {
    console.log('[SW] Network failed for API:', request.url, error.message);
    return await handleAPIFallback(request, null, error);
  }
}

// Get cache configuration for an API endpoint
function getCacheConfig(pathname) {
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return null;
}

// Handle non-cacheable API requests
async function handleNonCacheableAPI(request) {
  try {
    return await fetchWithTimeout(request, 10000);
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'API request failed', 
        message: error.message,
        offline: true,
        timestamp: Date.now()
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Fetch with timeout
async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Cache response with metadata and TTL
async function cacheResponseWithMetadata(request, response, cacheConfig) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Clone the response and add metadata
    const responseToCache = response.clone();
    const metadata = {
      cached_at: Date.now(),
      expires_at: Date.now() + cacheConfig.ttl,
      priority: cacheConfig.priority,
      url: request.url,
    };
    
    // Store metadata separately
    await cache.put(
      new Request(request.url + '__metadata'),
      new Response(JSON.stringify(metadata))
    );
    
    // Store the actual response
    await cache.put(request, responseToCache);
    
    console.log(`[SW] Cached API response: ${request.url} (TTL: ${cacheConfig.ttl}ms)`);
  } catch (error) {
    console.error('[SW] Failed to cache API response:', error);
  }
}

// Handle API fallback scenarios
async function handleAPIFallback(request, networkResponse = null, networkError = null) {
  // Try to get cached response
  const cachedResponse = await getCachedResponseWithValidation(request);
  
  if (cachedResponse) {
    // Add cache headers to indicate stale data
    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Served-By', 'ServiceWorker');
    headers.set('X-Cache-Status', 'HIT-STALE');
    
    const responseBody = await cachedResponse.text();
    
    return new Response(responseBody, {
      status: cachedResponse.status,
      headers: headers
    });
  }
  
  // No cache available - return appropriate error response
  const errorResponse = {
    error: networkResponse ? `API returned ${networkResponse.status}` : 'Network unavailable',
    offline: true,
    cached: false,
    timestamp: Date.now(),
    details: networkError ? networkError.message : null
  };
  
  // For critical APIs, provide enhanced fallback data
  if (request.url.includes('/api/flights/search') || request.url.includes('/api/transport/search')) {
    errorResponse.fallback_available = true;
    errorResponse.message = 'Search temporarily unavailable. Please try again or use cached results.';
  }
  
  return new Response(
    JSON.stringify(errorResponse),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Get cached response with TTL validation
async function getCachedResponseWithValidation(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Check metadata first
    const metadataResponse = await cache.match(new Request(request.url + '__metadata'));
    
    if (metadataResponse) {
      const metadata = await metadataResponse.json();
      
      // Check if cache has expired
      if (Date.now() > metadata.expires_at) {
        console.log('[SW] Cached response expired:', request.url);
        // Clean up expired cache
        await cache.delete(request);
        await cache.delete(new Request(request.url + '__metadata'));
        return null;
      }
    }
    
    // Return cached response if valid
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving valid cached API response:', request.url);
      return cachedResponse;
    }
    
  } catch (error) {
    console.error('[SW] Error validating cached response:', error);
  }
  
  return null;
}

// Static asset handler - cache first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset failed to load:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Page request handler - network first with cache fallback
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache, return offline page
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Page not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'currency-preferences') {
    event.waitUntil(syncCurrencyPreferences());
  }
});

// Sync currency preferences when back online
async function syncCurrencyPreferences() {
  try {
    // Get stored preferences from IndexedDB or localStorage
    const preferences = await getStoredPreferences();
    
    if (preferences && preferences.needsSync) {
      // Sync with server
      await fetch('/api/user/currency-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      // Mark as synced
      await markPreferencesAsSynced();
    }
  } catch (error) {
    console.error('[SW] Failed to sync currency preferences:', error);
  }
}

// Helper functions for preference management
async function getStoredPreferences() {
  // Implementation would depend on your storage strategy
  return null;
}

async function markPreferencesAsSynced() {
  // Implementation would depend on your storage strategy
}