import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { LimitWarning } from '@/components/subscription/LimitWarning';

// =============================================================================
// LimitWarning Component Tests
// =============================================================================

describe('LimitWarning', () => {
  describe('Visibility', () => {
    it('shows warning when near limit (20% or less remaining)', () => {
      render(
        <LimitWarning
          current={8}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/2 stories remaining/i)).toBeInTheDocument();
    });

    it('shows critical warning when at limit (0 remaining)', () => {
      render(
        <LimitWarning
          current={10}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByText(/limit reached/i)).toBeInTheDocument();
    });

    it('does not show when well under limit (>20% remaining)', () => {
      const { container } = render(
        <LimitWarning
          current={5}
          limit={10}
          type="stories"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows when forceShow prop is true regardless of limit', () => {
      render(
        <LimitWarning
          current={1}
          limit={10}
          type="stories"
          forceShow
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('displays correct remaining count for stories', () => {
      render(
        <LimitWarning
          current={8}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByText(/2 stories remaining/i)).toBeInTheDocument();
    });

    it('displays correct remaining count for premium voices', () => {
      render(
        <LimitWarning
          current={2}
          limit={3}
          type="premium-voices"
          forceShow
        />
      );

      expect(screen.getByText(/1 premium voice remaining/i)).toBeInTheDocument();
    });

    it('displays plural form correctly', () => {
      render(
        <LimitWarning
          current={7}
          limit={10}
          type="stories"
          forceShow
        />
      );

      expect(screen.getByText(/3 stories remaining/i)).toBeInTheDocument();
    });

    it('displays singular form when 1 remaining', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByText(/1 story remaining/i)).toBeInTheDocument();
    });
  });

  describe('Upgrade CTA', () => {
    it('displays upgrade CTA', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByRole('link', { name: /upgrade/i })).toBeInTheDocument();
    });

    it('upgrade link points to pricing page', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toHaveAttribute('href', '/pricing');
    });

    it('calls onUpgradeClick when provided', async () => {
      const user = userEvent.setup();
      const onUpgradeClick = vi.fn();

      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
          onUpgradeClick={onUpgradeClick}
        />
      );

      await user.click(screen.getByRole('link', { name: /upgrade/i }));
      expect(onUpgradeClick).toHaveBeenCalled();
    });
  });

  describe('Dismiss', () => {
    it('is dismissible by default', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('hides when dismiss button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      await user.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls onDismiss callback when dismissed', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
          onDismiss={onDismiss}
        />
      );

      await user.click(screen.getByRole('button', { name: /dismiss/i }));
      expect(onDismiss).toHaveBeenCalled();
    });

    it('can be non-dismissible', () => {
      render(
        <LimitWarning
          current={10}
          limit={10}
          type="stories"
          dismissible={false}
        />
      );

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('shows warning variant when near limit', () => {
      render(
        <LimitWarning
          current={8}
          limit={10}
          type="stories"
        />
      );

      // Warning variant should have amber/yellow styling
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-warning-light');
    });

    it('shows critical variant when at limit', () => {
      render(
        <LimitWarning
          current={10}
          limit={10}
          type="stories"
        />
      );

      // Critical variant should have red styling
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-error-light');
    });
  });

  describe('Accessibility', () => {
    it('has role="alert"', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('dismiss button has accessible aria-label', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
        />
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toHaveAttribute(
        'aria-label',
        expect.stringMatching(/dismiss/i)
      );
    });
  });

  describe('Custom Props', () => {
    it('accepts custom threshold percentage', () => {
      // With 50% threshold, should show when at 50% or less remaining
      render(
        <LimitWarning
          current={5}
          limit={10}
          type="stories"
          threshold={0.5}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('accepts custom message', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
          message="Custom warning message"
        />
      );

      expect(screen.getByText('Custom warning message')).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(
        <LimitWarning
          current={9}
          limit={10}
          type="stories"
          className="custom-class"
        />
      );

      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });
  });
});
