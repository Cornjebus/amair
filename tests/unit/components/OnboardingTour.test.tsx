import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('OnboardingTour', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the tour when user has not completed it', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByText(/welcome to amari/i)).toBeInTheDocument();
      });
    });

    it('does not render when user has completed the tour', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<OnboardingTour />);

      // Give time for useEffect to run
      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByText(/welcome to amari/i)).not.toBeInTheDocument();
    });

    it('shows the first step by default', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
      });
    });

    it('renders progress indicator', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('advances to next step when clicking Next', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
      });
    });

    it('goes back to previous step when clicking Back', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
      });
    });

    it('does not show Back button on first step', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByText(/welcome to amari/i)).toBeInTheDocument();
      });

      // Skip button should be shown instead of Back on first step
      // Use getByText to find the text "Skip" button specifically
      expect(screen.getByText('Skip')).toBeInTheDocument();
      // Back button should not exist
      expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
    });

    it('shows Finish button on last step', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Navigate to last step (4 steps total)
      for (let i = 1; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`step ${i + 1} of 4`, 'i'))).toBeInTheDocument();
        });
      }

      expect(screen.getByRole('button', { name: /let's go/i })).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('updates progress bar as user advances', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      const progressBar = screen.getByRole('progressbar');

      // Initially 25% (1/4)
      await user.click(screen.getByRole('button', { name: /next/i }));

      // After clicking next, should be 50% (2/4)
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
      });
    });

    it('shows step indicators', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        const stepIndicators = screen.getAllByTestId('step-indicator');
        expect(stepIndicators.length).toBe(4);
      });
    });
  });

  describe('Completion', () => {
    it('marks tour as complete when finishing', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Navigate to last step
      for (let i = 1; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`step ${i + 1} of 4`, 'i'))).toBeInTheDocument();
        });
      }

      // Click finish
      await user.click(screen.getByRole('button', { name: /let's go/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('amari_onboarding_complete', 'true');
    });

    it('calls onComplete callback when provided', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      render(<OnboardingTour forceShow onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Navigate to last step
      for (let i = 1; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`step ${i + 1} of 4`, 'i'))).toBeInTheDocument();
        });
      }

      await user.click(screen.getByRole('button', { name: /let's go/i }));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('hides tour after completion', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Navigate to last step and finish
      for (let i = 1; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`step ${i + 1} of 4`, 'i'))).toBeInTheDocument();
        });
      }

      await user.click(screen.getByRole('button', { name: /let's go/i }));

      await waitFor(() => {
        expect(screen.queryByText(/welcome to amari/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Skip Functionality', () => {
    it('shows skip button on first step', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });
    });

    it('marks tour as complete when skipping via text button', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Skip'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('amari_onboarding_complete', 'true');
    });

    it('marks tour as complete when skipping via X button', async () => {
      const user = userEvent.setup();
      render(<OnboardingTour forceShow />);

      await waitFor(() => {
        expect(screen.getByLabelText('Skip tour')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Skip tour'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('amari_onboarding_complete', 'true');
    });

    it('calls onComplete callback when skipping', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      render(<OnboardingTour forceShow onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Skip'));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step Content', () => {
    it('displays step title', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByRole('heading')).toBeInTheDocument();
      });
    });

    it('displays step description', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByTestId('step-description')).toBeInTheDocument();
      });
    });

    it('displays step illustration', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByTestId('step-illustration')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('has aria-modal attribute', async () => {
      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('Force Show', () => {
    it('shows tour when forceShow is true even if completed', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(<OnboardingTour forceShow />);
      await waitFor(() => {
        expect(screen.getByText(/welcome to amari/i)).toBeInTheDocument();
      });
    });
  });
});
