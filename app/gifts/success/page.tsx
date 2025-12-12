'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Loader2,
  Gift,
  Copy,
  Mail,
  Heart,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function GiftSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [giftDetails, setGiftDetails] = useState<{
    redemptionCode: string;
    packageName: string;
    tier: string;
    durationMonths: number;
    recipientEmail?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // In a real app, we'd fetch the gift details from the session
    const timer = setTimeout(() => {
      setGiftDetails({
        redemptionCode: 'GIFT-XXXX-XXXX-XXXX',
        packageName: 'Gift Subscription',
        tier: 'dream_weaver',
        durationMonths: 3,
      });
      setStatus('success');
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  const copyCode = async () => {
    if (giftDetails?.redemptionCode) {
      await navigator.clipboard.writeText(giftDetails.redemptionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareGift = () => {
    const redeemUrl = `${window.location.origin}/gifts/redeem?code=${giftDetails?.redemptionCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'A Gift for You - Amari Story Subscription',
        text: `I got you a gift! Use this code to redeem your Amari subscription: ${giftDetails?.redemptionCode}`,
        url: redeemUrl,
      });
    } else {
      navigator.clipboard.writeText(redeemUrl);
      alert('Gift link copied to clipboard!');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amari-cream">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amari-terracotta mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
            Preparing your gift...
          </h1>
          <p className="text-amari-muted">Just a moment while we wrap things up</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amari-cream">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
            Something went wrong
          </h1>
          <p className="text-amari-muted mb-6">
            We couldn't load your gift details. Please check your email for the gift code.
          </p>
          <Link href="/gifts">
            <Button>Return to Gifts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amari-cream py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <CheckCircle className="h-20 w-20 text-amari-sage" />
            <Heart className="h-6 w-6 text-amari-rose absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-3xl font-display font-semibold text-amari-charcoal mt-4 mb-2">
            Gift Purchase Complete!
          </h1>
          <p className="text-lg text-amari-muted">
            Your gift is ready to share. Here's the redemption code:
          </p>
        </div>

        {/* Gift Code Card */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="bg-amari-rose/20 rounded-xl p-6 text-center mb-6">
              <p className="text-sm text-amari-muted mb-2">Gift Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-mono font-bold text-amari-charcoal tracking-wider">
                  {giftDetails?.redemptionCode}
                </p>
                <button
                  onClick={copyCode}
                  className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  title="Copy code"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5 text-amari-sage" />
                  ) : (
                    <Copy className="h-5 w-5 text-amari-muted" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-amari-sage mt-2">Copied to clipboard!</p>
              )}
            </div>

            {/* Gift Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-amari-sand">
                <span className="text-amari-muted">Gift Package</span>
                <span className="font-medium text-amari-charcoal">{giftDetails?.packageName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-amari-sand">
                <span className="text-amari-muted">Duration</span>
                <span className="font-medium text-amari-charcoal">{giftDetails?.durationMonths} months</span>
              </div>
              {giftDetails?.recipientEmail && (
                <div className="flex justify-between py-2 border-b border-amari-sand">
                  <span className="text-amari-muted">Sent to</span>
                  <span className="font-medium text-amari-charcoal">{giftDetails.recipientEmail}</span>
                </div>
              )}
            </div>

            {/* Share Options */}
            <div className="flex gap-3">
              <Button
                onClick={shareGift}
                className="flex-1"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Gift
              </Button>
              <a
                href={`mailto:?subject=A Gift for You - Amari Stories&body=I got you a gift! Use this code to redeem your Amari subscription: ${giftDetails?.redemptionCode}%0A%0ARedeem here: ${window.location.origin}/gifts/redeem?code=${giftDetails?.redemptionCode}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Code
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-amari-sage/10 border-amari-sage/20">
          <CardContent className="pt-6">
            <h2 className="font-display font-semibold text-amari-charcoal mb-3">What happens next?</h2>
            <ul className="space-y-2 text-sm text-amari-muted">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amari-sage mt-0.5" />
                <span>We've sent the gift code to your email as a backup</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amari-sage mt-0.5" />
                <span>Share the code with your recipient via text, email, or card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amari-sage mt-0.5" />
                <span>
                  They can redeem at{' '}
                  <Link href="/gifts/redeem" className="text-amari-terracotta hover:underline">
                    amari.com/gifts/redeem
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amari-sage mt-0.5" />
                <span>The gift code is valid for 1 year from today</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/gifts">
            <Button variant="ghost">
              Buy Another Gift
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
