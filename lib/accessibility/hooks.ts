// Accessibility Hooks - Phase 8 Accessibility Excellence
// Comprehensive accessibility utilities and hooks for WCAG 2.1 AA+ compliance

import { useEffect, useRef, useCallback, RefObject } from 'react';

// Generate unique IDs for form controls and labels
export function useAccessibleId(prefix = 'accessible'): string {
  const id = useRef<string>();
  
  if (!id.current) {
    id.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return id.current;
}

// Manage focus trapping for modals and overlays
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current || !isActive) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }

    if (e.key === 'Escape') {
      restoreFocus();
    }
  }, [isActive]);

  const restoreFocus = useCallback(() => {
    if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      previousFocus.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element
      const firstFocusable = containerRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();

      document.addEventListener('keydown', trapFocus);
    } else {
      document.removeEventListener('keydown', trapFocus);
    }

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isActive, trapFocus]);

  return { containerRef, restoreFocus };
}

// Live region announcements for screen readers
export function useLiveRegion() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  const announcePolite = useCallback((message: string) => announce(message, 'polite'), [announce]);
  const announceAssertive = useCallback((message: string) => announce(message, 'assertive'), [announce]);

  return { announce, announcePolite, announceAssertive };
}

// Skip link functionality
export function useSkipLink(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetId]);

  return { skipToContent };
}

// Keyboard event helpers
export function useKeyboardHandler() {
  const handleKeyDown = useCallback((
    event: React.KeyboardEvent, 
    handlers: {
      onEnter?: () => void;
      onSpace?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
      onTab?: () => void;
    }
  ) => {
    switch (event.key) {
      case 'Enter':
        handlers.onEnter?.();
        break;
      case ' ':
        event.preventDefault(); // Prevent page scroll
        handlers.onSpace?.();
        break;
      case 'Escape':
        handlers.onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        handlers.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        handlers.onArrowDown?.();
        break;
      case 'ArrowLeft':
        handlers.onArrowLeft?.();
        break;
      case 'ArrowRight':
        handlers.onArrowRight?.();
        break;
      case 'Tab':
        handlers.onTab?.();
        break;
    }
  }, []);

  return { handleKeyDown };
}

// Form validation announcements
export function useFormAnnouncements() {
  const { announce } = useLiveRegion();

  const announceValidation = useCallback((errors: string[], fieldName?: string) => {
    if (errors.length === 0) {
      announce(`${fieldName ? fieldName + ' ' : ''}validation passed`, 'polite');
    } else if (errors.length === 1) {
      announce(`${fieldName ? fieldName + ': ' : ''}${errors[0]}`, 'assertive');
    } else {
      announce(`${fieldName ? fieldName + ' has ' : ''}${errors.length} validation errors`, 'assertive');
    }
  }, [announce]);

  const announceFormSubmission = useCallback((status: 'submitting' | 'success' | 'error', message?: string) => {
    switch (status) {
      case 'submitting':
        announce('Form is being submitted', 'polite');
        break;
      case 'success':
        announce(message || 'Form submitted successfully', 'polite');
        break;
      case 'error':
        announce(message || 'Form submission failed', 'assertive');
        break;
    }
  }, [announce]);

  return { announceValidation, announceFormSubmission };
}

// Reduced motion preference detection
export function useReducedMotion(): boolean {
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return prefersReducedMotion();
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate relative luminance
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (brighter + 0.05) / (darker + 0.05);
}

// ARIA state management
export function useAriaState() {
  const getAriaExpanded = useCallback((isExpanded: boolean) => 
    isExpanded ? 'true' : 'false', []);

  const getAriaSelected = useCallback((isSelected: boolean) => 
    isSelected ? 'true' : 'false', []);

  const getAriaPressed = useCallback((isPressed: boolean) => 
    isPressed ? 'true' : 'false', []);

  const getAriaChecked = useCallback((isChecked: boolean | 'mixed') => {
    if (typeof isChecked === 'boolean') {
      return isChecked ? 'true' : 'false';
    }
    return 'mixed';
  }, []);

  const getAriaInvalid = useCallback((hasError: boolean) => 
    hasError ? 'true' : 'false', []);

  return {
    getAriaExpanded,
    getAriaSelected, 
    getAriaPressed,
    getAriaChecked,
    getAriaInvalid
  };
}