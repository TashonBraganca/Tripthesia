/**
 * Portal Dropdown Component
 * Phase 1.1: Dropdown Z-Index Portal Implementation
 * 
 * Solves dropdown z-index issues by rendering content in a React Portal
 * with maximum z-index and proper positioning calculations.
 */

'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback,
  ReactNode,
  CSSProperties 
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  offset?: number;
  collision?: 'flip' | 'shift' | 'none';
  sameWidth?: boolean;
  maxHeight?: number;
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
  width?: number;
  maxHeight?: number;
  transform?: string;
}

export const PortalDropdown: React.FC<PortalDropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  className = '',
  contentClassName = '',
  placement = 'bottom-start',
  offset = 8,
  collision = 'flip',
  sameWidth = true,
  maxHeight = 400,
  disabled = false,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  // Generate unique ID for dropdown content
  const dropdownId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate optimal position for dropdown with error handling
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !mounted) return;

    try {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      
      // Ensure we have valid dimensions before proceeding
      if (triggerRect.width === 0 || triggerRect.height === 0) {
        console.warn('Trigger element has no dimensions, skipping position calculation');
        return;
      }

      const viewport = {
        width: window.innerWidth || document.documentElement.clientWidth || 1024,
        height: window.innerHeight || document.documentElement.clientHeight || 768,
        scrollX: window.scrollX || document.documentElement.scrollLeft || 0,
        scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      };

    let top: number;
    let left: number;
    let actualPlacement = placement;
    
    // Base positioning
    switch (placement) {
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        top = triggerRect.bottom + offset + viewport.scrollY;
        break;
      case 'top':
      case 'top-start': 
      case 'top-end':
        top = triggerRect.top - offset + viewport.scrollY - maxHeight;
        break;
      default:
        top = triggerRect.bottom + offset + viewport.scrollY;
    }

    switch (placement) {
      case 'bottom':
      case 'top':
        left = triggerRect.left + (triggerRect.width / 2) + viewport.scrollX;
        break;
      case 'bottom-start':
      case 'top-start':
        left = triggerRect.left + viewport.scrollX;
        break;
      case 'bottom-end':
      case 'top-end':
        left = triggerRect.right + viewport.scrollX;
        break;
      default:
        left = triggerRect.left + viewport.scrollX;
    }

    // Improved collision detection with buffer space
    if (collision === 'flip') {
      const bufferSpace = 80; // Extra buffer to prevent unnecessary flipping
      const dropdownHeight = maxHeight || 320; // Use actual maxHeight or default
      
      // Only flip if there's REALLY not enough space below (more conservative)
      if (actualPlacement.includes('bottom')) {
        const spaceBelow = viewport.height + viewport.scrollY - (triggerRect.bottom + offset);
        const spaceAbove = triggerRect.top + viewport.scrollY - offset;
        
        // Only flip if we have significantly more space above AND not enough below
        if (spaceBelow < dropdownHeight + bufferSpace && spaceAbove > dropdownHeight + bufferSpace && spaceAbove > spaceBelow + 100) {
          top = triggerRect.top - offset + viewport.scrollY - dropdownHeight;
          actualPlacement = actualPlacement.replace('bottom', 'top') as typeof placement;
        }
      } else if (actualPlacement.includes('top')) {
        const spaceAbove = triggerRect.top + viewport.scrollY - offset;
        const spaceBelow = viewport.height + viewport.scrollY - (triggerRect.bottom + offset);
        
        // Flip back to bottom if we have more space below
        if (spaceAbove < dropdownHeight + bufferSpace && spaceBelow > dropdownHeight + bufferSpace) {
          top = triggerRect.bottom + offset + viewport.scrollY;
          actualPlacement = actualPlacement.replace('top', 'bottom') as typeof placement;
        }
      }
    }

    // Horizontal collision for shift
    if (collision === 'shift' || collision === 'flip') {
      const dropdownWidth = sameWidth ? triggerRect.width : 300; // Assume 300px default width
      
      // Adjust horizontal position to stay within viewport
      if (left + dropdownWidth > viewport.width + viewport.scrollX) {
        left = viewport.width + viewport.scrollX - dropdownWidth - 16; // 16px margin
      }
      
      if (left < viewport.scrollX + 16) {
        left = viewport.scrollX + 16;
      }
    }

    // Set transform origin based on actual placement
    let transform = '';
    if (actualPlacement.includes('top')) {
      transform = 'translateY(-100%)';
    }
    if (actualPlacement.includes('end')) {
      transform += ' translateX(-100%)';
    }
    if (placement === 'bottom' || placement === 'top') {
      transform += ' translateX(-50%)';
    }

    const newPosition: Position = {
      top: Math.round(top),
      left: Math.round(left),
      transform: transform || undefined,
      maxHeight,
    };

    if (sameWidth) {
      newPosition.width = triggerRect.width;
    }

    setPosition(newPosition);
    } catch (error) {
      console.warn('Error calculating dropdown position:', error);
      // Fallback positioning - center the dropdown
      const fallbackPosition: Position = {
        top: 100,
        left: Math.max(16, (window.innerWidth - (sameWidth ? 300 : 300)) / 2),
        maxHeight,
        width: sameWidth ? 300 : undefined,
      };
      setPosition(fallbackPosition);
    }
  }, [placement, offset, collision, sameWidth, maxHeight, mounted]);

  // Improved throttled position update with better scroll handling
  const throttledPositionUpdate = useCallback(() => {
    let rafId: number;
    let lastCall = 0;
    
    return () => {
      const now = Date.now();
      if (now - lastCall >= 8) { // Increased frequency for better scroll responsiveness
        lastCall = now;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // Ensure trigger element is still visible before repositioning
          if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              calculatePosition();
            }
          }
        });
      }
    };
  }, [calculatePosition]);

  // Improved scroll and resize handling for better dropdown positioning
  useEffect(() => {
    if (isOpen && mounted) {
      calculatePosition();
      
      const throttledUpdate = throttledPositionUpdate();
      const handleResize = throttledUpdate;
      const handleScroll = throttledUpdate;
      
      // Add event listeners to window and document
      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      
      // Also listen to scroll events on scrollable parent containers
      let scrollableParent = triggerRef.current?.parentElement;
      const scrollableElements: Element[] = [];
      
      while (scrollableParent) {
        const computedStyle = window.getComputedStyle(scrollableParent);
        const overflow = computedStyle.overflow + computedStyle.overflowY + computedStyle.overflowX;
        
        if (overflow.includes('auto') || overflow.includes('scroll')) {
          scrollableElements.push(scrollableParent);
          scrollableParent.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        scrollableParent = scrollableParent.parentElement;
      }
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('scroll', handleScroll, true);
        
        // Clean up scrollable parent listeners
        scrollableElements.forEach(element => {
          element.removeEventListener('scroll', handleScroll);
        });
      };
    }
  }, [isOpen, throttledPositionUpdate, mounted]);

  // Close on escape key
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        
        if (
          triggerRef.current && 
          contentRef.current &&
          !triggerRef.current.contains(target) &&
          !contentRef.current.contains(target)
        ) {
          onClose();
        }
      };

      // Add slight delay to prevent immediate closure on trigger click
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!mounted) {
    return (
      <div ref={triggerRef} className={className}>
        {trigger}
      </div>
    );
  }

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={dropdownId}
          ref={contentRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            transform: position.transform,
            zIndex: 999999, // Maximum z-index to ensure visibility
          } as CSSProperties}
          className={`
            bg-navy-800/95 backdrop-blur-md border border-navy-600 
            rounded-xl shadow-2xl overflow-hidden
            ${contentClassName}
          `}
          role="listbox"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div 
        ref={triggerRef} 
        className={className}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={dropdownId}
        role="combobox"
      >
        {trigger}
      </div>
      {createPortal(dropdownContent, document.body)}
    </>
  );
};

// Hook for managing dropdown state
export const useDropdown = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
};

// Radix-style compound component pattern
export const DropdownRoot = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const DropdownTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

DropdownTrigger.displayName = 'DropdownTrigger';

export const DropdownContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sameWidth?: boolean;
    maxHeight?: number;
  }
>(({ children, className = '', sameWidth = true, maxHeight = 400, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={`
        bg-navy-800/95 backdrop-blur-md border border-navy-600 
        rounded-xl shadow-2xl overflow-hidden
        ${className}
      `}
      style={{
        maxHeight,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownContent.displayName = 'DropdownContent';

export default PortalDropdown;