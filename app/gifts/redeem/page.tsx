'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gift,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

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
      <div className="min-h-screen bg-amari-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <CheckCircle className="h-20 w-20 text-amari-sage mx-auto" />
            <Sparkles className="h-6 w-6 text-amari-terracotta absolute top-0 right-1/3 animate-pulse" />
          </div>
          <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-4">
            Gift Redeemed!
          </h1>
          <p className="text-lg text-amari-muted mb-6">
            You now have {redemptionResult.durationMonths} months of{' '}
            {tierNames[redemptionResult.tier || ''] || redemptionResult.tier}!
          </p>
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-sm text-amari-muted mb-1">Your subscription is active until</p>
              <p className="text-xl font-display font-semibold text-amari-terracotta">
                {redemptionResult.newPeriodEnd
                  ? new Date(redemptionResult.newPeriodEnd).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
          <p className="text-sm text-amari-muted mb-4">Redirecting to your dashboard...</p>
          <Link href="/dashboard">
            <Button>
              <BookOpen className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amari-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-amari-sand bg-amari-cream/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Amari"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <Link href="/gifts">
            <Button variant="ghost" size="sm">Buy Gift</Button>
          </Link>
        </div>
      </header>

      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amari-rose/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Gift className="h-8 w-8 text-amari-terracotta" />
            </div>
            <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
              Redeem Your Gift
            </h1>
            <p className="text-amari-muted">
              Enter your gift code below to activate your subscription
            </p>
          </div>

          <Card>
            <CardContent className="pt-8">
              {/* Code Input */}
              <div className="mb-6">
                <Label>Gift Code</Label>
                <Input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="GIFT-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className="text-center text-lg font-mono tracking-wider"
                />
              </div>

              {/* Validate Button */}
              {!validation && (
                <Button
                  onClick={() => validateCode()}
                  disabled={code.length < 19 || isValidating}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Code'
                  )}
                </Button>
              )}

              {/* Validation Result */}
              {validation && (
                <div className="mt-6">
                  {validation.valid ? (
                    <div className="space-y-4">
                      <div className="bg-amari-sage/10 border border-amari-sage/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amari-sage mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Valid Gift Code!</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-amari-muted">Package:</span>{' '}
                            <span className="font-medium text-amari-charcoal">{validation.packageName}</span>
                          </p>
                          <p>
                            <span className="text-amari-muted">Tier:</span>{' '}
                            <span className="font-medium text-amari-charcoal">{validation.tierName}</span>
                          </p>
                          <p>
                            <span className="text-amari-muted">Duration:</span>{' '}
                            <span className="font-medium text-amari-charcoal">{validation.durationMonths} months</span>
                          </p>
                          {validation.fromName && (
                            <p>
                              <span className="text-amari-muted">From:</span>{' '}
                              <span className="font-medium text-amari-charcoal">{validation.fromName}</span>
                            </p>
                          )}
                        </div>
                        {validation.message && (
                          <div className="mt-3 pt-3 border-t border-amari-sage/20">
                            <p className="text-xs text-amari-muted mb-1">Personal Message:</p>
                            <p className="text-sm italic text-amari-charcoal">"{validation.message}"</p>
                          </div>
                        )}
                      </div>

                      {!isLoaded ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-amari-terracotta" />
                        </div>
                      ) : isSignedIn ? (
                        <Button
                          onClick={handleRedeem}
                          disabled={isRedeeming}
                          className="w-full"
                        >
                          {isRedeeming ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Redeeming...
                            </>
                          ) : (
                            <>
                              <Gift className="mr-2 h-5 w-5" />
                              Redeem Gift
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-amari-muted text-center">
                            Sign in or create an account to redeem your gift
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Link href={`/sign-in?redirect=/gifts/redeem?code=${encodeURIComponent(code)}`}>
                              <Button variant="outline" className="w-full">
                                Sign In
                              </Button>
                            </Link>
                            <Link href={`/sign-up?redirect=/gifts/redeem?code=${encodeURIComponent(code)}`}>
                              <Button className="w-full">
                                Sign Up
                              </Button>
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
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-amari-muted">
            <p>
              Gift codes look like: <span className="font-mono">GIFT-XXXX-XXXX-XXXX</span>
            </p>
            <p className="mt-2">
              Need help?{' '}
              <Link href="/support" className="text-amari-terracotta hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
