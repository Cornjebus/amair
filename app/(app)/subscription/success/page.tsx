'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogoInline } from '@/components/ui/Logo';
import { CheckCircle, Loader2, Sparkles, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    storiesRemaining: number;
    premiumVoicesRemaining: number;
    currentPeriodEnd: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Sync subscription from Stripe (fallback for webhook failures)
    async function syncAndFetch() {
      try {
        // First, try to sync from Stripe (handles webhook failures)
        const syncResponse = await fetch('/api/subscriptions/sync', {
          method: 'POST',
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          if (syncData.tier && syncData.tier !== 'free') {
            setSubscription(syncData);
            setStatus('success');
            return;
          }
        }

        // Fall back to fetching existing subscription
        const response = await fetch('/api/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
        setStatus('success');
      } catch (err) {
        console.error('Error syncing subscription:', err);
        setStatus('success');
      }
    }

    // Wait a moment for webhook to potentially process first
    const timer = setTimeout(syncAndFetch, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amari-cream">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <LogoInline size="lg" className="animate-pulse" />
          </div>
          <Loader2 className="h-12 w-12 animate-spin text-amari-terracotta mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
            Activating your subscription...
          </h1>
          <p className="text-amari-muted">Please wait while we set everything up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amari-cream py-12 px-4">
      <div className="text-center max-w-lg mx-auto">
        <div className="relative mb-6">
          <CheckCircle className="h-20 w-20 text-amari-sage mx-auto" />
          <Sparkles className="h-6 w-6 text-amari-terracotta absolute top-0 right-1/3 animate-pulse" />
        </div>

        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Welcome to {subscription?.tier ? tierNames[subscription.tier] : 'Amari'}!
        </h1>

        <p className="text-lg text-amari-muted mb-6">
          Your subscription is now active. Time to create magical stories!
        </p>

        {subscription && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-display font-semibold text-amari-terracotta">
                    {subscription.storiesRemaining}
                  </p>
                  <p className="text-sm text-amari-muted">Stories Available</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-semibold text-amari-sage">
                    {subscription.premiumVoicesRemaining}
                  </p>
                  <p className="text-sm text-amari-muted">Premium Voices</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-amari-sand">
                <p className="text-sm text-amari-muted">
                  Your subscription renews on{' '}
                  <span className="font-medium text-amari-charcoal">
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create">
            <Button size="lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Create Your First Story
            </Button>
          </Link>

          <Link href="/settings/subscription">
            <Button variant="outline" size="lg">
              <Settings className="mr-2 h-5 w-5" />
              Manage Subscription
            </Button>
          </Link>
        </div>

        <p className="text-sm text-amari-muted mt-8">
          A confirmation email has been sent to your inbox.
        </p>
      </div>
    </div>
  );
}
