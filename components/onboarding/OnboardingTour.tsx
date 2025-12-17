'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, Mic, Heart } from 'lucide-react';

interface OnboardingTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  illustration: string; // gradient for illustration
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: 'Welcome to Amari!',
    description: 'Create magical, personalized bedtime stories your children will love. Let\'s show you around!',
    icon: Sparkles,
    illustration: 'from-amari-terracotta/20 via-amari-rose/30 to-amari-sage/20',
  },
  {
    id: 2,
    title: 'Pick Favorite Things',
    description: 'Your child chooses objects, animals, places, or feelings. These become the building blocks of their unique story.',
    icon: Heart,
    illustration: 'from-pink-200 via-rose-200 to-red-100',
  },
  {
    id: 3,
    title: 'Choose Story Settings',
    description: 'Select the mood (calm, funny, adventure) and length (quick, medium, epic). Every combination creates something different!',
    icon: BookOpen,
    illustration: 'from-blue-200 via-indigo-200 to-purple-100',
  },
  {
    id: 4,
    title: 'Listen Together',
    description: 'Stories come alive with beautiful narration. Premium voices make bedtime even more magical.',
    icon: Mic,
    illustration: 'from-green-200 via-emerald-200 to-teal-100',
  },
];

const STORAGE_KEY = 'amari_onboarding_complete';

export function OnboardingTour({ onComplete, forceShow = false }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 bg-gray-100"
          >
            <motion.div
              className="h-full bg-amari-terracotta"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 pt-6 pb-2">
            {TOUR_STEPS.map((s, index) => (
              <div
                key={s.id}
                data-testid="step-indicator"
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-amari-terracotta'
                    : index < currentStep
                    ? 'bg-amari-sage'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-8 py-6"
            >
              {/* Illustration */}
              <div
                data-testid="step-illustration"
                className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.illustration} flex items-center justify-center`}
              >
                <Icon className="h-12 w-12 text-amari-charcoal/70" />
              </div>

              {/* Step Counter */}
              <p className="text-sm text-amari-muted text-center mb-2">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>

              {/* Title */}
              <h2
                id="tour-title"
                className="text-2xl font-display font-semibold text-amari-charcoal text-center mb-3"
              >
                {step.title}
              </h2>

              {/* Description */}
              <p
                data-testid="step-description"
                className="text-amari-muted text-center leading-relaxed"
              >
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="px-8 pb-8 flex items-center justify-between">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack} aria-label="Back">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip} className="text-amari-muted">
                Skip
              </Button>
            )}

            <Button onClick={handleNext} aria-label={isLastStep ? "Let's Go!" : 'Next'}>
              {isLastStep ? (
                <>
                  Let's Go!
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
