'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Crown, BookOpen, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const tiers = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    description: 'Perfect for trying out Amari',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '3 stories per month',
      'Web voice narration',
      'Up to 2 children',
      '5 saved stories',
      'All story themes',
    ],
    limitations: [
      'No premium voices',
      'No downloads',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'dream_weaver',
    name: 'Dream Weaver',
    icon: Zap,
    description: 'For occasional storytellers',
    monthlyPrice: 6.99,
    annualPrice: 59.99,
    savings: '29%',
    features: [
      '10 stories per month',
      '3 premium voices per month',
      'Up to 3 children',
      'Unlimited saved stories',
      'Story downloads (PDF/MP3)',
      'Basic custom themes',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'magic_circle',
    name: 'Magic Circle',
    icon: Crown,
    description: 'For dedicated families',
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    savings: '33%',
    features: [
      '30 stories per month',
      '15 premium voices per month',
      'Up to 5 children',
      'Family sharing (2 accounts)',
      'All downloads & exports',
      'Premium custom themes',
      'Scheduled story delivery',
      'Usage analytics',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'enchanted_library',
    name: 'Enchanted Library',
    icon: BookOpen,
    description: 'Ultimate storytelling experience',
    monthlyPrice: 29.99,
    annualPrice: 249.99,
    savings: '31%',
    features: [
      '60 stories per month',
      '60 premium voices per month',
      'Unlimited children',
      'Family sharing (4 accounts)',
      'Character voice library',
      'Custom theme creator',
      'Priority support',
      'Early access to new features',
      '1 gift subscription per year',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const router = useRouter()

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free') {
      router.push('/dashboard')
      return
    }

    try {
      const priceId = getPriceId(tierId, isAnnual)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  const getPriceId = (tierId: string, annual: boolean) => {
    const priceMap: Record<string, { monthly: string; annual: string }> = {
      dream_weaver: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY!,
        annual: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL!,
      },
      magic_circle: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY!,
        annual: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL!,
      },
      enchanted_library: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY!,
        annual: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL!,
      },
    }

    return annual ? priceMap[tierId].annual : priceMap[tierId].monthly
  }

  return (
    <div className="container py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Magic</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your family's storytelling adventures
        </p>

        {/* Annual Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Label htmlFor="annual" className={!isAnnual ? 'font-semibold' : ''}>
            Monthly
          </Label>
          <Switch
            id="annual"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="annual" className={isAnnual ? 'font-semibold' : ''}>
            Annual
            <Badge variant="secondary" className="ml-2">
              Save up to 33%
            </Badge>
          </Label>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon
          const price = isAnnual ? tier.annualPrice : tier.monthlyPrice
          const monthlyPrice = isAnnual ? tier.annualPrice / 12 : tier.monthlyPrice

          return (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle>{tier.name}</CardTitle>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${monthlyPrice.toFixed(2)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  {isAnnual && tier.annualPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${price} billed annually • Save {tier.savings}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {tier.limitations && (
                  <div className="space-y-2 pt-2 border-t">
                    {tier.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-start gap-2">
                        <span className="text-sm text-muted-foreground">• {limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-8 pt-12">
        <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I change my plan later?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Upgrades are prorated, and
              downgrades take effect at the end of your current billing period.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">What happens when I reach my story limit?</h3>
            <p className="text-muted-foreground">
              Your stories are saved and accessible forever, but you won't be able to create new ones
              until your usage resets at the start of your next billing period. Consider upgrading for more stories!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">What are premium voices?</h3>
            <p className="text-muted-foreground">
              Premium voices use advanced ElevenLabs AI technology to create natural, expressive narration
              with different character voices and emotional tones. Web voices are simpler but still high-quality.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              Yes! All paid plans include a 7-day free trial. You won't be charged until the trial ends,
              and you can cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
