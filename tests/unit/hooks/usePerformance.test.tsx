import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useIntersectionObserver,
  useLazyLoad,
  useImagePreload,
  usePrevious,
  useIsMounted,
  useMediaQuery,
} from '@/hooks/usePerformance';

// =============================================================================
// Timer Control
// =============================================================================

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// useDebounce Tests
// =============================================================================

describe('useDebounce', () => {
  function TestComponent({ value, delay }: { value: string; delay?: number }) {
    const debouncedValue = useDebounce(value, delay);
    return <div data-testid="debounced">{debouncedValue}</div>;
  }

  it('returns initial value immediately', () => {
    render(<TestComponent value="initial" />);
    expect(screen.getByTestId('debounced')).toHaveTextContent('initial');
  });

  it('debounces value changes', () => {
    const { rerender } = render(<TestComponent value="first" delay={300} />);

    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    rerender(<TestComponent value="second" delay={300} />);

    // Value should not change immediately
    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    // After delay, value should update
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('debounced')).toHaveTextContent('second');
  });

  it('cancels pending updates when value changes', () => {
    const { rerender } = render(<TestComponent value="first" delay={300} />);

    rerender(<TestComponent value="second" delay={300} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender(<TestComponent value="third" delay={300} />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should show "third", not "second"
    expect(screen.getByTestId('debounced')).toHaveTextContent('third');
  });

  it('uses default delay of 300ms', () => {
    const { rerender } = render(<TestComponent value="first" />);

    rerender(<TestComponent value="second" />);

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('debounced')).toHaveTextContent('second');
  });
});

// =============================================================================
// useDebouncedCallback Tests
// =============================================================================

describe('useDebouncedCallback', () => {
  function TestComponent({
    callback,
    delay,
  }: {
    callback: (value: string) => void;
    delay?: number;
  }) {
    const debouncedCallback = useDebouncedCallback(callback, delay);
    return (
      <button onClick={() => debouncedCallback('clicked')}>Click me</button>
    );
  }

  it('debounces callback execution', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} delay={300} />);

    const button = screen.getByRole('button');

    // Use fireEvent instead of userEvent for synchronous behavior with fake timers
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('clicked');
  });

  it('resets timer on each call', () => {
    const callback = vi.fn();
    render(<TestComponent callback={callback} delay={300} />);

    const button = screen.getByRole('button');

    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// useThrottle Tests
// =============================================================================

describe('useThrottle', () => {
  function TestComponent({ value, interval }: { value: number; interval?: number }) {
    const throttledValue = useThrottle(value, interval);
    return <div data-testid="throttled">{throttledValue}</div>;
  }

  it('returns initial value immediately', () => {
    render(<TestComponent value={1} />);
    expect(screen.getByTestId('throttled')).toHaveTextContent('1');
  });

  it('updates after interval has passed', async () => {
    const { rerender } = render(<TestComponent value={1} interval={300} />);

    // Wait for interval to pass
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender(<TestComponent value={2} interval={300} />);

    // Should update after another interval cycle
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('throttled')).toHaveTextContent('2');
  });

  it('delays update if interval has not passed', () => {
    const { rerender } = render(<TestComponent value={1} interval={300} />);

    rerender(<TestComponent value={2} interval={300} />);

    // Value should not update immediately (within interval)
    expect(screen.getByTestId('throttled')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('throttled')).toHaveTextContent('2');
  });
});

// =============================================================================
// usePrevious Tests
// =============================================================================

describe('usePrevious', () => {
  function TestComponent({ value }: { value: string }) {
    const previous = usePrevious(value);
    return (
      <div>
        <span data-testid="current">{value}</span>
        <span data-testid="previous">{previous ?? 'undefined'}</span>
      </div>
    );
  }

  it('returns undefined on first render', () => {
    render(<TestComponent value="first" />);

    expect(screen.getByTestId('current')).toHaveTextContent('first');
    expect(screen.getByTestId('previous')).toHaveTextContent('undefined');
  });

  it('returns previous value after update', () => {
    const { rerender } = render(<TestComponent value="first" />);

    rerender(<TestComponent value="second" />);

    expect(screen.getByTestId('current')).toHaveTextContent('second');
    expect(screen.getByTestId('previous')).toHaveTextContent('first');
  });

  it('tracks multiple value changes', () => {
    const { rerender } = render(<TestComponent value="first" />);

    rerender(<TestComponent value="second" />);
    expect(screen.getByTestId('previous')).toHaveTextContent('first');

    rerender(<TestComponent value="third" />);
    expect(screen.getByTestId('previous')).toHaveTextContent('second');
  });
});

// =============================================================================
// useIsMounted Tests
// =============================================================================

describe('useIsMounted', () => {
  function TestComponent() {
    const isMounted = useIsMounted();
    return <div data-testid="mounted">{String(isMounted)}</div>;
  }

  it('returns false initially then true after mount', async () => {
    vi.useRealTimers();

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mounted')).toHaveTextContent('true');
    });

    vi.useFakeTimers();
  });
});

// =============================================================================
// useMediaQuery Tests
// =============================================================================

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  function mockMediaQuery(matches: boolean) {
    const listeners: ((e: MediaQueryListEvent) => void)[] = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, callback: (e: MediaQueryListEvent) => void) => {
          listeners.push(callback);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    return {
      triggerChange: (newMatches: boolean) => {
        listeners.forEach((listener) =>
          listener({ matches: newMatches } as MediaQueryListEvent)
        );
      },
    };
  }

  function TestComponent({ query }: { query: string }) {
    const matches = useMediaQuery(query);
    return <div data-testid="matches">{String(matches)}</div>;
  }

  it('returns current match state', () => {
    mockMediaQuery(true);

    render(<TestComponent query="(min-width: 768px)" />);

    expect(screen.getByTestId('matches')).toHaveTextContent('true');
  });

  it('returns false when query does not match', () => {
    mockMediaQuery(false);

    render(<TestComponent query="(min-width: 768px)" />);

    expect(screen.getByTestId('matches')).toHaveTextContent('false');
  });
});

// =============================================================================
// useImagePreload Tests
// =============================================================================

describe('useImagePreload', () => {
  function TestComponent({ src }: { src: string | undefined }) {
    const { loaded, error } = useImagePreload(src);
    return (
      <div>
        <span data-testid="loaded">{String(loaded)}</span>
        <span data-testid="error">{String(error)}</span>
      </div>
    );
  }

  it('starts with loaded false and error false', () => {
    render(<TestComponent src="/test.jpg" />);

    expect(screen.getByTestId('loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('false');
  });

  it('returns false states when src is undefined', () => {
    render(<TestComponent src={undefined} />);

    expect(screen.getByTestId('loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('false');
  });
});

// =============================================================================
// useIntersectionObserver Tests
// =============================================================================

describe('useIntersectionObserver', () => {
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;

  class MockIntersectionObserver {
    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      observerCallback = callback;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  beforeEach(() => {
    vi.useRealTimers();
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  function TestComponent() {
    const { ref, isIntersecting } = useIntersectionObserver();
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="element">
        {String(isIntersecting)}
      </div>
    );
  }

  it('renders component with observer', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('element')).toBeInTheDocument();
  });

  it('initially returns isIntersecting as false', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('element')).toHaveTextContent('false');
  });
});

// =============================================================================
// useLazyLoad Tests
// =============================================================================

describe('useLazyLoad', () => {
  class MockIntersectionObserver {
    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      // Store callback for later use if needed
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  beforeEach(() => {
    vi.useRealTimers();
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  function TestComponent() {
    const { ref, shouldLoad } = useLazyLoad();
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="element">
        {shouldLoad ? 'Loaded' : 'Not loaded'}
      </div>
    );
  }

  it('initially sets shouldLoad to false', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('element')).toHaveTextContent('Not loaded');
  });
});
