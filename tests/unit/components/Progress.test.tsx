import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CircularProgress,
  StepProgress,
  Spinner,
  AnimatedProgress,
} from '@/components/ui/enhanced-progress';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    circle: (props: any) => <circle {...props} />,
  },
}));

import { vi } from 'vitest';

describe('Progress Components', () => {
  describe('CircularProgress', () => {
    it('renders with default props', () => {
      render(<CircularProgress value={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      render(<CircularProgress value={75} max={100} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('handles custom max value', () => {
      render(<CircularProgress value={5} max={10} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('clamps value to 0-100 range', () => {
      render(<CircularProgress value={150} max={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('hides value when showValue is false', () => {
      render(<CircularProgress value={50} showValue={false} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('renders SVG circles', () => {
      const { container } = render(<CircularProgress value={50} />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2); // Background and progress circles
    });

    it('applies custom size', () => {
      const { container } = render(<CircularProgress value={50} size={100} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });
  });

  describe('StepProgress', () => {
    it('renders correct number of steps', () => {
      const { container } = render(<StepProgress currentStep={2} totalSteps={4} />);
      const steps = container.querySelectorAll('.rounded-full');
      expect(steps.length).toBe(4);
    });

    it('marks completed steps', () => {
      const { container } = render(<StepProgress currentStep={3} totalSteps={4} />);
      // Steps 1 and 2 should be completed (have checkmark)
      const checkmarks = container.querySelectorAll('svg.h-4');
      expect(checkmarks.length).toBe(2);
    });

    it('highlights current step', () => {
      const { container } = render(<StepProgress currentStep={2} totalSteps={4} />);
      const currentStep = container.querySelector('.bg-amari-terracotta');
      expect(currentStep).toBeInTheDocument();
    });

    it('renders labels when provided', () => {
      const labels = ['Start', 'Middle', 'End'];
      render(<StepProgress currentStep={1} totalSteps={3} labels={labels} />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('renders connector lines between steps', () => {
      const { container } = render(<StepProgress currentStep={2} totalSteps={4} />);
      // Should have 3 connector lines for 4 steps
      const connectors = container.querySelectorAll('.h-0\\.5');
      expect(connectors.length).toBe(3);
    });
  });

  describe('Spinner', () => {
    it('renders with default md size', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('h-6');
      expect(spinner).toHaveClass('w-6');
    });

    it('renders sm size', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('h-4');
      expect(spinner).toHaveClass('w-4');
    });

    it('renders lg size', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('h-8');
      expect(spinner).toHaveClass('w-8');
    });

    it('has spin animation', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('uses amari-terracotta color', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('text-amari-terracotta');
    });

    it('accepts custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('custom-spinner');
    });
  });

  describe('AnimatedProgress', () => {
    it('renders with progressbar role', () => {
      render(<AnimatedProgress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('sets correct aria values', () => {
      render(<AnimatedProgress value={30} max={100} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '30');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows label when enabled', () => {
      render(<AnimatedProgress value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('hides label by default', () => {
      render(<AnimatedProgress value={75} />);
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('applies size classes correctly', () => {
      const { container } = render(<AnimatedProgress value={50} size="lg" />);
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveClass('h-4');
    });

    it('applies variant colors correctly', () => {
      const { container } = render(<AnimatedProgress value={50} variant="success" />);
      const indicator = container.querySelector('.bg-amari-sage');
      expect(indicator).toBeInTheDocument();
    });
  });
});

describe('Progress Accessibility', () => {
  it('AnimatedProgress has correct ARIA attributes', () => {
    render(<AnimatedProgress value={60} max={100} />);
    const progressbar = screen.getByRole('progressbar');

    expect(progressbar).toHaveAttribute('aria-valuenow', '60');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });
});
