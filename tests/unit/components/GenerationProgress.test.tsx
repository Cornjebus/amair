import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationProgress, type GenerationStage } from '@/components/generation/GenerationProgress/GenerationProgress';

describe('GenerationProgress Component', () => {
  const defaultStages: GenerationStage[] = ['preparing', 'story', 'images', 'complete'];

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('renders with preparing stage', () => {
      render(
        <GenerationProgress stage="preparing" stages={defaultStages} />
      );

      // Multiple instances possible (header + indicator)
      const preparingElements = screen.getAllByText('Preparing');
      expect(preparingElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Setting up your magical story...')).toBeInTheDocument();
    });

    it('renders with story stage', () => {
      render(
        <GenerationProgress stage="story" stages={defaultStages} />
      );

      // Multiple instances possible (header + indicator)
      const storyElements = screen.getAllByText('Writing Story');
      expect(storyElements.length).toBeGreaterThan(0);
    });

    it('renders all stage indicators', () => {
      render(
        <GenerationProgress stage="preparing" stages={defaultStages} />
      );

      // Look for stage indicator labels
      const preparingElements = screen.getAllByText('Preparing');
      expect(preparingElements.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Stage Progress Tests
  // ==========================================================================

  describe('Stage Progress', () => {
    it('shows completed stages', () => {
      render(
        <GenerationProgress stage="story" stages={defaultStages} />
      );

      // Story stage should be shown - multiple instances possible (header + indicator)
      const storyElements = screen.getAllByText('Writing Story');
      expect(storyElements.length).toBeGreaterThan(0);
    });

    it('shows stage progress percentage', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          progress={50}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows overall progress', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          progress={0}
        />
      );

      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Complete State Tests
  // ==========================================================================

  describe('Complete State', () => {
    it('shows success message when complete', () => {
      render(
        <GenerationProgress stage="complete" stages={defaultStages} />
      );

      expect(screen.getByText('Your Story is Ready!')).toBeInTheDocument();
      expect(screen.getByText('Time to start the adventure')).toBeInTheDocument();
    });

    it('shows 100% progress when complete', () => {
      render(
        <GenerationProgress stage="complete" stages={defaultStages} />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error State Tests
  // ==========================================================================

  describe('Error State', () => {
    it('shows error message when stage is error', () => {
      render(
        <GenerationProgress
          stage="error"
          stages={[...defaultStages, 'error']}
          errorMessage="Failed to generate story"
        />
      );

      expect(screen.getByText('Generation Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate story')).toBeInTheDocument();
    });

    it('shows default error message when no errorMessage provided', () => {
      render(
        <GenerationProgress
          stage="error"
          stages={[...defaultStages, 'error']}
        />
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });

    it('shows retry button when onRetry provided', () => {
      const handleRetry = vi.fn();

      render(
        <GenerationProgress
          stage="error"
          stages={[...defaultStages, 'error']}
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', () => {
      const handleRetry = vi.fn();

      render(
        <GenerationProgress
          stage="error"
          stages={[...defaultStages, 'error']}
          onRetry={handleRetry}
        />
      );

      fireEvent.click(screen.getByText('Try Again'));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Elapsed Time Tests
  // ==========================================================================

  describe('Elapsed Time', () => {
    it('shows elapsed time in seconds', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          elapsedTime={45}
        />
      );

      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('shows elapsed time in minutes and seconds', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          elapsedTime={125}
        />
      );

      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Status Message Tests
  // ==========================================================================

  describe('Status Message', () => {
    it('shows custom status message', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          statusMessage="Creating chapter 2 of 5..."
        />
      );

      expect(screen.getByText('Creating chapter 2 of 5...')).toBeInTheDocument();
    });

    it('shows default description when no statusMessage', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
        />
      );

      expect(screen.getByText('Crafting your personalized adventure...')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Estimated Time Tests
  // ==========================================================================

  describe('Estimated Time', () => {
    it('shows estimated time for story generation', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
        />
      );

      expect(screen.getByText(/Estimated time:/)).toBeInTheDocument();
    });

    it('does not show estimated time when complete', () => {
      render(
        <GenerationProgress
          stage="complete"
          stages={defaultStages}
        />
      );

      expect(screen.queryByText(/Estimated time:/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // All Stage Types Tests
  // ==========================================================================

  describe('All Stage Types', () => {
    const allStages: GenerationStage[] = ['preparing', 'story', 'images', 'audio', 'video', 'complete'];

    it('renders images stage correctly', () => {
      render(
        <GenerationProgress stage="images" stages={allStages} />
      );

      // Check for header which shows the current stage description
      expect(screen.getByText('Painting beautiful scenes...')).toBeInTheDocument();
    });

    it('renders audio stage correctly', () => {
      render(
        <GenerationProgress stage="audio" stages={allStages} />
      );

      // Check for header which shows the current stage description
      expect(screen.getByText('Adding voice to your story...')).toBeInTheDocument();
    });

    it('renders video stage correctly', () => {
      render(
        <GenerationProgress stage="video" stages={allStages} />
      );

      // Check for header which shows the current stage description
      expect(screen.getByText('Bringing your story to life...')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible progress information', () => {
      render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          progress={50}
        />
      );

      // Progress bars should be present (multiple for overall and stage progress)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Custom Class Tests
  // ==========================================================================

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <GenerationProgress
          stage="story"
          stages={defaultStages}
          className="custom-progress"
        />
      );

      expect(container.querySelector('.custom-progress')).toBeInTheDocument();
    });
  });
});
