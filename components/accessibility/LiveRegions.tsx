// Live Regions Component - Phase 8 Accessibility Excellence
// Enhanced screen reader support with contextual announcements

'use client';

import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useLiveRegion } from '@/lib/accessibility/hooks';

interface LiveAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

// Global live region manager for application-wide announcements
class LiveRegionManager {
  private static instance: LiveRegionManager;
  private announcements: Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }> = [];
  private listeners: Set<(announcements: typeof this.announcements) => void> = new Set();

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager();
    }
    return LiveRegionManager.instance;
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      priority,
      timestamp: Date.now()
    };

    this.announcements.push(announcement);
    this.notifyListeners();

    // Clean up old announcements after 5 seconds
    setTimeout(() => {
      this.announcements = this.announcements.filter(a => a.id !== announcement.id);
      this.notifyListeners();
    }, 5000);
  }

  subscribe(listener: (announcements: typeof this.announcements) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.announcements]));
  }
}

// Global live region component that manages all announcements
export function GlobalLiveRegions() {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const manager = LiveRegionManager.getInstance();
    const unsubscribe = manager.subscribe(setAnnouncements);
    return unsubscribe;
  }, []);

  return (
    <>
      {/* Polite announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(announcement => (
            <div key={announcement.id}>
              {announcement.message}
            </div>
          ))
        }
      </div>

      {/* Assertive announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(announcement => (
            <div key={announcement.id}>
              {announcement.message}
            </div>
          ))
        }
      </div>
    </>
  );
}

// Hook to use the global live region manager
export function useGlobalLiveRegion() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    LiveRegionManager.getInstance().announce(message, priority);
  }, []);

  const announcePolite = useCallback((message: string) => announce(message, 'polite'), [announce]);
  const announceAssertive = useCallback((message: string) => announce(message, 'assertive'), [announce]);

  return { announce, announcePolite, announceAssertive };
}

// Route change announcements for SPA navigation
export function RouteAnnouncer() {
  const { announcePolite } = useGlobalLiveRegion();
  const previousPath = useRef<string>('');

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      
      if (previousPath.current && previousPath.current !== currentPath) {
        // Get page title or create descriptive announcement
        const pageTitle = document.title.replace(' | Tripthesia', '');
        const announcement = `Navigated to ${pageTitle}`;
        
        announcePolite(announcement);
      }
      
      previousPath.current = currentPath;
    };

    // Listen for navigation changes
    const observer = new MutationObserver(() => {
      if (document.title !== previousPath.current) {
        handleRouteChange();
      }
    });

    observer.observe(document.querySelector('title') || document.head, {
      childList: true,
      subtree: true
    });

    // Handle initial load
    handleRouteChange();

    return () => observer.disconnect();
  }, [announcePolite]);

  return null;
}

// Form status announcements
interface FormStatusAnnouncerProps {
  isSubmitting: boolean;
  submitSuccess?: boolean;
  submitError?: string;
  validationErrors?: string[];
}

export function FormStatusAnnouncer({
  isSubmitting,
  submitSuccess,
  submitError,
  validationErrors = []
}: FormStatusAnnouncerProps) {
  const { announcePolite, announceAssertive } = useGlobalLiveRegion();
  const previousSubmitting = useRef(isSubmitting);
  const previousSuccess = useRef(submitSuccess);
  const previousError = useRef(submitError);
  const previousValidationErrors = useRef(validationErrors);

  useEffect(() => {
    // Announce when form starts submitting
    if (isSubmitting && !previousSubmitting.current) {
      announcePolite('Form is being submitted');
    }

    // Announce successful submission
    if (submitSuccess && !previousSuccess.current) {
      announcePolite('Form submitted successfully');
    }

    // Announce submission errors
    if (submitError && submitError !== previousError.current) {
      announceAssertive(`Form submission failed: ${submitError}`);
    }

    // Announce validation errors
    if (validationErrors.length > 0 && validationErrors !== previousValidationErrors.current) {
      const errorCount = validationErrors.length;
      const message = errorCount === 1 
        ? `1 validation error: ${validationErrors[0]}`
        : `${errorCount} validation errors found`;
      announceAssertive(message);
    } else if (validationErrors.length === 0 && previousValidationErrors.current.length > 0) {
      announcePolite('All validation errors resolved');
    }

    // Update refs
    previousSubmitting.current = isSubmitting;
    previousSuccess.current = submitSuccess;
    previousError.current = submitError;
    previousValidationErrors.current = validationErrors;
  }, [isSubmitting, submitSuccess, submitError, validationErrors, announcePolite, announceAssertive]);

  return null;
}

// Loading state announcements
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
  errorMessage?: string;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading',
  completedMessage = 'Content loaded',
  errorMessage
}: LoadingAnnouncerProps) {
  const { announcePolite, announceAssertive } = useGlobalLiveRegion();
  const previousLoading = useRef(isLoading);
  const previousError = useRef(errorMessage);

  useEffect(() => {
    // Announce when loading starts
    if (isLoading && !previousLoading.current) {
      announcePolite(loadingMessage);
    }

    // Announce when loading completes
    if (!isLoading && previousLoading.current && !errorMessage) {
      announcePolite(completedMessage);
    }

    // Announce errors
    if (errorMessage && errorMessage !== previousError.current) {
      announceAssertive(`Error: ${errorMessage}`);
    }

    previousLoading.current = isLoading;
    previousError.current = errorMessage;
  }, [isLoading, loadingMessage, completedMessage, errorMessage, announcePolite, announceAssertive]);

  return null;
}

// Dynamic content announcements (for search results, filters, etc.)
interface ContentUpdateAnnouncerProps {
  count?: number;
  itemType?: string;
  action?: 'filtered' | 'searched' | 'loaded' | 'updated';
  customMessage?: string;
}

export function ContentUpdateAnnouncer({
  count,
  itemType = 'items',
  action = 'loaded',
  customMessage
}: ContentUpdateAnnouncerProps) {
  const { announcePolite } = useGlobalLiveRegion();
  const previousCount = useRef(count);

  useEffect(() => {
    if (count !== previousCount.current) {
      if (customMessage) {
        announcePolite(customMessage);
      } else if (typeof count === 'number') {
        const message = count === 0 
          ? `No ${itemType} found`
          : count === 1
          ? `1 ${itemType.slice(0, -1)} ${action}`
          : `${count} ${itemType} ${action}`;
        announcePolite(message);
      }
      previousCount.current = count;
    }
  }, [count, itemType, action, customMessage, announcePolite]);

  return null;
}

// Contextual help announcements
interface HelpAnnouncerProps {
  children: ReactNode;
  helpText: string;
  triggerOn?: 'focus' | 'hover' | 'click';
}

export function HelpAnnouncer({ 
  children, 
  helpText, 
  triggerOn = 'focus' 
}: HelpAnnouncerProps) {
  const { announcePolite } = useGlobalLiveRegion();
  const elementRef = useRef<HTMLDivElement>(null);

  const announceHelp = useCallback(() => {
    announcePolite(helpText);
  }, [helpText, announcePolite]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleEvent = () => announceHelp();

    switch (triggerOn) {
      case 'focus':
        element.addEventListener('focus', handleEvent, true);
        break;
      case 'hover':
        element.addEventListener('mouseenter', handleEvent);
        break;
      case 'click':
        element.addEventListener('click', handleEvent);
        break;
    }

    return () => {
      switch (triggerOn) {
        case 'focus':
          element.removeEventListener('focus', handleEvent, true);
          break;
        case 'hover':
          element.removeEventListener('mouseenter', handleEvent);
          break;
        case 'click':
          element.removeEventListener('click', handleEvent);
          break;
      }
    };
  }, [triggerOn, announceHelp]);

  return (
    <div ref={elementRef}>
      {children}
    </div>
  );
}