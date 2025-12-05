import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CreditBadge, CreditBadgeInline } from '@/components/ui/CreditBadge/CreditBadge';

describe('CreditBadge Component', () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('renders with credits value', () => {
      render(<CreditBadge credits={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('credits')).toBeInTheDocument();
    });

    it('formats large credit values', () => {
      render(<CreditBadge credits={1500} />);

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('formats million credit values', () => {
      render(<CreditBadge credits={2500000} />);

      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('shows icon by default', () => {
      render(<CreditBadge credits={50} />);

      // Icon should be present (aria-hidden)
      const button = screen.getByRole('status');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<CreditBadge credits={50} showIcon={false} />);

      const status = screen.getByRole('status');
      expect(status.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Variant Tests
  // ==========================================================================

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<CreditBadge credits={100} />);

      expect(screen.getByRole('status')).toHaveClass('bg-neutral-100');
    });

    it('applies primary variant', () => {
      render(<CreditBadge credits={100} variant="primary" />);

      expect(screen.getByRole('status')).toHaveClass('bg-primary-100');
    });

    it('applies premium variant', () => {
      render(<CreditBadge credits={100} variant="premium" />);

      expect(screen.getByRole('status')).toHaveClass('from-accent-100');
    });

    it('applies danger variant for low credits', () => {
      render(<CreditBadge credits={3} lowThreshold={5} />);

      expect(screen.getByRole('status')).toHaveClass('animate-pulse');
    });

    it('uses custom lowThreshold', () => {
      render(<CreditBadge credits={10} lowThreshold={15} />);

      // Should show danger since 10 < 15
      expect(screen.getByRole('status')).toHaveClass('animate-pulse');
    });
  });

  // ==========================================================================
  // Size Tests
  // ==========================================================================

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<CreditBadge credits={100} size="sm" />);

      expect(screen.getByRole('status')).toHaveClass('text-xs');
    });

    it('renders medium size (default)', () => {
      render(<CreditBadge credits={100} size="md" />);

      expect(screen.getByRole('status')).toHaveClass('text-sm');
    });

    it('renders large size', () => {
      render(<CreditBadge credits={100} size="lg" />);

      expect(screen.getByRole('status')).toHaveClass('text-base');
    });
  });

  // ==========================================================================
  // Tier-based Styling Tests
  // ==========================================================================

  describe('Tier-based Styling', () => {
    it('uses premium styling for premium tier', () => {
      render(<CreditBadge credits={100} tier="premium" />);

      // Premium tier uses gradient styling
      expect(screen.getByRole('status')).toHaveClass('from-accent-100');
    });

    it('uses premium styling for enterprise tier', () => {
      render(<CreditBadge credits={100} tier="enterprise" />);

      // Enterprise tier uses gradient styling
      expect(screen.getByRole('status')).toHaveClass('from-accent-100');
    });

    it('uses default styling for free tier', () => {
      render(<CreditBadge credits={100} tier="free" />);

      expect(screen.getByRole('status')).toHaveClass('bg-neutral-100');
    });
  });

  // ==========================================================================
  // Animation Tests
  // ==========================================================================

  describe('Animations', () => {
    it('shows current credits value', () => {
      render(
        <CreditBadge credits={110} previousCredits={100} animate={false} />
      );

      // With animation disabled, should immediately show the value
      expect(screen.getByText('110')).toBeInTheDocument();
    });

    it('does not animate when animate is false', () => {
      render(<CreditBadge credits={100} previousCredits={50} animate={false} />);

      // Should immediately show new value
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Trend Indicator Tests
  // ==========================================================================

  describe('Trend Indicator', () => {
    it('shows upward trend when credits increased', () => {
      render(<CreditBadge credits={100} previousCredits={50} showTrend />);

      // Should have trending up indicator
      const status = screen.getByRole('status');
      expect(status.querySelector('.text-success-main')).toBeInTheDocument();
    });

    it('shows downward trend when credits decreased', () => {
      render(<CreditBadge credits={50} previousCredits={100} showTrend />);

      // Should have trending down indicator
      const status = screen.getByRole('status');
      expect(status.querySelector('.text-error-main')).toBeInTheDocument();
    });

    it('does not show trend when showTrend is false', () => {
      render(<CreditBadge credits={100} previousCredits={50} showTrend={false} />);

      const status = screen.getByRole('status');
      expect(status.querySelector('.text-success-main')).not.toBeInTheDocument();
    });

    it('does not show trend when no previousCredits', () => {
      render(<CreditBadge credits={100} showTrend />);

      const status = screen.getByRole('status');
      expect(status.querySelector('.text-success-main')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible label', () => {
      render(<CreditBadge credits={100} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '100 credits available'
      );
    });

    it('uses role="status" for screen readers', () => {
      render(<CreditBadge credits={100} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Custom Icon Tests
  // ==========================================================================

  describe('Custom Icon', () => {
    it('renders custom icon when provided', () => {
      const CustomIcon = () => <span data-testid="custom-icon">★</span>;

      render(<CreditBadge credits={100} icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CreditBadgeInline Tests
  // ==========================================================================

  describe('CreditBadgeInline', () => {
    it('renders inline badge with credits', () => {
      render(<CreditBadgeInline credits={50} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('formats large values', () => {
      render(<CreditBadgeInline credits={2000} />);

      expect(screen.getByText('2.0K')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<CreditBadgeInline credits={100} className="custom-class" />);

      // The className should be on the span wrapper
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
