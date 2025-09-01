// Service Worker Registration and Management
'use client';

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config;
    this.setupNetworkListeners();
  }

  // Register the service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;

      registration.addEventListener('updatefound', () => {
        console.log('[SW] Update found');
        this.handleUpdateFound(registration);
      });

      // Check if there's an update available immediately
      if (registration.waiting) {
        this.config.onUpdate?.(registration);
      }

      this.config.onSuccess?.(registration);
      console.log('[SW] Registered successfully');
      
      return registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      return null;
    }
  }

  // Handle service worker updates
  private handleUpdateFound(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New content is available
        this.config.onUpdate?.(registration);
      }
    });
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page after new service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('[SW] Unregistered successfully');
      return result;
    } catch (error) {
      console.error('[SW] Unregistration failed:', error);
      return false;
    }
  }

  // Setup network status listeners
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[SW] Back online');
      this.config.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[SW] Gone offline');
      this.config.onOffline?.();
    });
  }

  // Request background sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.log('[SW] Background sync not supported');
      return;
    }

    try {
      // Type assertion for background sync API
      const registration = this.registration as any;
      await registration.sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
    }
  }

  // Get cache usage information
  async getCacheUsage(): Promise<{ used: number; available: number }> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return { used: 0, available: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      };
    } catch (error) {
      console.error('[SW] Failed to get storage estimate:', error);
      return { used: 0, available: 0 };
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[SW] All caches cleared');
    } catch (error) {
      console.error('[SW] Failed to clear caches:', error);
    }
  }
}

// Default service worker manager instance
export const swManager = new ServiceWorkerManager({
  onUpdate: (registration) => {
    // Show update notification to user
    const updateAvailable = new CustomEvent('sw-update-available', {
      detail: { registration }
    });
    window.dispatchEvent(updateAvailable);
  },
  onSuccess: () => {
    console.log('[SW] App is ready for offline use');
  },
  onOffline: () => {
    // Show offline indicator
    const offlineEvent = new CustomEvent('app-offline');
    window.dispatchEvent(offlineEvent);
  },
  onOnline: () => {
    // Hide offline indicator
    const onlineEvent = new CustomEvent('app-online');
    window.dispatchEvent(onlineEvent);
  }
});

// Register service worker on app load
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return swManager.register();
}

// Utility to check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Utility to check network status
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}