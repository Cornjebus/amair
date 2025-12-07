'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface GiftPackage {
  id: string;
  name: string;
  slug: string;
  tier: string;
  duration_months: number;
  price_cents: number;
  description: string;
}

const tierColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  dream_weaver: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: <Star className="h-5 w-5" />,
  },
  magic_circle: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: <Sparkles className="h-5 w-5" />,
  },
  enchanted_library: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: <Crown className="h-5 w-5" />,
  },
};

const tierNames: Record<string, string> = {
  dream_weaver: 'Dream Weaver',
  magic_circle: 'Magic Circle',
  enchanted_library: 'Enchanted Library',
};

export default function GiftsPage() {
  const [packages, setPackages] = useState<GiftPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GiftPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPackage = (pkg: GiftPackage) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleProceedToConfirm = () => {
    if (!purchaserEmail) {
      alert('Please enter your email address');
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
        alert('Error creating checkout. Please try again.');
        setIsCheckingOut(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error creating checkout. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-b from-peach-50 via-white to-mint-50">
      {/* Header */}
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-lavender-600">
            Amari
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-lavender-600">
              View Plans
            </Link>
            <Link
              href="/gifts/redeem"
              className="text-sm px-4 py-2 bg-peach-100 text-peach-700 rounded-full hover:bg-peach-200"
            >
              Redeem Gift
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-4 text-center">
        <Gift className="h-16 w-16 text-peach-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Give the Gift of <span className="text-peach-600">Stories</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Share magical, personalized bedtime stories with someone special.
          Perfect for birthdays, holidays, or just because.
        </p>
      </section>

      {step === 'select' && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-peach-500 border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-gray-500">Loading gift packages...</p>
              </div>
            ) : (
              Object.entries(packagesByTier).map(([tier, tierPackages]) => (
                <div key={tier} className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className={tierColors[tier]?.text || 'text-gray-600'}>
                      {tierColors[tier]?.icon}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {tierNames[tier] || tier}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tierPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg)}
                        className={`p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-xl ${
                          tierColors[tier]?.bg || 'bg-gray-50'
                        } border-2 border-transparent hover:border-${tier === 'dream_weaver' ? 'blue' : tier === 'magic_circle' ? 'purple' : 'amber'}-300`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              tierColors[tier]?.bg || 'bg-gray-100'
                            } ${tierColors[tier]?.text || 'text-gray-600'}`}
                          >
                            {pkg.duration_months} months
                          </span>
                          <Heart className="h-5 w-5 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-gray-900">
                            ${(pkg.price_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {step === 'details' && selectedPackage && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('select')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              ← Back to packages
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Selected Package Summary */}
              <div className={`${tierColors[selectedPackage.tier]?.bg || 'bg-gray-50'} rounded-xl p-4 mb-8`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">You're gifting</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPackage.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedPackage.duration_months} months of {tierNames[selectedPackage.tier]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${(selectedPackage.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-lavender-500" />
                    Your Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        value={purchaserEmail}
                        onChange={(e) => setPurchaserEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={purchaserName}
                        onChange={(e) => setPurchaserName(e.target.value)}
                        placeholder="Your name (for gift message)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-peach-500" />
                    Recipient Information (Optional)
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    We'll send the gift code to you. Add recipient info if you'd like us to email them too.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Email
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="recipient@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Recipient's name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Personal Message
                  </h3>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Add a personal message to include with the gift..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">{giftMessage.length}/500 characters</p>
                </div>

                {recipientEmail && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-mint-500" />
                      Delivery Date (Optional)
                    </h3>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to send immediately after purchase
                    </p>
                  </div>
                )}

                <button
                  onClick={handleProceedToConfirm}
                  className="w-full py-4 bg-gradient-to-r from-peach-500 to-pink-500 text-white rounded-xl font-semibold hover:from-peach-600 hover:to-pink-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Continue to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 'confirm' && selectedPackage && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('details')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              ← Back to details
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Confirm Your Gift
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Gift Package</span>
                  <span className="font-medium text-gray-900">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">
                    {selectedPackage.duration_months} months
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Subscription Tier</span>
                  <span className="font-medium text-gray-900">
                    {tierNames[selectedPackage.tier]}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Your Email</span>
                  <span className="font-medium text-gray-900">{purchaserEmail}</span>
                </div>
                {recipientEmail && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Recipient Email</span>
                    <span className="font-medium text-gray-900">{recipientEmail}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-xl">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    ${(selectedPackage.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-mint-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-mint-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Gift code delivery</p>
                    <p className="text-sm text-gray-600">
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

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-4 bg-gradient-to-r from-peach-500 to-pink-500 text-white rounded-xl font-semibold hover:from-peach-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
              >
                {isCheckingOut ? 'Processing...' : `Pay $${(selectedPackage.price_cents / 100).toFixed(2)}`}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
