import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  OptimizedImage,
  PreloadedImage,
  AvatarImage,
} from '@/components/ui/OptimizedImage';

// =============================================================================
// Mock Next.js Image component
// =============================================================================

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    className,
    ...props
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
  }) => (
    <img
      src={src as string}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      data-testid="next-image"
      {...props}
    />
  ),
}));

// =============================================================================
// Mock IntersectionObserver
// =============================================================================

let intersectionCallback: (entries: IntersectionObserverEntry[]) => void;

class MockIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    intersectionCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

// Helper to simulate intersection
function simulateIntersection(isIntersecting: boolean) {
  intersectionCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
}

// =============================================================================
// OptimizedImage Tests
// =============================================================================

describe('OptimizedImage', () => {
  it('renders with required props', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" width={200} height={100} lazy={false} />);

    // Image should be rendered (not lazy)
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={200} height={100} lazy={false} />);

    // Skeleton should be visible before image loads
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('hides skeleton when showSkeleton is false', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        showSkeleton={false}
        lazy={false}
      />
    );

    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).not.toBeInTheDocument();
  });

  it('applies custom className to image', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        className="custom-image-class"
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    expect(image).toHaveClass('custom-image-class');
  });

  it('applies containerClassName to container', () => {
    const { container } = render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        containerClassName="custom-container"
        lazy={false}
      />
    );

    expect(container.firstChild).toHaveClass('custom-container');
  });

  it('applies aspect ratio style', () => {
    const { container } = render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        aspectRatio="16/9"
        lazy={false}
      />
    );

    expect(container.firstChild).toHaveStyle({ aspectRatio: '16/9' });
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = vi.fn();

    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        onLoad={onLoad}
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    fireEvent.load(image);

    expect(onLoad).toHaveBeenCalled();
  });

  it('calls onError callback when image fails', () => {
    const onError = vi.fn();

    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        onError={onError}
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    expect(onError).toHaveBeenCalled();
  });

  it('uses fallback src on error', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test"
        width={200}
        height={100}
        fallbackSrc="/fallback.jpg"
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    // Image should now use fallback src
    expect(image).toHaveAttribute('src', '/fallback.jpg');
  });

  it('shows error state when no fallback provided', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test image"
        width={200}
        height={100}
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });
});

// =============================================================================
// Lazy Loading Tests
// =============================================================================

describe('OptimizedImage lazy loading', () => {
  it('does not render image until visible when lazy=true', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={200} height={100} lazy />);

    // Image should not be rendered initially
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('renders image when visible', async () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={200} height={100} lazy />);

    // Simulate entering viewport
    simulateIntersection(true);

    await waitFor(() => {
      expect(screen.getByTestId('next-image')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// PreloadedImage Tests
// =============================================================================

describe('PreloadedImage', () => {
  it('renders with priority loading', () => {
    render(<PreloadedImage src="/test.jpg" alt="Preloaded" width={200} height={100} />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', '/test.jpg');
  });

  it('does not use lazy loading', () => {
    render(<PreloadedImage src="/test.jpg" alt="Preloaded" width={200} height={100} />);

    // Image should be rendered immediately (not lazy)
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
  });
});

// =============================================================================
// AvatarImage Tests
// =============================================================================

describe('AvatarImage', () => {
  it('renders image with rounded styling', () => {
    render(<AvatarImage src="/avatar.jpg" alt="User avatar" size="md" lazy={false} />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveClass('rounded-full');
  });

  it('shows fallback with initials when no src', () => {
    render(<AvatarImage alt="John Doe" size="md" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('shows custom fallback initials', () => {
    render(<AvatarImage alt="User" fallbackInitials="AB" size="md" />);

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('shows fallback on image error', () => {
    render(<AvatarImage src="/avatar.jpg" alt="John Doe" size="md" lazy={false} />);

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender, container } = render(
      <AvatarImage alt="User" size="sm" />
    );

    expect(container.firstChild).toHaveStyle({ width: '32px', height: '32px' });

    rerender(<AvatarImage alt="User" size="lg" />);
    expect(container.firstChild).toHaveStyle({ width: '56px', height: '56px' });

    rerender(<AvatarImage alt="User" size="xl" />);
    expect(container.firstChild).toHaveStyle({ width: '96px', height: '96px' });
  });

  it('has correct aria-label on fallback', () => {
    render(<AvatarImage alt="John Doe" size="md" />);

    const fallback = screen.getByRole('img', { name: 'John Doe' });
    expect(fallback).toBeInTheDocument();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('OptimizedImage accessibility', () => {
  it('preserves alt text', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="A beautiful sunset"
        width={200}
        height={100}
        lazy={false}
      />
    );

    expect(screen.getByAltText('A beautiful sunset')).toBeInTheDocument();
  });

  it('error state has aria-label', () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test image"
        width={200}
        height={100}
        lazy={false}
      />
    );

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    const errorDiv = screen.getByRole('img', { name: 'Failed to load: Test image' });
    expect(errorDiv).toBeInTheDocument();
  });
});
