"use client"

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { errorTracker } from '@/lib/monitoring/error-tracker';

export function ErrorTrackingInit() {
  const { user } = useUser();

  useEffect(() => {
    // Initialize error tracking with user context
    if (user) {
      // Update error tracker context with user information
      errorTracker.trackCustomEvent('user_session_started', {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        sessionStartTime: new Date().toISOString()
      });
    }

    // Track page view
    errorTracker.trackCustomEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Track performance metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            errorTracker.trackCustomEvent('performance_navigation', {
              domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
              loadComplete: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
              firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime || 0
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });

      // Cleanup
      return () => observer.disconnect();
    }
  }, [user]);

  return null; // This component doesn't render anything
}