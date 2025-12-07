'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, Sparkles, BookOpen, Settings } from 'lucide-react';

const tierNames: Record<string, string> = {
  dream_weaver: 'Dream Weaver',
  magic_circle: 'Magic Circle',
  enchanted_library: 'Enchanted Library',
};

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [subscription, setSubscription] = useState<{
    tier: string;
    stories_remaining: number;
    premium_voices_remaining: number;
    current_period_end: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Wait for webhook to process, then fetch subscription
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
          setStatus('success');
        } else {
          // Even if we can't fetch, the subscription likely succeeded
          setStatus('success');
        }
      } catch (err) {
        setStatus('success');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lavender-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Activating your subscription...
          </h1>
          <p className="text-gray-600">Please wait while we set everything up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="relative mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to {subscription?.tier ? tierNames[subscription.tier] : 'Amari'}!
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Your subscription is now active. Time to create magical stories!
        </p>

        {subscription && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-lavender-600">
                  {subscription.stories_remaining}
                </p>
                <p className="text-sm text-gray-500">Stories Available</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-skyblue-600">
                  {subscription.premium_voices_remaining}
                </p>
                <p className="text-sm text-gray-500">Premium Voices</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Your subscription renews on{' '}
                <span className="font-medium text-gray-700">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lavender-500 to-skyblue-500 text-white rounded-full hover:from-lavender-600 hover:to-skyblue-600 transition-all shadow-lg"
          >
            <BookOpen className="h-5 w-5" />
            Create Your First Story
          </Link>

          <Link
            href="/settings/subscription"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Settings className="h-5 w-5" />
            Manage Subscription
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          A confirmation email has been sent to your inbox.
        </p>
      </div>
    </div>
  );
}
