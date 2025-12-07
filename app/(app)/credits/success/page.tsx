'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export default function CreditsSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID provided');
      return;
    }

    // Give webhook time to process, then fetch updated balance
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/credits');
        if (response.ok) {
          const data = await response.json();
          setCredits(data.balance);
          setStatus('success');
        } else {
          // Even if we can't fetch balance, the purchase likely succeeded
          setStatus('success');
        }
      } catch (err) {
        // Still show success - the webhook will process
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Processing your purchase...</h1>
          <p className="text-gray-600">Please wait while we add credits to your account</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error || 'We could not verify your purchase.'}</p>
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lavender-600 text-white rounded-full hover:bg-lavender-700 transition-colors"
          >
            Return to Credits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="relative mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Purchase Successful!
        </h1>

        <p className="text-lg text-gray-600 mb-4">
          Your credits have been added to your account.
        </p>

        {credits !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 inline-block">
            <p className="text-sm text-gray-500 mb-1">Your new balance</p>
            <p className="text-4xl font-bold text-lavender-600">
              {credits.toLocaleString()} <span className="text-xl">credits</span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lavender-500 to-skyblue-500 text-white rounded-full hover:from-lavender-600 hover:to-skyblue-600 transition-all shadow-lg"
          >
            <BookOpen className="h-5 w-5" />
            Create a Story
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          A receipt has been sent to your email.
        </p>
      </div>
    </div>
  );
}
