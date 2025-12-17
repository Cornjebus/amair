'use client';

import * as React from 'react';

// =============================================================================
// useDebounce - Debounce a value
// =============================================================================

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// useDebouncedCallback - Debounce a callback function
// =============================================================================

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const callbackRef = React.useRef(callback);

  // Update callback ref when callback changes
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// =============================================================================
// useThrottle - Throttle a value
// =============================================================================

export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdated = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - timeSinceLastUpdate);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, interval]);

  return throttledValue;
}

// =============================================================================
// useIntersectionObserver - Observe element visibility
// =============================================================================

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const elementRef = React.useRef<HTMLElement>(null);
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const frozen = React.useRef(false);

  const isIntersecting = entry?.isIntersecting ?? false;

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || (freezeOnceVisible && frozen.current)) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);
        if (freezeOnceVisible && observerEntry.isIntersecting) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return { ref: elementRef as React.RefObject<HTMLElement>, isIntersecting, entry };
}

// =============================================================================
// useLazyLoad - Lazy load content when visible
// =============================================================================

export interface UseLazyLoadOptions extends UseIntersectionObserverOptions {
  /** Delay before loading (ms) */
  delay?: number;
}

export function useLazyLoad(options: UseLazyLoadOptions = {}): {
  ref: React.RefObject<HTMLElement>;
  shouldLoad: boolean;
  isVisible: boolean;
} {
  const { delay = 0, ...intersectionOptions } = options;
  const { ref, isIntersecting } = useIntersectionObserver({
    ...intersectionOptions,
    freezeOnceVisible: true,
  });
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    if (isIntersecting) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldLoad(true), delay);
        return () => clearTimeout(timer);
      }
      setShouldLoad(true);
    }
  }, [isIntersecting, delay]);

  return { ref, shouldLoad, isVisible: isIntersecting };
}

// =============================================================================
// useImagePreload - Preload images
// =============================================================================

export function useImagePreload(
  src: string | undefined
): { loaded: boolean; error: boolean } {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setLoaded(false);
      setError(false);
      return;
    }

    const img = new Image();

    img.onload = () => {
      setLoaded(true);
      setError(false);
    };

    img.onerror = () => {
      setLoaded(false);
      setError(true);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error };
}

// =============================================================================
// usePerformanceMetrics - Track component performance
// =============================================================================

export interface PerformanceMetrics {
  mountTime: number;
  renderCount: number;
  lastRenderDuration: number;
}

export function usePerformanceMetrics(componentName: string): PerformanceMetrics {
  const mountTime = React.useRef<number>(0);
  const renderCount = React.useRef<number>(0);
  const lastRenderStart = React.useRef<number>(0);
  const [lastRenderDuration, setLastRenderDuration] = React.useState(0);

  // Track mount time
  React.useEffect(() => {
    mountTime.current = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${componentName} mounted at ${mountTime.current.toFixed(2)}ms`);
    }
  }, [componentName]);

  // Track render count and duration
  React.useEffect(() => {
    renderCount.current += 1;
    const renderEnd = performance.now();

    if (lastRenderStart.current > 0) {
      const duration = renderEnd - lastRenderStart.current;
      setLastRenderDuration(duration);

      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(
          `[Performance] ${componentName} render took ${duration.toFixed(2)}ms (>16ms threshold)`
        );
      }
    }
  });

  // Set render start time
  lastRenderStart.current = performance.now();

  return {
    mountTime: mountTime.current,
    renderCount: renderCount.current,
    lastRenderDuration,
  };
}

// =============================================================================
// usePrevious - Get previous value
// =============================================================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// =============================================================================
// useIsMounted - Check if component is mounted
// =============================================================================

export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}

// =============================================================================
// useMediaQuery - Responsive breakpoint detection
// =============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Preset breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
