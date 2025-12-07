'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Gift,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface GiftValidation {
  valid: boolean;
  error?: string;
  tier?: string;
  tierName?: string;
  durationMonths?: number;
  packageName?: string;
  message?: string;
  fromName?: string;
}

interface RedemptionResult {
  success: boolean;
  error?: string;
  tier?: string;
  durationMonths?: number;
  newPeriodEnd?: string;
  message?: string;
}

const tierNames: Record<string, string> = {
  dream_weaver: 'Dream Weaver',
  magic_circle: 'Magic Circle',
  enchanted_library: 'Enchanted Library',
};

export default function RedeemGiftPage() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validation, setValidation] = useState<GiftValidation | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for code in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      validateCode(urlCode);
    }
  }, [searchParams]);

  const formatCode = (input: string) => {
    // Remove everything except alphanumeric
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Format as GIFT-XXXX-XXXX-XXXX
    if (cleaned.startsWith('GIFT')) {
      const rest = cleaned.slice(4);
      const parts = rest.match(/.{1,4}/g) || [];
      return 'GIFT-' + parts.slice(0, 3).join('-');
    } else {
      const parts = cleaned.match(/.{1,4}/g) || [];
      if (parts[0] === 'GIFT') {
        return parts.slice(0, 4).join('-');
      }
      return cleaned;
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setValidation(null);
    setRedemptionResult(null);
  };

  const validateCode = async (codeToValidate?: string) => {
    const targetCode = codeToValidate || code;
    if (!targetCode || targetCode.length < 19) return;

    setIsValidating(true);
    setValidation(null);

    try {
      const response = await fetch(`/api/gifts/redeem?code=${encodeURIComponent(targetCode)}`);
      const data = await response.json();
      setValidation(data);
    } catch (error) {
      setValidation({ valid: false, error: 'Failed to validate code' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!isSignedIn) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect=/gifts/redeem?code=${encodeURIComponent(code)}`);
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setRedemptionResult(data);

      if (data.success) {
        // Wait a bit then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error) {
      setRedemptionResult({ success: false, error: 'Failed to redeem gift code' });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (redemptionResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mint-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Gift Redeemed!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            You now have {redemptionResult.durationMonths} months of{' '}
            {tierNames[redemptionResult.tier || ''] || redemptionResult.tier}!
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <p className="text-sm text-gray-500 mb-1">Your subscription is active until</p>
            <p className="text-xl font-bold text-lavender-600">
              {redemptionResult.newPeriodEnd
                ? new Date(redemptionResult.newPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">Redirecting to your dashboard...</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lavender-600 text-white rounded-full hover:bg-lavender-700"
          >
            <BookOpen className="h-5 w-5" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-50 via-white to-mint-50">
      {/* Header */}
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-lavender-600">
            Amari
          </Link>
          <Link
            href="/gifts"
            className="text-sm text-gray-600 hover:text-lavender-600"
          >
            Buy Gift
          </Link>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Gift className="h-16 w-16 text-peach-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Redeem Your Gift
            </h1>
            <p className="text-gray-600">
              Enter your gift code below to activate your subscription
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gift Code
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="GIFT-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full px-4 py-3 text-center text-lg font-mono tracking-wider border border-gray-300 rounded-xl focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
              />
            </div>

            {/* Validate Button */}
            {!validation && (
              <button
                onClick={() => validateCode()}
                disabled={code.length < 19 || isValidating}
                className="w-full py-3 bg-lavender-600 text-white rounded-xl font-semibold hover:bg-lavender-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Code'
                )}
              </button>
            )}

            {/* Validation Result */}
            {validation && (
              <div className="mt-6">
                {validation.valid ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Valid Gift Code!</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">Package:</span>{' '}
                          <span className="font-medium">{validation.packageName}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Tier:</span>{' '}
                          <span className="font-medium">{validation.tierName}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Duration:</span>{' '}
                          <span className="font-medium">{validation.durationMonths} months</span>
                        </p>
                        {validation.fromName && (
                          <p>
                            <span className="text-gray-500">From:</span>{' '}
                            <span className="font-medium">{validation.fromName}</span>
                          </p>
                        )}
                      </div>
                      {validation.message && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs text-gray-500 mb-1">Personal Message:</p>
                          <p className="text-sm italic text-gray-700">"{validation.message}"</p>
                        </div>
                      )}
                    </div>

                    {!isLoaded ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-lavender-600" />
                      </div>
                    ) : isSignedIn ? (
                      <button
                        onClick={handleRedeem}
                        disabled={isRedeeming}
                        className="w-full py-3 bg-gradient-to-r from-peach-500 to-pink-500 text-white rounded-xl font-semibold hover:from-peach-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Redeeming...
                          </>
                        ) : (
                          <>
                            <Gift className="h-5 w-5" />
                            Redeem Gift
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 text-center">
                          Sign in or create an account to redeem your gift
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            href={`/sign-in?redirect=/gifts/redeem?code=${encodeURIComponent(code)}`}
                            className="py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50"
                          >
                            Sign In
                          </Link>
                          <Link
                            href={`/sign-up?redirect=/gifts/redeem?code=${encodeURIComponent(code)}`}
                            className="py-3 px-4 bg-lavender-600 text-white rounded-xl font-semibold text-center hover:bg-lavender-700"
                          >
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">{validation.error}</span>
                    </div>
                    <button
                      onClick={() => {
                        setCode('');
                        setValidation(null);
                      }}
                      className="mt-3 text-sm text-red-600 hover:underline"
                    >
                      Try a different code
                    </button>
                  </div>
                )}

                {redemptionResult && !redemptionResult.success && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {redemptionResult.error || 'Failed to redeem gift'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Gift codes look like: <span className="font-mono">GIFT-XXXX-XXXX-XXXX</span>
            </p>
            <p className="mt-2">
              Need help?{' '}
              <Link href="/support" className="text-lavender-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
