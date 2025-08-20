import * as Sentry from '@sentry/nextjs';

// Server-side Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring - lower sample rate in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Profiling sample rate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  beforeSend(event, hint) {
    // Filter out expected errors
    const errorMessage = event.exception?.values?.[0]?.value || '';
    
    // Skip database connection timeouts (expected in serverless)
    if (errorMessage.includes('Connection terminated') ||
        errorMessage.includes('Connection timeout') ||
        errorMessage.includes('ECONNRESET')) {
      return null;
    }
    
    // Skip Redis connection errors (non-critical)
    if (errorMessage.includes('Redis') && errorMessage.includes('connection')) {
      return null;
    }
    
    // Remove sensitive environment variables
    if (event.contexts?.runtime?.name) {
      delete event.contexts.runtime;
    }
    
    // Remove request body for security
    if (event.request?.data) {
      delete event.request.data;
    }
    
    return event;
  },
  
  beforeSendTransaction(event) {
    // Skip health checks and CRON jobs
    if (event.transaction?.includes('/api/health') ||
        event.transaction?.includes('/api/cron/') ||
        event.transaction?.includes('/_next/')) {
      return null;
    }
    
    // Skip very fast transactions (noise)
    if (event.start_timestamp && event.timestamp) {
      const duration = (event.timestamp - event.start_timestamp) * 1000;
      if (duration < 10) {
        return null;
      }
    }
    
    return event;
  },
  
  ignoreErrors: [
    // Database errors that are handled
    'Connection terminated',
    'Connection timeout',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEOUT',
    // Redis errors (non-critical)
    'Redis connection failed',
    'REDIS_CONNECTION_ERROR',
    // Expected API errors
    'Rate limit exceeded',
    'Unauthorized',
    'Forbidden',
    // External API errors (not our fault)
    'External API error',
    'ECONNREFUSED',
  ],
  
  // Custom integrations for server environment
  integrations: [
    // Add custom context for server errors
    new Sentry.Integrations.Context({
      os: true,
      runtime: false, // Skip runtime info for security
    }),
  ],
  
  // Custom error filtering
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      const url = breadcrumb.data.url as string;
      if (url.includes('/api/health') || 
          url.includes('/api/cron/') ||
          url.includes('/_next/')) {
        return null;
      }
    }
    
    return breadcrumb;
  },
});