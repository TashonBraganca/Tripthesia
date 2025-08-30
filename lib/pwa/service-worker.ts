// Service Worker for Tripthesia PWA
declare const self: any;

const CACHE_NAME = 'tripthesia-v1';
const STATIC_CACHE = 'tripthesia-static-v1';
const DYNAMIC_CACHE = 'tripthesia-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/trips\//, strategy: 'networkFirst', ttl: 300 }, // 5 minutes
  { pattern: /\/api\/transport\//, strategy: 'cacheFirst', ttl: 1800 }, // 30 minutes
  { pattern: /\/api\/places\//, strategy: 'staleWhileRevalidate', ttl: 3600 }, // 1 hour
  { pattern: /\/api\/ai\//, strategy: 'networkOnly' }, // Always fresh for AI
];

// Install event - cache static assets
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method !== 'GET') {
    return; // Only cache GET requests
  }
  
  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname.startsWith(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // API requests - use specific strategies
  if (url.pathname.startsWith('/api/')) {
    const strategy = getAPIStrategy(url.pathname);
    event.respondWith(handleAPIRequest(request, strategy));
    return;
  }
  
  // Page requests - network first with fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
  
  // Images and other assets - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'trip-sync') {
    event.waitUntil(syncTripData());
  }
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notifications
self.addEventListener('push', (event: any) => {
  const options = {
    body: event.data?.text() || 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'tripthesia-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Trip',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Tripthesia', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/trips')
    );
  }
});

// Caching strategies
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Start fetch for background update
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached immediately, or wait for network
  return cached || fetchPromise;
}

async function networkFirstWithFallback(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    
    // Cache successful page responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch {
    // Try cache first
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback to offline page
    const offlineCache = await caches.open(STATIC_CACHE);
    const offline = await offlineCache.match('/offline');
    
    return offline || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function getAPIStrategy(pathname: string) {
  for (const pattern of API_CACHE_PATTERNS) {
    if (pattern.pattern.test(pathname)) {
      return pattern;
    }
  }
  
  // Default strategy for API routes
  return { strategy: 'networkFirst', ttl: 300 };
}

async function handleAPIRequest(request: Request, strategy: any): Promise<Response> {
  const { strategy: strategyName, ttl } = strategy;
  const cacheName = DYNAMIC_CACHE;
  
  switch (strategyName) {
    case 'cacheFirst':
      return cacheFirst(request, cacheName);
    case 'networkFirst':
      return networkFirst(request, cacheName);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName);
    case 'networkOnly':
      return fetch(request);
    default:
      return networkFirst(request, cacheName);
  }
}

// Background sync functions
async function syncTripData() {
  try {
    // Get pending trip updates from IndexedDB
    const pendingUpdates = await getPendingTripUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/trips/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        // Remove from pending updates
        await removePendingUpdate(update.id);
      } catch (error) {
        console.error('Failed to sync trip update:', error);
      }
    }
  } catch (error) {
    console.error('Trip sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    // Get pending analytics events from IndexedDB
    const pendingEvents = await getPendingAnalytics();
    
    if (pendingEvents.length > 0) {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      });
      
      // Clear pending events
      await clearPendingAnalytics();
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would use proper IndexedDB library)
async function getPendingTripUpdates(): Promise<any[]> {
  // Implementation would use IndexedDB to get pending updates
  return [];
}

async function removePendingUpdate(id: string): Promise<void> {
  // Implementation would remove from IndexedDB
}

async function getPendingAnalytics(): Promise<any[]> {
  // Implementation would use IndexedDB to get pending analytics
  return [];
}

async function clearPendingAnalytics(): Promise<void> {
  // Implementation would clear IndexedDB analytics
}

export {};