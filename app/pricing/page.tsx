'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  Sparkles,
  Star,
  Crown,
  Gift,
  BookOpen,
  Mic,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type BillingCycle = 'monthly' | 'annual';

interface TierFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  slug: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  storiesPerMonth: number;
  premiumVoices: number;
  icon: React.ReactNode;
  features: TierFeature[];
  highlighted?: boolean;
  ctaText: string;
}

interface PricingTierExtended extends PricingTier {
  hasTrial?: boolean;
}

const tiers: PricingTierExtended[] = [
  {
    name: 'Dream Weaver',
    slug: 'dream_weaver',
    monthlyPrice: 6.99,
    annualPrice: 59.99,
    description: 'For regular bedtime stories',
    storiesPerMonth: 10,
    premiumVoices: 3,
    icon: <Star className="h-6 w-6" />,
    hasTrial: true,
    features: [
      { text: '10 stories per month', included: true },
      { text: '3 premium voice stories', included: true },
      { text: '3 child profiles', included: true },
      { text: 'Unlimited saved stories', included: true },
      { text: 'AI-generated illustrations', included: true },
      { text: 'Story downloads', included: true },
    ],
    ctaText: 'Start 14-Day Free Trial',
  },
  {
    name: 'Magic Circle',
    slug: 'magic_circle',
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    description: 'Best for growing families',
    storiesPerMonth: 30,
    premiumVoices: 15,
    icon: <Sparkles className="h-6 w-6" />,
    highlighted: true,
    hasTrial: true,
    features: [
      { text: '30 stories per month', included: true },
      { text: '15 premium voice stories', included: true },
      { text: '5 child profiles', included: true },
      { text: 'AI-generated illustrations', included: true },
      { text: 'Family sharing (2 accounts)', included: true },
      { text: 'Premium themes', included: true },
      { text: 'PDF & MP3 downloads', included: true },
    ],
    ctaText: 'Start 14-Day Free Trial',
  },
  {
    name: 'Enchanted Library',
    slug: 'enchanted_library',
    monthlyPrice: 29.99,
    annualPrice: 249.99,
    description: 'Ultimate storytelling experience',
    storiesPerMonth: 60,
    premiumVoices: 60,
    icon: <Crown className="h-6 w-6" />,
    hasTrial: false,
    features: [
      { text: '60 stories per month', included: true },
      { text: 'All premium voices', included: true },
      { text: 'Unlimited child profiles', included: true },
      { text: 'AI-generated illustrations', included: true },
      { text: 'Family sharing (4 accounts)', included: true },
      { text: 'Character voices', included: true },
      { text: 'Custom themes', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to features', included: true },
    ],
    ctaText: 'Subscribe Now',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';

  const handleSubscribe = async (tier: PricingTierExtended) => {
    if (!isSignedIn) {
      router.push(`/sign-up?redirect=/pricing&tier=${tier.slug}&billing=${billingCycle}`);
      return;
    }

    setIsLoading(tier.slug);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier.slug,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setIsLoading(null);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setIsLoading(null);
    }
  };

  const getPrice = (tier: PricingTier) => {
    if (billingCycle === 'annual') {
      return tier.annualPrice / 12;
    }
    return tier.monthlyPrice;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return 0;
    const monthlyCost = tier.monthlyPrice * 12;
    return Math.round(((monthlyCost - tier.annualPrice) / monthlyCost) * 100);
  };

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
          {!isSignedIn && (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Onboarding Banner */}
      {isOnboarding && (
        <section className="py-6 px-4 bg-amari-sage/10 border-b border-amari-sand">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-amari-sage" />
              <h2 className="text-xl font-display font-semibold text-amari-charcoal">Welcome to Amari!</h2>
            </div>
            <p className="text-amari-muted">
              Choose a plan to start creating personalized bedtime stories for your child.
              <br />
              <span className="font-medium text-amari-charcoal">Try free for 14 days - your card won't be charged until the trial ends.</span>
            </p>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-semibold text-amari-charcoal mb-4">
          {isOnboarding ? (
            <>One More Step to <span className="text-amari-terracotta">Magic</span></>
          ) : (
            <>Choose Your <span className="text-amari-terracotta">Story Plan</span></>
          )}
        </h1>
        <p className="text-xl text-amari-muted max-w-2xl mx-auto mb-4">
          Magical bedtime stories personalized for your child.
        </p>
        <p className="text-lg text-amari-sage font-medium mb-10">
          Start with a 14-day free trial. Cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-amari-charcoal' : 'text-amari-muted'}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === 'annual' ? 'bg-amari-terracotta' : 'bg-amari-sand'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                billingCycle === 'annual' ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-amari-charcoal' : 'text-amari-muted'}`}
          >
            Annual
          </span>
          {billingCycle === 'annual' && (
            <span className="ml-2 px-2 py-0.5 bg-amari-sage/20 text-amari-sage text-xs font-medium rounded-full">
              Save up to 30%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.slug}
              className={`relative ${
                tier.highlighted
                  ? 'bg-amari-terracotta text-white border-amari-terracotta shadow-xl scale-105'
                  : 'bg-white'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-amari-sage text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {tier.hasTrial && !tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-amari-sage text-white text-xs font-bold rounded-full">
                    14-DAY FREE TRIAL
                  </span>
                </div>
              )}

              <CardContent className="pt-8 pb-6">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-xl ${
                      tier.highlighted ? 'bg-white/20' : 'bg-amari-terracotta/10'
                    }`}
                  >
                    <span className={tier.highlighted ? 'text-white' : 'text-amari-terracotta'}>
                      {tier.icon}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-display font-semibold text-lg ${
                        tier.highlighted ? 'text-white' : 'text-amari-charcoal'
                      }`}
                    >
                      {tier.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        tier.highlighted ? 'text-white/80' : 'text-amari-muted'
                      }`}
                    >
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-display font-semibold ${
                        tier.highlighted ? 'text-white' : 'text-amari-charcoal'
                      }`}
                    >
                      ${getPrice(tier).toFixed(2)}
                    </span>
                    <span
                      className={`text-sm ${tier.highlighted ? 'text-white/70' : 'text-amari-muted'}`}
                    >
                      /month
                    </span>
                  </div>
                  {billingCycle === 'annual' && tier.monthlyPrice > 0 && (
                    <p
                      className={`text-sm mt-1 ${
                        tier.highlighted ? 'text-white/80' : 'text-amari-sage'
                      }`}
                    >
                      Save {getSavings(tier)}% with annual billing
                    </p>
                  )}
                </div>

                {/* Quick Stats */}
                <div
                  className={`flex gap-4 mb-6 pb-6 border-b ${
                    tier.highlighted ? 'border-white/20' : 'border-amari-sand'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen
                      className={`h-4 w-4 ${
                        tier.highlighted ? 'text-white/70' : 'text-amari-sage'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        tier.highlighted ? 'text-white/90' : 'text-amari-charcoal'
                      }`}
                    >
                      {tier.storiesPerMonth} stories
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mic
                      className={`h-4 w-4 ${
                        tier.highlighted ? 'text-white/70' : 'text-amari-sage'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        tier.highlighted ? 'text-white/90' : 'text-amari-charcoal'
                      }`}
                    >
                      {tier.premiumVoices} voices
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 ${
                          feature.included
                            ? tier.highlighted
                              ? 'text-white'
                              : 'text-amari-sage'
                            : 'text-amari-sand'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included
                            ? tier.highlighted
                              ? 'text-white/90'
                              : 'text-amari-charcoal'
                            : 'text-amari-muted line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isLoading === tier.slug}
                  className={`w-full ${
                    tier.highlighted
                      ? 'bg-white text-amari-terracotta hover:bg-white/90'
                      : ''
                  }`}
                  variant={tier.highlighted ? 'ghost' : 'default'}
                >
                  {isLoading === tier.slug ? 'Loading...' : tier.ctaText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gift Section */}
      <section className="py-16 px-4 bg-amari-rose/30">
        <div className="max-w-4xl mx-auto text-center">
          <Gift className="h-12 w-12 text-amari-terracotta mx-auto mb-4" />
          <h2 className="text-3xl font-display font-semibold text-amari-charcoal mb-4">
            Give the Gift of Stories
          </h2>
          <p className="text-lg text-amari-muted mb-8">
            Perfect for grandparents, aunts, uncles, and anyone who wants to share
            the magic of personalized bedtime stories.
          </p>
          <Link href="/gifts">
            <Button size="lg" variant="secondary">
              <Gift className="mr-2 h-5 w-5" />
              Shop Gift Subscriptions
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-display font-semibold text-center text-amari-charcoal mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="Can I change my plan later?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and you'll be credited for any unused time on your current plan."
            />
            <FaqItem
              question="What happens when I run out of stories?"
              answer="When you reach your monthly limit, you'll need to wait until your next billing cycle or upgrade to a higher tier. We'll send you a reminder when you're running low."
            />
            <FaqItem
              question="Can I cancel anytime?"
              answer="Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
            />
            <FaqItem
              question="What are premium voices?"
              answer="Premium voices use advanced AI technology (ElevenLabs) for incredibly lifelike narration. Free users get web-based voices, while paid tiers include a number of premium voice stories each month."
            />
            <FaqItem
              question="How does family sharing work?"
              answer="Magic Circle and Enchanted Library plans allow you to share your subscription with other family members. Each person gets their own account with separate child profiles."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-amari-terracotta">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-display font-semibold text-white mb-4">
            Ready to Start Your Story?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of families creating magical bedtime memories.
            <br />
            <span className="font-medium">Try free for 14 days - no commitment required.</span>
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-amari-terracotta hover:bg-white/90">
              <Sparkles className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amari-sand py-8 bg-amari-cream">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/logo.png"
            alt="Amari"
            width={140}
            height={46}
            className="h-10 w-auto opacity-70"
          />
          <p className="text-sm text-amari-muted">
            &copy; {new Date().getFullYear()} Amari. Bedtime stories as unique as your child.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-amari-sand pb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-amari-charcoal">{question}</span>
        <ChevronDown className={`h-5 w-5 text-amari-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <p className="mt-3 text-amari-muted">{answer}</p>}
    </div>
  );
}
