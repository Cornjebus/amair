import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonCard,
  SkeletonStoryCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonButton,
  SkeletonDashboard,
  SkeletonStoriesGrid,
} from '@/components/ui/skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton Base', () => {
    it('renders with default styles', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-amari-sand/60');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('renders without animation when disabled', () => {
      const { container } = render(<Skeleton animate={false} className="h-10" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('applies circular variant correctly', () => {
      const { container } = render(<Skeleton variant="circular" className="h-10 w-10" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies text variant correctly', () => {
      const { container } = render(<Skeleton variant="text" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-4');
    });

    it('applies card variant correctly', () => {
      const { container } = render(<Skeleton variant="card" className="h-40" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-xl');
    });

    it('accepts custom className', () => {
      const { container } = render(<Skeleton className="custom-class h-20" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('SkeletonCard', () => {
    it('renders card structure', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
    });

    it('contains multiple skeleton elements', () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonStoryCard', () => {
    it('renders story card layout', () => {
      const { container } = render(<SkeletonStoryCard />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-xl');
    });

    it('includes image placeholder', () => {
      const { container } = render(<SkeletonStoryCard />);
      // First skeleton should be the image placeholder
      const imageSkeleton = container.querySelector('.h-48');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('includes title and description skeletons', () => {
      const { container } = render(<SkeletonStoryCard />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SkeletonAvatar', () => {
    it('renders with default md size', () => {
      const { container } = render(<SkeletonAvatar />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('w-10');
    });

    it('renders sm size correctly', () => {
      const { container } = render(<SkeletonAvatar size="sm" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('h-8');
      expect(avatar).toHaveClass('w-8');
    });

    it('renders lg size correctly', () => {
      const { container } = render(<SkeletonAvatar size="lg" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('h-14');
      expect(avatar).toHaveClass('w-14');
    });

    it('is circular', () => {
      const { container } = render(<SkeletonAvatar />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('rounded-full');
    });
  });

  describe('SkeletonText', () => {
    it('renders default 3 lines', () => {
      const { container } = render(<SkeletonText />);
      const lines = container.querySelectorAll('.h-4');
      expect(lines.length).toBe(3);
    });

    it('renders custom number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />);
      const lines = container.querySelectorAll('.h-4');
      expect(lines.length).toBe(5);
    });

    it('last line is shorter', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const lines = container.querySelectorAll('.h-4');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toHaveClass('w-3/4');
    });
  });

  describe('SkeletonButton', () => {
    it('renders default size', () => {
      const { container } = render(<SkeletonButton />);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('w-28');
    });

    it('renders sm size', () => {
      const { container } = render(<SkeletonButton size="sm" />);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('h-9');
    });

    it('renders lg size', () => {
      const { container } = render(<SkeletonButton size="lg" />);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('h-14');
    });

    it('has rounded corners', () => {
      const { container } = render(<SkeletonButton />);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('rounded-xl');
    });
  });

  describe('SkeletonDashboard', () => {
    it('renders dashboard layout', () => {
      const { container } = render(<SkeletonDashboard />);
      expect(container.firstChild).toHaveClass('space-y-8');
    });

    it('includes header skeleton', () => {
      const { container } = render(<SkeletonDashboard />);
      // Should have heading skeletons
      const heading = container.querySelector('.h-8');
      expect(heading).toBeInTheDocument();
    });

    it('includes stats cards', () => {
      const { container } = render(<SkeletonDashboard />);
      // Should have a grid of cards
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('includes story cards skeleton', () => {
      render(<SkeletonDashboard />);
      // Should have multiple story card skeletons
      const storyCards = document.querySelectorAll('.rounded-xl');
      expect(storyCards.length).toBeGreaterThan(0);
    });

    it('has fade-in animation class', () => {
      const { container } = render(<SkeletonDashboard />);
      expect(container.firstChild).toHaveClass('animate-in');
    });
  });

  describe('SkeletonStoriesGrid', () => {
    it('renders grid layout', () => {
      const { container } = render(<SkeletonStoriesGrid />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders 6 story card skeletons', () => {
      render(<SkeletonStoriesGrid />);
      // Check for multiple card structures
      const cards = document.querySelectorAll('.rounded-xl.border');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });

    it('includes header skeleton', () => {
      const { container } = render(<SkeletonStoriesGrid />);
      const header = container.querySelector('.h-8');
      expect(header).toBeInTheDocument();
    });

    it('has fade-in animation', () => {
      const { container } = render(<SkeletonStoriesGrid />);
      expect(container.firstChild).toHaveClass('animate-in');
    });
  });
});

describe('Skeleton Accessibility', () => {
  it('skeleton elements are decorative (no role needed)', () => {
    const { container } = render(<Skeleton className="h-10" />);
    const skeleton = container.firstChild as HTMLElement;
    // Skeletons are decorative and shouldn't have interactive roles
    expect(skeleton.getAttribute('role')).toBeNull();
  });
});
