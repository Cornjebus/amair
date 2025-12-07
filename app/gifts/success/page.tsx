'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Loader2,
  Gift,
  Copy,
  Mail,
  Heart,
  Share2,
} from 'lucide-react';

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
    // For now, simulate loading and show a placeholder
    const timer = setTimeout(() => {
      // This would normally come from the API
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
      // Fallback: copy link
      navigator.clipboard.writeText(redeemUrl);
      alert('Gift link copied to clipboard!');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-peach-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-peach-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Preparing your gift...
          </h1>
          <p className="text-gray-600">Just a moment while we wrap things up</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-peach-50 to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full p-4 w-fit mx-auto mb-4">
            <Gift className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't load your gift details. Please check your email for the gift code.
          </p>
          <Link
            href="/gifts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-peach-500 text-white rounded-full hover:bg-peach-600"
          >
            Return to Gifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-50 via-white to-mint-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <CheckCircle className="h-20 w-20 text-green-500" />
            <Heart className="h-6 w-6 text-pink-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Gift Purchase Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Your gift is ready to share. Here's the redemption code:
          </p>
        </div>

        {/* Gift Code Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="bg-gradient-to-r from-peach-100 to-pink-100 rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Gift Code</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                {giftDetails?.redemptionCode}
              </p>
              <button
                onClick={copyCode}
                className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                title="Copy code"
              >
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-2">Copied to clipboard!</p>
            )}
          </div>

          {/* Gift Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Gift Package</span>
              <span className="font-medium">{giftDetails?.packageName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{giftDetails?.durationMonths} months</span>
            </div>
            {giftDetails?.recipientEmail && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Sent to</span>
                <span className="font-medium">{giftDetails.recipientEmail}</span>
              </div>
            )}
          </div>

          {/* Share Options */}
          <div className="flex gap-3">
            <button
              onClick={shareGift}
              className="flex-1 py-3 px-4 bg-peach-500 text-white rounded-xl font-semibold hover:bg-peach-600 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Share Gift
            </button>
            <a
              href={`mailto:?subject=A Gift for You - Amari Stories&body=I got you a gift! Use this code to redeem your Amari subscription: ${giftDetails?.redemptionCode}%0A%0ARedeem here: ${window.location.origin}/gifts/redeem?code=${giftDetails?.redemptionCode}`}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Email Code
            </a>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-mint-50 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-mint-600 mt-0.5" />
              <span>We've sent the gift code to your email as a backup</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-mint-600 mt-0.5" />
              <span>Share the code with your recipient via text, email, or card</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-mint-600 mt-0.5" />
              <span>
                They can redeem at{' '}
                <Link href="/gifts/redeem" className="text-lavender-600 hover:underline">
                  amari.com/gifts/redeem
                </Link>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-mint-600 mt-0.5" />
              <span>The gift code is valid for 1 year from today</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/gifts"
            className="px-6 py-3 text-gray-600 hover:text-gray-900"
          >
            Buy Another Gift
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-lavender-600 text-white rounded-full hover:bg-lavender-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
