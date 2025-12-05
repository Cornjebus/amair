// =============================================================================
// Accessibility Utilities
// =============================================================================
// WCAG 2.1 AA compliance helpers

import { useEffect, useState, useCallback, useRef } from 'react';

// =============================================================================
// Focus Management
// =============================================================================

/**
 * Focus trap for modals and dialogs
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Skip link for keyboard navigation
 */
export function useSkipLink(targetId: string) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  return handleClick;
}

// =============================================================================
// Keyboard Navigation
// =============================================================================

/**
 * Arrow key navigation for lists and menus
 */
export function useArrowKeyNavigation(
  items: HTMLElement[],
  options: {
    horizontal?: boolean;
    loop?: boolean;
  } = {}
) {
  const { horizontal = false, loop = true } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';

      if (e.key === prevKey) {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const newIndex = prev - 1;
          if (newIndex < 0) return loop ? items.length - 1 : 0;
          return newIndex;
        });
      } else if (e.key === nextKey) {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const newIndex = prev + 1;
          if (newIndex >= items.length) return loop ? 0 : items.length - 1;
          return newIndex;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(items.length - 1);
      }
    },
    [items.length, horizontal, loop]
  );

  useEffect(() => {
    items[focusedIndex]?.focus();
  }, [focusedIndex, items]);

  return { focusedIndex, handleKeyDown };
}

/**
 * Escape key handler
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, isActive]);
}

// =============================================================================
// Screen Reader Utilities
// =============================================================================

/**
 * Live region announcer for dynamic content
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Clear first to ensure re-announcement of same message
    setAnnouncement('');
    requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const AnnouncerElement = () => (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, AnnouncerElement };
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0;
export function useId(prefix: string = 'id'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

// =============================================================================
// Reduced Motion
// =============================================================================

/**
 * Detect user's motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// Color Contrast
// =============================================================================

/**
 * Check if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

// =============================================================================
// Form Accessibility
// =============================================================================

/**
 * Generate accessible form field props
 */
export interface AccessibleFieldProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export function useAccessibleField(options: {
  name: string;
  error?: string;
  description?: string;
  required?: boolean;
}): {
  fieldProps: AccessibleFieldProps;
  labelProps: { htmlFor: string };
  errorProps: { id: string; role: 'alert' };
  descriptionProps: { id: string };
} {
  const baseId = useId(options.name);
  const errorId = `${baseId}-error`;
  const descriptionId = `${baseId}-description`;

  const describedBy = [
    options.error && errorId,
    options.description && descriptionId,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    fieldProps: {
      id: baseId,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': !!options.error,
      'aria-required': options.required,
    },
    labelProps: { htmlFor: baseId },
    errorProps: { id: errorId, role: 'alert' as const },
    descriptionProps: { id: descriptionId },
  };
}

// =============================================================================
// Loading States
// =============================================================================

/**
 * Accessible loading indicator props
 */
export function useLoadingAnnouncement(
  isLoading: boolean,
  loadingMessage: string = 'Loading...',
  completeMessage: string = 'Content loaded'
) {
  const { announce, AnnouncerElement } = useAnnouncer();
  const prevLoading = useRef(isLoading);

  useEffect(() => {
    if (isLoading && !prevLoading.current) {
      announce(loadingMessage);
    } else if (!isLoading && prevLoading.current) {
      announce(completeMessage);
    }
    prevLoading.current = isLoading;
  }, [isLoading, loadingMessage, completeMessage, announce]);

  return { AnnouncerElement };
}

// =============================================================================
// Touch Target Size
// =============================================================================

/**
 * Minimum touch target size (44x44px per WCAG 2.5.5)
 */
export const MINIMUM_TOUCH_TARGET = 44;

/**
 * Ensure minimum touch target size
 * Returns CSS-in-JS style object for touch target enhancement
 */
export function getTouchTargetStyles(currentSize: number): Record<string, unknown> {
  if (currentSize >= MINIMUM_TOUCH_TARGET) return {};

  const padding = (MINIMUM_TOUCH_TARGET - currentSize) / 2;
  return {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: `-${padding}px`,
      left: `-${padding}px`,
      right: `-${padding}px`,
      bottom: `-${padding}px`,
    },
  };
}
