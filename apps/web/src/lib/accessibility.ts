// Accessibility utilities and helpers

export interface FocusableElement extends HTMLElement {
  focus(): void;
}

// Focus management utilities
export function getFocusableElements(container: HTMLElement): FocusableElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as FocusableElement[];
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = getFocusableElements(element);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Screen reader announcements
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Keyboard navigation helpers
export function createKeyboardHandler(handlers: Record<string, (e: KeyboardEvent) => void>) {
  return (e: KeyboardEvent) => {
    const handler = handlers[e.key] || handlers[e.code];
    if (handler) {
      handler(e);
    }
  };
}

// ARIA helpers
export function generateId(prefix: string = 'tripthesia'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function setAriaExpanded(element: HTMLElement, expanded: boolean) {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setAriaSelected(element: HTMLElement, selected: boolean) {
  element.setAttribute('aria-selected', selected.toString());
}

export function setAriaChecked(element: HTMLElement, checked: boolean | 'mixed') {
  element.setAttribute('aria-checked', checked.toString());
}

// Color contrast helpers
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want to use a proper color library
  const getLuminance = (color: string) => {
    // Basic RGB extraction (assuming hex colors)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Relative luminance calculation
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRequirement(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requirement = level === 'AA' ? (isLargeText ? 3 : 4.5) : (isLargeText ? 4.5 : 7);
  return ratio >= requirement;
}

// Motion preferences
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Focus visible utilities
export function addFocusVisibleSupport() {
  let hadKeyboardEvent = false;

  function onKeyDown(e: KeyboardEvent) {
    if (e.metaKey || e.altKey || e.ctrlKey) return;
    hadKeyboardEvent = true;
  }

  function onPointerDown() {
    hadKeyboardEvent = false;
  }

  function onFocus(e: FocusEvent) {
    if (hadKeyboardEvent || (e.target as HTMLElement).matches(':focus-visible')) {
      (e.target as HTMLElement).classList.add('focus-visible');
    }
  }

  function onBlur(e: FocusEvent) {
    (e.target as HTMLElement).classList.remove('focus-visible');
  }

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('touchstart', onPointerDown, true);
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);
}

// Accessible drag and drop
export interface AccessibleDragDropOptions {
  onMove: (fromIndex: number, toIndex: number) => void;
  onReorder: (newOrder: number[]) => void;
  getItemLabel: (index: number) => string;
  getItemCount: () => number;
}

export function createAccessibleDragDrop(options: AccessibleDragDropOptions) {
  let currentIndex = -1;
  let isReordering = false;

  return {
    handleKeyDown: (e: KeyboardEvent, index: number) => {
      if (!isReordering) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          isReordering = true;
          currentIndex = index;
          announceToScreenReader(
            `Started reordering ${options.getItemLabel(index)}. Use arrow keys to move, Enter to confirm, Escape to cancel.`,
            'assertive'
          );
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            options.onMove(currentIndex, currentIndex - 1);
            currentIndex--;
            announceToScreenReader(
              `Moved ${options.getItemLabel(currentIndex)} up. Position ${currentIndex + 1} of ${options.getItemCount()}.`
            );
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < options.getItemCount() - 1) {
            options.onMove(currentIndex, currentIndex + 1);
            currentIndex++;
            announceToScreenReader(
              `Moved ${options.getItemLabel(currentIndex)} down. Position ${currentIndex + 1} of ${options.getItemCount()}.`
            );
          }
          break;

        case 'Enter':
          e.preventDefault();
          isReordering = false;
          announceToScreenReader(
            `Finished reordering ${options.getItemLabel(currentIndex)} at position ${currentIndex + 1}.`,
            'assertive'
          );
          currentIndex = -1;
          break;

        case 'Escape':
          e.preventDefault();
          isReordering = false;
          announceToScreenReader('Reordering cancelled.', 'assertive');
          currentIndex = -1;
          break;
      }
    },

    isReordering: () => isReordering,
    getCurrentIndex: () => currentIndex,
  };
}