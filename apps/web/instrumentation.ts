// This file is used to register instrumentation for Next.js
// It runs before the server starts and is useful for setting up monitoring

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize server-side monitoring
    const { trackEvent } = await import('./lib/monitoring');
    
    // Track server startup
    trackEvent('server_startup', {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
    });
    
    console.log('🔍 Monitoring instrumentation registered');
  }
}