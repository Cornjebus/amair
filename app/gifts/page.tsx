'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoInline } from '@/components/ui/Logo';
import {
  Gift,
  Star,
  Sparkles,
  Crown,
  Heart,
  Calendar,
  Mail,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CombinedToastProvider, useToast } from '@/components/ui/Toast';

interface GiftPackage {
  id: string;
  name: string;
  slug: string;
  tier: string;
  duration_months: number;
  price_cents: number;
  description: string;
}

const tierConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  dream_weaver: {
    bg: 'bg-amari-sage/10',
    text: 'text-amari-sage',
    icon: <Star className="h-5 w-5" />,
  },
  magic_circle: {
    bg: 'bg-amari-terracotta/10',
    text: 'text-amari-terracotta',
    icon: <Sparkles className="h-5 w-5" />,
  },
  enchanted_library: {
    bg: 'bg-amari-rose/30',
    text: 'text-amari-charcoal',
    icon: <Crown className="h-5 w-5" />,
  },
};

const tierNames: Record<string, string> = {
  dream_weaver: 'Dream Weaver',
  magic_circle: 'Magic Circle',
  enchanted_library: 'Enchanted Library',
};

// Wrapper component with Toast provider
export default function GiftsPage() {
  return (
    <CombinedToastProvider position="bottom-right">
      <GiftsPageContent />
    </CombinedToastProvider>
  );
}

function GiftsPageContent() {
  const [packages, setPackages] = useState<GiftPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GiftPackage | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();
  const { warning, error: showError } = useToast();

  // Form state
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/gifts/packages');
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleSelectPackage = (pkg: GiftPackage) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleProceedToConfirm = () => {
    if (!purchaserEmail) {
      warning({
        title: 'Email Required',
        description: 'Please enter your email address to continue.',
      });
      return;
    }
    setStep('confirm');
  };

  const handleCheckout = async () => {
    if (!selectedPackage || !purchaserEmail) return;

    setIsCheckingOut(true);

    try {
      const response = await fetch('/api/gifts/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          purchaserEmail,
          purchaserName,
          recipientEmail,
          recipientName,
          giftMessage,
          deliveryDate: deliveryDate || null,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        showError({
          title: 'Checkout Error',
          description: 'Error creating checkout. Please try again.',
        });
        setIsCheckingOut(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showError({
        title: 'Checkout Error',
        description: 'Error creating checkout. Please try again.',
      });
      setIsCheckingOut(false);
    }
  };

  // Group packages by tier
  const packagesByTier = packages.reduce(
    (acc, pkg) => {
      if (!acc[pkg.tier]) acc[pkg.tier] = [];
      acc[pkg.tier].push(pkg);
      return acc;
    },
    {} as Record<string, GiftPackage[]>
  );

  return (
    <div className="min-h-screen bg-amari-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-amari-sand bg-amari-cream/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <LogoInline size="md" linkTo="/" />
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">View Plans</Button>
            </Link>
            <Link href="/gifts/redeem">
              <Button variant="outline" size="sm">Redeem Gift</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amari-rose/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Gift className="h-8 w-8 text-amari-terracotta" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-semibold text-amari-charcoal mb-4">
          Give the Gift of <span className="text-amari-terracotta">Stories</span>
        </h1>
        <p className="text-xl text-amari-muted max-w-2xl mx-auto">
          Share magical, personalized bedtime stories with someone special.
          Perfect for birthdays, holidays, or just because.
        </p>
      </section>

      {step === 'select' && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {Object.entries(packagesByTier).map(([tier, tierPackages]) => (
                <div key={tier} className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className={tierConfig[tier]?.text || 'text-amari-charcoal'}>
                      {tierConfig[tier]?.icon}
                    </span>
                    <h2 className="text-2xl font-display font-semibold text-amari-charcoal">
                      {tierNames[tier] || tier}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tierPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          tierConfig[tier]?.bg || 'bg-white'
                        }`}
                        onClick={() => handleSelectPackage(pkg)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                tierConfig[tier]?.bg || 'bg-amari-sand'
                              } ${tierConfig[tier]?.text || 'text-amari-charcoal'}`}
                            >
                              {pkg.duration_months} months
                            </span>
                            <Heart className="h-5 w-5 text-amari-rose" />
                          </div>
                          <h3 className="text-xl font-display font-semibold text-amari-charcoal mb-2">{pkg.name}</h3>
                          <p className="text-sm text-amari-muted mb-4">{pkg.description}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display font-semibold text-amari-charcoal">
                              ${(pkg.price_cents / 100).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {step === 'details' && selectedPackage && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('select')}
              className="text-sm text-amari-muted hover:text-amari-charcoal mb-6"
            >
              ← Back to packages
            </button>

            <Card>
              <CardContent className="pt-8">
                {/* Selected Package Summary */}
                <div className={`${tierConfig[selectedPackage.tier]?.bg || 'bg-amari-sand'} rounded-xl p-4 mb-8`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amari-muted">You're gifting</p>
                      <p className="text-xl font-display font-semibold text-amari-charcoal">{selectedPackage.name}</p>
                      <p className="text-sm text-amari-muted">
                        {selectedPackage.duration_months} months of {tierNames[selectedPackage.tier]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-semibold text-amari-charcoal">
                        ${(selectedPackage.price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-amari-sage" />
                      Your Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Your Email *</Label>
                        <Input
                          type="email"
                          value={purchaserEmail}
                          onChange={(e) => setPurchaserEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div>
                        <Label>Your Name</Label>
                        <Input
                          type="text"
                          value={purchaserName}
                          onChange={(e) => setPurchaserName(e.target.value)}
                          placeholder="Your name (for gift message)"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-4 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-amari-terracotta" />
                      Recipient Information (Optional)
                    </h3>
                    <p className="text-sm text-amari-muted mb-4">
                      We'll send the gift code to you. Add recipient info if you'd like us to email them too.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Recipient Email</Label>
                        <Input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="recipient@email.com"
                        />
                      </div>
                      <div>
                        <Label>Recipient Name</Label>
                        <Input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Recipient's name"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-amari-rose" />
                      Personal Message
                    </h3>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Add a personal message to include with the gift..."
                      rows={3}
                      maxLength={500}
                      className="flex w-full rounded-xl border border-amari-sand bg-white px-4 py-3 text-sm text-amari-charcoal placeholder:text-amari-muted focus:border-amari-terracotta focus:ring-2 focus:ring-amari-terracotta/20 focus:outline-none"
                    />
                    <p className="text-xs text-amari-muted mt-1">{giftMessage.length}/500 characters</p>
                  </div>

                  {recipientEmail && (
                    <div>
                      <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amari-sage" />
                        Delivery Date (Optional)
                      </h3>
                      <Input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-sm text-amari-muted mt-1">
                        Leave empty to send immediately after purchase
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleProceedToConfirm}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {step === 'confirm' && selectedPackage && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('details')}
              className="text-sm text-amari-muted hover:text-amari-charcoal mb-6"
            >
              ← Back to details
            </button>

            <Card>
              <CardContent className="pt-8">
                <h2 className="text-2xl font-display font-semibold text-amari-charcoal mb-6 text-center">
                  Confirm Your Gift
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-3 border-b border-amari-sand">
                    <span className="text-amari-muted">Gift Package</span>
                    <span className="font-medium text-amari-charcoal">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-amari-sand">
                    <span className="text-amari-muted">Duration</span>
                    <span className="font-medium text-amari-charcoal">
                      {selectedPackage.duration_months} months
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-amari-sand">
                    <span className="text-amari-muted">Subscription Tier</span>
                    <span className="font-medium text-amari-charcoal">
                      {tierNames[selectedPackage.tier]}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-amari-sand">
                    <span className="text-amari-muted">Your Email</span>
                    <span className="font-medium text-amari-charcoal">{purchaserEmail}</span>
                  </div>
                  {recipientEmail && (
                    <div className="flex justify-between py-3 border-b border-amari-sand">
                      <span className="text-amari-muted">Recipient Email</span>
                      <span className="font-medium text-amari-charcoal">{recipientEmail}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-xl">
                    <span className="font-display font-semibold text-amari-charcoal">Total</span>
                    <span className="font-display font-semibold text-amari-charcoal">
                      ${(selectedPackage.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-amari-sage/10 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-amari-sage mt-0.5" />
                    <div>
                      <p className="font-medium text-amari-charcoal">Gift code delivery</p>
                      <p className="text-sm text-amari-muted">
                        You'll receive the gift code via email immediately after purchase.
                        {recipientEmail && deliveryDate
                          ? ` We'll also email ${recipientEmail} on ${deliveryDate}.`
                          : recipientEmail
                            ? ` We'll also email ${recipientEmail} right away.`
                            : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full"
                  size="lg"
                >
                  {isCheckingOut ? 'Processing...' : `Pay $${(selectedPackage.price_cents / 100).toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-amari-sand py-8 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <LogoInline size="sm" linkTo="/" className="opacity-70" />
          <p className="text-sm text-amari-muted">
            &copy; {new Date().getFullYear()} Amari. Bedtime stories as unique as your child.
          </p>
        </div>
      </footer>
    </div>
  );
}
