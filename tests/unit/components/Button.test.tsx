import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button/Button';
import { Sparkles } from 'lucide-react';

describe('Button Component', () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-500'); // primary variant
    });

    it('renders children correctly', () => {
      render(<Button>Test Content</Button>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  // ==========================================================================
  // Variant Tests
  // ==========================================================================

  describe('Variants', () => {
    it('renders primary variant', () => {
      render(<Button variant="primary">Primary</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-secondary-500');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      expect(screen.getByRole('button')).toHaveClass('border-primary-500');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      expect(screen.getByRole('button')).toHaveClass('hover:bg-neutral-100');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-error-main');
    });

    it('renders success variant', () => {
      render(<Button variant="success">Success</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-success-main');
    });

    it('renders premium variant with gradient', () => {
      render(<Button variant="premium">Premium</Button>);

      expect(screen.getByRole('button')).toHaveClass('bg-gradient-to-r');
    });
  });

  // ==========================================================================
  // Size Tests
  // ==========================================================================

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);

      expect(screen.getByRole('button')).toHaveClass('h-8');
    });

    it('renders medium size (default)', () => {
      render(<Button size="md">Medium</Button>);

      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);

      expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('renders extra large size', () => {
      render(<Button size="xl">Extra Large</Button>);

      expect(screen.getByRole('button')).toHaveClass('h-14');
    });

    it('renders icon size', () => {
      render(<Button size="icon"><Sparkles /></Button>);

      expect(screen.getByRole('button')).toHaveClass('h-10');
      expect(screen.getByRole('button')).toHaveClass('p-0');
    });
  });

  // ==========================================================================
  // Interaction Tests
  // ==========================================================================

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Click</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is focusable by default', () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);

      // Loading spinner should be present
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loadingText when provided', () => {
      render(<Button isLoading loadingText="Please wait...">Submit</Button>);

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button isLoading>Submit</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Submit</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Icon Tests
  // ==========================================================================

  describe('Icons', () => {
    it('renders left icon', () => {
      render(
        <Button leftIcon={<Sparkles data-testid="left-icon" />}>
          With Icon
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(
        <Button rightIcon={<Sparkles data-testid="right-icon" />}>
          With Icon
        </Button>
      );

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders both icons', () => {
      render(
        <Button
          leftIcon={<Sparkles data-testid="left-icon" />}
          rightIcon={<Sparkles data-testid="right-icon" />}
        >
          Both Icons
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      render(
        <Button
          isLoading
          leftIcon={<Sparkles data-testid="left-icon" />}
        >
          Loading
        </Button>
      );

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Full Width Tests
  // ==========================================================================

  describe('Full Width', () => {
    it('renders full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('does not render full width by default', () => {
      render(<Button>Not Full Width</Button>);

      expect(screen.getByRole('button')).toHaveClass('w-auto');
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible name from children', () => {
      render(<Button>Accessible Button</Button>);

      expect(screen.getByRole('button', { name: /accessible button/i })).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);

      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });

    it('indicates disabled state', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('indicates busy state when loading', () => {
      render(<Button isLoading>Loading</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ==========================================================================
  // asChild (Slot) Tests
  // ==========================================================================

  describe('asChild Behavior', () => {
    it('renders as a different element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });
});
