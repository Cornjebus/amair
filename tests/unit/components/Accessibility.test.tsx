import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SkipLink,
  SkipLinkTarget,
  SkipLinks,
  ReducedMotion,
  useAnimationConfig,
} from '@/components/accessibility';

// =============================================================================
// Mock matchMedia for reduced motion tests
// =============================================================================

function mockMatchMedia(prefersReducedMotion: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') && prefersReducedMotion,
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
    triggerChange: (matches: boolean) => {
      listeners.forEach((listener) =>
        listener({ matches } as MediaQueryListEvent)
      );
    },
  };
}

// =============================================================================
// SkipLink Tests
// =============================================================================

describe('SkipLink', () => {
  it('renders with default props', () => {
    render(<SkipLink />);

    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders with custom href and children', () => {
    render(<SkipLink href="#custom-target">Skip to navigation</SkipLink>);

    const link = screen.getByText('Skip to navigation');
    expect(link).toHaveAttribute('href', '#custom-target');
  });

  it('is visually hidden by default (has sr-only class)', () => {
    render(<SkipLink />);

    const link = screen.getByText('Skip to main content');
    expect(link).toHaveClass('sr-only');
  });

  it('becomes visible on focus', () => {
    render(<SkipLink />);

    const link = screen.getByText('Skip to main content');
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('applies custom className', () => {
    render(<SkipLink className="custom-class" />);

    const link = screen.getByText('Skip to main content');
    expect(link).toHaveClass('custom-class');
  });
});

// =============================================================================
// SkipLinkTarget Tests
// =============================================================================

describe('SkipLinkTarget', () => {
  it('renders with default props', () => {
    render(<SkipLinkTarget>Main content</SkipLinkTarget>);

    const target = screen.getByText('Main content');
    expect(target.closest('main')).toHaveAttribute('id', 'main-content');
  });

  it('renders with custom id', () => {
    render(<SkipLinkTarget id="custom-id">Content</SkipLinkTarget>);

    const target = screen.getByText('Content');
    expect(target.closest('main')).toHaveAttribute('id', 'custom-id');
  });

  it('has tabIndex -1 for programmatic focus', () => {
    render(<SkipLinkTarget>Content</SkipLinkTarget>);

    const target = screen.getByText('Content').closest('main');
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('renders as different element types', () => {
    const { rerender } = render(
      <SkipLinkTarget as="div">Content</SkipLinkTarget>
    );
    expect(screen.getByText('Content').closest('div')).toBeInTheDocument();

    rerender(<SkipLinkTarget as="section">Content</SkipLinkTarget>);
    expect(screen.getByText('Content').closest('section')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SkipLinkTarget className="custom-styles">Content</SkipLinkTarget>);

    const target = screen.getByText('Content').closest('main');
    expect(target).toHaveClass('custom-styles');
  });
});

// =============================================================================
// SkipLinks (Multiple) Tests
// =============================================================================

describe('SkipLinks', () => {
  const links = [
    { href: '#main', label: 'Main content' },
    { href: '#nav', label: 'Navigation' },
    { href: '#footer', label: 'Footer' },
  ];

  it('renders all skip links', () => {
    render(<SkipLinks links={links} />);

    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders links with correct hrefs', () => {
    render(<SkipLinks links={links} />);

    expect(screen.getByText('Main content')).toHaveAttribute('href', '#main');
    expect(screen.getByText('Navigation')).toHaveAttribute('href', '#nav');
    expect(screen.getByText('Footer')).toHaveAttribute('href', '#footer');
  });

  it('has navigation landmark with label', () => {
    render(<SkipLinks links={links} />);

    const nav = screen.getByRole('navigation', { name: 'Skip links' });
    expect(nav).toBeInTheDocument();
  });
});

// =============================================================================
// ReducedMotion Tests
// =============================================================================

describe('ReducedMotion', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders children when motion is allowed', () => {
    mockMatchMedia(false);

    render(
      <ReducedMotion fallback={<div>Fallback</div>}>
        <div>Animated content</div>
      </ReducedMotion>
    );

    expect(screen.getByText('Animated content')).toBeInTheDocument();
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
  });

  it('renders fallback when reduced motion is preferred', () => {
    mockMatchMedia(true);

    render(
      <ReducedMotion fallback={<div>Static content</div>}>
        <div>Animated content</div>
      </ReducedMotion>
    );

    expect(screen.getByText('Static content')).toBeInTheDocument();
    expect(screen.queryByText('Animated content')).not.toBeInTheDocument();
  });

  it('renders children without fallback when reduced motion preferred', () => {
    mockMatchMedia(true);

    render(
      <ReducedMotion>
        <div>Content without fallback</div>
      </ReducedMotion>
    );

    expect(screen.getByText('Content without fallback')).toBeInTheDocument();
  });

  it('respects forceReduced prop', () => {
    mockMatchMedia(false);

    render(
      <ReducedMotion forceReduced fallback={<div>Forced static</div>}>
        <div>Animated content</div>
      </ReducedMotion>
    );

    expect(screen.getByText('Forced static')).toBeInTheDocument();
  });
});

// =============================================================================
// useAnimationConfig Tests
// =============================================================================

describe('useAnimationConfig', () => {
  function TestComponent() {
    const config = useAnimationConfig();
    return (
      <div>
        <span data-testid="animate">{String(config.animate)}</span>
        <span data-testid="duration">{config.duration}</span>
        <span data-testid="transition-duration">{config.transitionDuration}</span>
      </div>
    );
  }

  it('returns animation config when motion allowed', () => {
    mockMatchMedia(false);

    render(<TestComponent />);

    expect(screen.getByTestId('animate')).toHaveTextContent('true');
    expect(screen.getByTestId('duration')).toHaveTextContent('0.3');
    expect(screen.getByTestId('transition-duration')).toHaveTextContent('300ms');
  });

  it('returns reduced config when motion reduced', () => {
    mockMatchMedia(true);

    render(<TestComponent />);

    expect(screen.getByTestId('animate')).toHaveTextContent('false');
    expect(screen.getByTestId('duration')).toHaveTextContent('0');
    expect(screen.getByTestId('transition-duration')).toHaveTextContent('0ms');
  });
});

// =============================================================================
// Integration: Skip Link Navigation
// =============================================================================

describe('Skip link navigation integration', () => {
  it('skip link targets element with matching id', () => {
    render(
      <>
        <SkipLink href="#main-content" />
        <header>Header content</header>
        <SkipLinkTarget id="main-content">
          <h1>Main heading</h1>
        </SkipLinkTarget>
      </>
    );

    const skipLink = screen.getByText('Skip to main content');
    const target = screen.getByRole('main');

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(target).toHaveAttribute('id', 'main-content');
  });
});
