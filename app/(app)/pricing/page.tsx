'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Crown, Sparkles } from 'lucide-react'
import { getStripe } from '@/lib/stripe/client'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Amari',
    features: [
      '3 stories per month',
      'All story tones',
      'Read aloud feature',
      'Download stories',
    ],
    cta: 'Current Plan',
    priceId: null,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'Unlimited magical stories',
    features: [
      'Unlimited stories',
      'All story tones',
      'Read aloud feature',
      'Download stories',
      'Save favorite stories',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Premium',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    popular: true,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return

    setLoading(priceId)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      const stripe = await getStripe()
      await stripe?.redirectToCheckout({ sessionId: data.sessionId })
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-playfair font-bold text-lavender-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-lavender-600">
          Start creating magical bedtime stories for your family
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.popular
                ? 'border-lavender-500 border-2 shadow-2xl scale-105'
                : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-lavender-500 to-skyblue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Most Popular
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-3xl font-playfair mb-2">
                {plan.name}
              </CardTitle>
              <div className="mb-4">
                <span className="text-5xl font-bold text-lavender-900">
                  {plan.price}
                </span>
                <span className="text-lavender-600 ml-2">
                  {plan.period}
                </span>
              </div>
              <CardDescription className="text-base">
                {plan.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-lavender-600 mt-0.5 flex-shrink-0" />
                    <span className="text-lavender-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => plan.priceId && handleSubscribe(plan.priceId)}
                disabled={!plan.priceId || loading === plan.priceId}
              >
                {loading === plan.priceId ? (
                  'Loading...'
                ) : (
                  <>
                    {plan.cta}
                    {plan.popular && <Sparkles className="ml-2 h-5 w-5" />}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-playfair font-bold text-center text-lavender-900 mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lavender-700">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">What happens to my stories if I cancel?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lavender-700">
                All your stories remain saved in your account. You can always re-subscribe to create new stories.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Is Amari safe for children?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lavender-700">
                Absolutely! All stories are generated with family-friendly content appropriate for children ages 3-10.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">How long are the stories?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lavender-700">
                You can choose between Quick (2-3 minutes), Medium (5 minutes), or Epic (10 minutes) stories to fit your bedtime routine.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
