'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mic,
  Image as ImageIcon,
  Moon,
  Lock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_STORY, DEMO_PLACEHOLDER_IMAGES, DEMO_FEATURES } from '@/lib/demo/demo-story';

// =============================================================================
// Demo Story Viewer Component
// =============================================================================

export function DemoStoryViewer() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const story = DEMO_STORY;
  const pages = story.pages;
  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // Show signup prompt at end of story
      setShowSignupPrompt(true);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentPageData = pages[currentPage];
  const isLastPage = currentPage === totalPages - 1;

  const iconMap = {
    sparkles: Sparkles,
    mic: Mic,
    image: ImageIcon,
    moon: Moon,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amari-cream to-amari-sand/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-amari-sand bg-amari-cream/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amari-terracotta" />
            <span className="font-display text-xl font-semibold text-amari-charcoal">
              Amari
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-amari-muted hidden sm:block">
              Like what you see?
            </span>
            <Link href="/sign-up">
              <Button className="bg-amari-terracotta hover:bg-amari-terracotta/90 text-white">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Story Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amari-sage/20 text-amari-sage text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Demo Story
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-amari-charcoal mb-2">
            {story.title}
          </h1>
          <p className="text-amari-muted">
            A {story.tone.replace('-', ' ')} story for ages {story.ageGroup} · {story.readingTime} read
          </p>
        </div>

        {/* Story Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-amari-sand overflow-hidden">
          {/* Page Illustration */}
          <div
            className="h-64 sm:h-80 relative"
            style={{
              background: DEMO_PLACEHOLDER_IMAGES[currentPageData.pageNumber],
            }}
          >
            {/* Subtle gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

            {/* Page indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentPage
                      ? 'bg-white w-6 shadow-lg'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Story Text */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-lg sm:text-xl text-amari-charcoal leading-relaxed whitespace-pre-line font-serif">
                  {currentPageData.text}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Page Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-amari-sand">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="border-amari-sand hover:bg-amari-sand/50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-amari-muted">
                Page {currentPage + 1} of {totalPages}
              </span>

              <Button
                onClick={nextPage}
                className="bg-amari-terracotta hover:bg-amari-terracotta/90 text-white"
              >
                {isLastPage ? 'Finish' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Audio Teaser (Locked) */}
        <div className="mt-8 bg-white rounded-xl border border-amari-sand p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amari-rose/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amari-rose" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amari-charcoal">
                Listen to this story
              </h3>
              <p className="text-sm text-amari-muted">
                Sign up to unlock professional narration with premium voices
              </p>
            </div>
            <Link href="/sign-up">
              <Button variant="outline" className="border-amari-terracotta text-amari-terracotta hover:bg-amari-terracotta/10">
                Unlock Audio
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          {DEMO_FEATURES.map((feature, idx) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-amari-sand p-5 flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-amari-sage/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-amari-sage" />
                </div>
                <div>
                  <h4 className="font-semibold text-amari-charcoal">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-amari-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-amari-terracotta to-amari-rose rounded-2xl p-8 text-white">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Create magical stories for your child
          </h2>
          <p className="text-white/90 mb-6 max-w-md mx-auto">
            Start your free 14-day trial and create personalized bedtime stories that your little one will love.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-amari-terracotta hover:bg-white/90">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-white/70 mt-4">
            No credit card required
          </p>
        </div>
      </main>

      {/* Signup Modal after finishing story */}
      <AnimatePresence>
        {showSignupPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSignupPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 w-16 bg-amari-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-amari-sage" />
              </div>
              <h3 className="font-display text-2xl font-bold text-amari-charcoal mb-2">
                The End!
              </h3>
              <p className="text-amari-muted mb-6">
                Loved this story? Create unlimited personalized stories for your child with names, interests, and themes they'll adore.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="w-full bg-amari-terracotta hover:bg-amari-terracotta/90 text-white mb-3">
                  Start Your Free Trial
                </Button>
              </Link>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="text-sm text-amari-muted hover:text-amari-charcoal"
              >
                Read again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
