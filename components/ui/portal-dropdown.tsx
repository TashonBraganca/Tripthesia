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

  // Calculate optimal position for dropdown
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !mounted) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
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

    // Collision detection and adjustment
    if (collision === 'flip') {
      // Flip vertically if not enough space
      if (actualPlacement.includes('bottom') && top + maxHeight > viewport.height + viewport.scrollY) {
        if (triggerRect.top - maxHeight - offset > viewport.scrollY) {
          top = triggerRect.top - offset + viewport.scrollY - maxHeight;
          actualPlacement = actualPlacement.replace('bottom', 'top') as typeof placement;
        }
      } else if (actualPlacement.includes('top') && top < viewport.scrollY) {
        if (triggerRect.bottom + maxHeight + offset < viewport.height + viewport.scrollY) {
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
  }, [placement, offset, collision, sameWidth, maxHeight, mounted]);

  // Recalculate position when dropdown opens or window resizes
  useEffect(() => {
    if (isOpen && mounted) {
      calculatePosition();
      
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, calculatePosition, mounted]);

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