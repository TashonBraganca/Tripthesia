// Focus Management Component - Phase 8 Accessibility Excellence
// Provides comprehensive focus management utilities for complex UI components

'use client';

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { useFocusTrap } from '@/lib/accessibility/hooks';

interface FocusManagerProps {
  children: ReactNode;
  isActive: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  className?: string;
}

export function FocusManager({ 
  children, 
  isActive, 
  autoFocus = true, 
  returnFocus = true,
  className = ''
}: FocusManagerProps) {
  const { containerRef, restoreFocus } = useFocusTrap(isActive);
  
  useEffect(() => {
    if (isActive && autoFocus && containerRef.current) {
      // Focus the first focusable element
      const firstFocusable = containerRef.current.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    return () => {
      if (!isActive && returnFocus) {
        restoreFocus();
      }
    };
  }, [isActive, autoFocus, returnFocus, containerRef, restoreFocus]);

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}

// Keyboard Navigation Hook for roving tabindex patterns (like menus, tabs)
export function useRovingTabindex(items: HTMLElement[], activeIndex: number) {
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!items.length) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (activeIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
        items[prevIndex]?.focus();
        break;
      
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  }, [items, activeIndex]);

  return { handleKeyNavigation };
}

// Skip to content component
interface SkipToContentProps {
  targetId: string;
  children: ReactNode;
}

export function SkipToContent({ targetId, children }: SkipToContentProps) {
  const handleSkip = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSkip(e);
        }
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-navy-900 text-white px-4 py-2 rounded-md z-50 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

// Accessible Button Component with comprehensive keyboard support
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  className = '',
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-teal-500 hover:bg-teal-400 text-white focus:ring-teal-500',
    secondary: 'bg-navy-700 hover:bg-navy-600 text-navy-100 focus:ring-navy-500',
    danger: 'bg-red-500 hover:bg-red-400 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-navy-700/30 text-navy-200 focus:ring-navy-400'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}