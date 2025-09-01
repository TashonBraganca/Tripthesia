// Tripthesia Service Worker for Enhanced Caching
const CACHE_NAME = 'tripthesia-v1';
const STATIC_CACHE = 'tripthesia-static-v1';
const DYNAMIC_CACHE = 'tripthesia-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/new',
  '/transport',
  '/trips',
  '/offline',
  '/manifest.json'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/currency/rates',
  '/api/currency/convert',
  '/api/health'
];

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

// API request handler - network first with cache fallback
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
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