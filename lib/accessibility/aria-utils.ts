/**
 * ARIA Utilities for Enhanced Accessibility
 * 
 * Comprehensive utilities for implementing WCAG 2.1 AA compliance
 * across the TripThesia application.
 */

import React from 'react';

// ==================== TYPES ====================

export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-pressed'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-readonly'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-multiselectable'?: boolean;
  'aria-modal'?: boolean;
  'aria-autocomplete'?: 'none' | 'list' | 'both' | 'inline';
  'aria-controls'?: string;
  id?: string;
  role?: string;
  tabIndex?: number;
}

export interface AccessibilityFeatures {
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  highContrastSupport: boolean;
  focusManagement: boolean;
  motionReduced: boolean;
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | (() => HTMLElement);
  fallbackFocus?: HTMLElement | (() => HTMLElement);
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

// ==================== ARIA UTILITIES ====================

export class AriaUtils {
  
  /**
   * Generate unique IDs for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
  }

  /**
   * Create ARIA props for form fields
   */
  static createFieldProps(
    label: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      disabled?: boolean;
      readonly?: boolean;
      describedBy?: string;
      helpText?: string;
    } = {}
  ): AriaProps {
    const fieldId = this.generateId('field');
    const props: AriaProps = {
      'aria-label': label,
      'aria-required': options.required,
      'aria-invalid': options.invalid,
      'aria-disabled': options.disabled,
      'aria-readonly': options.readonly
    };

    if (options.describedBy || options.helpText) {
      const descriptionId = options.describedBy || `${fieldId}-description`;
      props['aria-describedby'] = descriptionId;
    }

    return props;
  }

  /**
   * Create ARIA props for interactive buttons
   */
  static createButtonProps(
    label: string,
    options: {
      expanded?: boolean;
      pressed?: boolean;
      disabled?: boolean;
      controls?: string;
      describedBy?: string;
    } = {}
  ): AriaProps {
    return {
      'aria-label': label,
      'aria-expanded': options.expanded,
      'aria-pressed': options.pressed,
      'aria-disabled': options.disabled,
      'aria-controls': options.controls,
      'aria-describedby': options.describedBy,
      role: 'button',
      tabIndex: options.disabled ? -1 : 0
    };
  }

  /**
   * Create ARIA props for navigation landmarks
   */
  static createLandmarkProps(
    type: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'search',
    label?: string
  ): AriaProps {
    const props: AriaProps = {
      role: type === 'main' ? 'main' : type === 'navigation' ? 'navigation' : type
    };

    if (label) {
      props['aria-label'] = label;
    }

    return props;
  }

  /**
   * Create ARIA props for steppers/wizards
   */
  static createStepperProps(
    currentStep: number,
    totalSteps: number,
    stepName: string,
    completed: boolean = false
  ): AriaProps {
    return {
      'aria-current': 'step',
      'aria-label': `Step ${currentStep} of ${totalSteps}: ${stepName}`,
      'aria-setsize': totalSteps,
      'aria-posinset': currentStep,
      role: 'tab',
      tabIndex: 0,
      'aria-selected': true,
      'aria-describedby': completed ? `step-${currentStep}-completed` : undefined
    };
  }

  /**
   * Create ARIA props for lists and grids
   */
  static createListProps(
    totalItems: number,
    multiselectable: boolean = false
  ): AriaProps {
    return {
      role: 'list',
      'aria-setsize': totalItems,
      'aria-multiselectable': multiselectable
    };
  }

  static createListItemProps(
    position: number,
    totalItems: number,
    selected: boolean = false,
    label?: string
  ): AriaProps {
    return {
      role: 'listitem',
      'aria-posinset': position,
      'aria-setsize': totalItems,
      'aria-selected': selected,
      'aria-label': label,
      tabIndex: selected ? 0 : -1
    };
  }

  /**
   * Create ARIA props for live regions
   */
  static createLiveRegionProps(
    politeness: 'polite' | 'assertive' = 'polite',
    atomic: boolean = false
  ): AriaProps {
    return {
      'aria-live': politeness,
      'aria-atomic': atomic,
      role: 'status'
    };
  }

  /**
   * Create ARIA props for progress indicators
   */
  static createProgressProps(
    current: number,
    max: number,
    label: string,
    valueText?: string
  ): AriaProps {
    return {
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': current,
      'aria-valuetext': valueText || `${current} of ${max}`
    };
  }

  /**
   * Create ARIA props for modals and dialogs
   */
  static createDialogProps(
    title: string,
    describedBy?: string,
    modal: boolean = true
  ): AriaProps {
    return {
      role: modal ? 'dialog' : 'alertdialog',
      'aria-label': title,
      'aria-describedby': describedBy,
      'aria-modal': modal,
      tabIndex: -1
    };
  }

  /**
   * Create ARIA props for search components
   */
  static createSearchProps(
    placeholder: string,
    hasResults: boolean,
    resultsId?: string
  ): AriaProps {
    const props: AriaProps = {
      role: 'searchbox',
      'aria-label': placeholder,
      'aria-autocomplete': 'list'
    };

    if (hasResults && resultsId) {
      props['aria-controls'] = resultsId;
      props['aria-expanded'] = true;
    }

    return props;
  }

  /**
   * Create ARIA props for error announcements
   */
  static createErrorProps(
    message: string,
    fieldId?: string
  ): AriaProps {
    return {
      role: 'alert',
      'aria-live': 'assertive',
      'aria-atomic': true,
      id: fieldId ? `${fieldId}-error` : this.generateId('error'),
      'aria-label': `Error: ${message}`
    };
  }

  /**
   * Create ARIA props for loading states
   */
  static createLoadingProps(
    loadingText: string = 'Loading...',
    busy: boolean = true
  ): AriaProps {
    return {
      'aria-busy': busy,
      'aria-live': 'polite',
      'aria-label': loadingText,
      role: 'status'
    };
  }

  /**
   * Create ARIA props for card/selectable items
   */
  static createSelectableCardProps(
    label: string,
    selected: boolean,
    disabled: boolean = false,
    describedBy?: string
  ): AriaProps {
    return {
      role: 'option',
      'aria-label': label,
      'aria-selected': selected,
      'aria-disabled': disabled,
      'aria-describedby': describedBy,
      tabIndex: disabled ? -1 : 0
    };
  }
}

// ==================== FOCUS MANAGEMENT ====================

export class FocusManager {
  private static trapStack: HTMLElement[] = [];

  /**
   * Set focus to an element with error handling
   */
  static setFocus(element: HTMLElement | null, options: { preventScroll?: boolean } = {}) {
    if (!element || !this.isElementFocusable(element)) return false;

    try {
      element.focus({ preventScroll: options.preventScroll });
      return true;
    } catch (error) {
      console.warn('Focus management error:', error);
      return false;
    }
  }

  /**
   * Check if element can receive focus
   */
  static isElementFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    return focusableSelectors.some(selector => element.matches(selector)) ||
           element.tabIndex >= 0;
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements).filter(el => 
      this.isElementFocusable(el as HTMLElement) && 
      this.isElementVisible(el as HTMLElement)
    ) as HTMLElement[];
  }

  /**
   * Check if element is visible to screen readers
   */
  static isElementVisible(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      element.hidden ||
      element.getAttribute('aria-hidden') === 'true'
    );
  }

  /**
   * Create focus trap for modals and dialogs
   */
  static createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}) {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      console.warn('No focusable elements found in focus trap container');
      return { activate: () => {}, deactivate: () => {} };
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    let previouslyFocusedElement: HTMLElement | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            this.setFocus(lastElement);
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            this.setFocus(firstElement);
          }
        }
      } else if (e.key === 'Escape' && options.escapeDeactivates !== false) {
        e.preventDefault();
        deactivate();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (options.clickOutsideDeactivates && !container.contains(e.target as Node)) {
        deactivate();
      }
    };

    const activate = () => {
      previouslyFocusedElement = document.activeElement as HTMLElement;
      this.trapStack.push(container);
      
      // Set initial focus
      const initialFocus = options.initialFocus 
        ? typeof options.initialFocus === 'function' 
          ? options.initialFocus() 
          : options.initialFocus
        : firstElement;
      
      this.setFocus(initialFocus);
      
      container.addEventListener('keydown', handleKeyDown);
      if (options.clickOutsideDeactivates) {
        document.addEventListener('click', handleClickOutside, true);
      }
    };

    const deactivate = () => {
      const index = this.trapStack.indexOf(container);
      if (index !== -1) {
        this.trapStack.splice(index, 1);
      }
      
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);
      
      if (options.returnFocusOnDeactivate !== false && previouslyFocusedElement) {
        this.setFocus(previouslyFocusedElement);
      }
    };

    return { activate, deactivate };
  }

  /**
   * Manage roving tabindex for component groups
   */
  static createRovingTabindex(
    container: HTMLElement,
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ) {
    const items = this.getFocusableElements(container);
    let currentIndex = 0;

    const updateTabindex = () => {
      items.forEach((item, index) => {
        item.tabIndex = index === currentIndex ? 0 : -1;
        item.setAttribute('aria-selected', (index === currentIndex).toString());
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      let nextIndex = currentIndex;

      if (orientation === 'horizontal') {
        if (key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          e.preventDefault();
        } else if (key === 'ArrowRight') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          e.preventDefault();
        }
      } else {
        if (key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          e.preventDefault();
        } else if (key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          e.preventDefault();
        }
      }

      if (key === 'Home') {
        nextIndex = 0;
        e.preventDefault();
      } else if (key === 'End') {
        nextIndex = items.length - 1;
        e.preventDefault();
      }

      if (nextIndex !== currentIndex) {
        currentIndex = nextIndex;
        updateTabindex();
        this.setFocus(items[currentIndex]);
      }
    };

    const activate = () => {
      updateTabindex();
      container.addEventListener('keydown', handleKeyDown);
    };

    const deactivate = () => {
      container.removeEventListener('keydown', handleKeyDown);
    };

    return { activate, deactivate, setActiveIndex: (index: number) => {
      if (index >= 0 && index < items.length) {
        currentIndex = index;
        updateTabindex();
      }
    }};
  }
}

// ==================== SCREEN READER UTILITIES ====================

export class ScreenReaderUtils {
  
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Create screen reader only text
   */
  static createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }

  /**
   * Enhanced description for complex UI elements
   */
  static createDescription(
    element: string,
    action?: string,
    context?: string,
    state?: string
  ): string {
    const parts = [element];
    
    if (state) parts.push(state);
    if (action) parts.push(action);
    if (context) parts.push(context);
    
    return parts.join(', ');
  }
}

// ==================== ACCESSIBILITY CHECKER ====================

export class AccessibilityChecker {
  
  /**
   * Check for common accessibility issues
   */
  static checkElement(element: HTMLElement): string[] {
    const issues: string[] = [];
    
    // Check for missing alt text on images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      issues.push('Image missing alt text');
    }
    
    // Check for buttons without labels
    if (element.tagName === 'BUTTON' && 
        !element.textContent?.trim() && 
        !element.getAttribute('aria-label') &&
        !element.getAttribute('aria-labelledby')) {
      issues.push('Button missing accessible label');
    }
    
    // Check for inputs without labels
    if (element.tagName === 'INPUT' && 
        element.getAttribute('type') !== 'hidden' &&
        !element.getAttribute('aria-label') &&
        !element.getAttribute('aria-labelledby') &&
        !this.hasAssociatedLabel(element)) {
      issues.push('Input missing accessible label');
    }
    
    // Check for insufficient color contrast (simplified check)
    const style = getComputedStyle(element);
    if (this.hasInsufficientContrast(style.color, style.backgroundColor)) {
      issues.push('Potential color contrast issue');
    }
    
    return issues;
  }

  private static hasAssociatedLabel(element: HTMLElement): boolean {
    const id = element.getAttribute('id');
    if (!id) return false;
    
    return document.querySelector(`label[for="${id}"]`) !== null;
  }

  private static hasInsufficientContrast(foreground: string, background: string): boolean {
    // This is a simplified check - in production, use a proper color contrast library
    if (!foreground || !background || 
        background === 'rgba(0, 0, 0, 0)' || 
        background === 'transparent') {
      return false;
    }
    
    // Basic check for very light text on light background
    const fgLuminance = this.getColorLuminance(foreground);
    const bgLuminance = this.getColorLuminance(background);
    
    if (fgLuminance === null || bgLuminance === null) return false;
    
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                    (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return contrast < 4.5; // WCAG AA requirement
  }

  private static getColorLuminance(color: string): number | null {
    // Simplified luminance calculation
    // In production, use a proper color library
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (!match || match.length < 3) return null;
      
      const [r, g, b] = match.map(n => parseInt(n) / 255);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    return null;
  }
}

// ==================== REACT HOOKS ====================

/**
 * Custom hook for managing ARIA announcements
 */
export function useAriaAnnouncer() {
  const announce = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    ScreenReaderUtils.announce(message, priority);
  }, []);

  return { announce };
}

/**
 * Custom hook for generating stable IDs
 */
export function useAriaId(prefix: string = 'aria') {
  const id = React.useMemo(() => AriaUtils.generateId(prefix), [prefix]);
  return id;
}

/**
 * Custom hook for focus trap management
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean,
  options: FocusTrapOptions = {}
) {
  const trapRef = React.useRef<{ activate: () => void; deactivate: () => void } | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    trapRef.current = FocusManager.createFocusTrap(containerRef.current, options);

    if (active) {
      trapRef.current.activate();
    }

    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
      }
    };
  }, [active, containerRef, options]);

  React.useEffect(() => {
    if (trapRef.current) {
      if (active) {
        trapRef.current.activate();
      } else {
        trapRef.current.deactivate();
      }
    }
  }, [active]);
}

export default AriaUtils;