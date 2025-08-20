import * as Sentry from '@sentry/nextjs';

// Client-side Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay (useful for debugging)
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 0.1,  // 10% of sessions with errors
  
  beforeSend(event, hint) {
    // Filter out non-errors from promise rejections
    if (event.exception?.values?.[0]?.value?.includes('Non-Error')) {
      return null;
    }
    
    // Filter out network errors (handled gracefully)
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    
    // Remove sensitive data
    if (event.request?.data) {
      // Keep only safe fields
      const safeData: Record<string, any> = {};
      const allowedFields = ['page', 'action', 'feature', 'step'];
      
      for (const field of allowedFields) {
        if (event.request.data[field]) {
          safeData[field] = event.request.data[field];
        }
      }
      
      event.request.data = safeData;
    }
    
    return event;
  },
  
  beforeSendTransaction(event) {
    // Filter out health check and static asset transactions
    if (event.transaction?.includes('_next/') ||
        event.transaction?.includes('/api/health') ||
        event.transaction?.includes('/favicon.ico')) {
      return null;
    }
    return event;
  },
  
  // Ignore common errors that don't affect functionality
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'The operation was aborted',
    // Clerk errors (handled gracefully)
    'ClerkAPIResponseError',
    'SignInTokenExpired',
    // ResizeObserver errors (harmless)
    'ResizeObserver loop limit exceeded',
    // Common browser extension errors
    'Non-Error promise rejection captured with value',
  ],
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});