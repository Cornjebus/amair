'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Crown,
  Star,
  Sparkles,
  BookOpen,
  Calendar,
  CreditCard,
  ArrowRight,
  Loader2,
  Gift,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react'

const TIER_CONFIG = {
  free: { name: 'Free', icon: BookOpen, color: 'gray' },
  dream_weaver: { name: 'Dream Weaver', icon: Star, color: 'skyblue' },
  magic_circle: { name: 'Magic Circle', icon: Sparkles, color: 'lavender' },
  enchanted_library: { name: 'Enchanted Library', icon: Crown, color: 'yellow' },
}

interface SubscriptionData {
  tier: keyof typeof TIER_CONFIG
  billingCycle: string
  status: string
  currentPeriodEnd: string | null
  storiesUsed: number
  premiumVoicesUsed: number
  limits: {
    storiesPerMonth: number
    premiumVoicesPerMonth: number
  }
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId?: string
  isOnTrial?: boolean
  trialEnd?: string | null
  trialDaysRemaining?: number
}

export default function SubscriptionSettingsPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [managingBilling, setManagingBilling] = useState(false)

  useEffect(() => {
    async function loadSubscription() {
      try {
        const response = await fetch('/api/subscriptions')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error loading subscription:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSubscription()
  }, [])

  const handleManageBilling = async () => {
    setManagingBilling(true)
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    } finally {
      setManagingBilling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600 mb-4">Unable to load subscription information.</p>
        <Link href="/pricing">
          <Button>View Plans</Button>
        </Link>
      </div>
    )
  }

  const tierConfig = TIER_CONFIG[subscription.tier] || TIER_CONFIG.free
  const TierIcon = tierConfig.icon
  const isPaid = subscription.tier !== 'free'
  const isOnTrial = subscription.isOnTrial || false
  const trialDaysRemaining = subscription.trialDaysRemaining || 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-lavender-900 mb-2">
          Subscription Settings
        </h1>
        <p className="text-lavender-600">
          Manage your Amari subscription and billing
        </p>
      </div>

      {/* Trial Status Banner */}
      {isOnTrial && (
        <Card className="bg-gradient-to-r from-lavender-100 to-skyblue-100 border-lavender-300">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full">
                <Clock className="h-8 w-8 text-lavender-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-lavender-900">
                  {trialDaysRemaining} days left in your free trial
                </h3>
                <p className="text-lavender-700">
                  Your trial ends{' '}
                  {subscription.trialEnd
                    ? new Date(subscription.trialEnd).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'soon'}
                  . After that, your subscription will begin automatically.
                </p>
              </div>
            </div>
            {trialDaysRemaining <= 3 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Your trial is ending soon!</strong> After your trial ends, you'll be charged for the{' '}
                  {subscription.billingCycle === 'annual' ? 'annual' : 'monthly'} subscription.
                  You can cancel anytime from Manage Billing below.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card className={isPaid && !isOnTrial ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50' : isOnTrial ? 'border-lavender-300' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isPaid ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <TierIcon className={`h-6 w-6 ${isPaid ? 'text-yellow-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{tierConfig.name}</CardTitle>
                <CardDescription>
                  {isOnTrial
                    ? '14-day free trial'
                    : isPaid
                    ? `${subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'} subscription`
                    : 'Free plan'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isOnTrial ? 'outline' : subscription.status === 'active' ? 'default' : 'secondary'} className={isOnTrial ? 'border-lavender-400 text-lavender-700' : ''}>
              {isOnTrial ? 'Trial' : subscription.status === 'active' ? 'Active' : subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/50">
              <p className="text-sm text-gray-600 mb-1">Stories This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription.storiesUsed}
                <span className="text-lg font-normal text-gray-500">
                  /{subscription.limits.storiesPerMonth}
                </span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/50">
              <p className="text-sm text-gray-600 mb-1">Premium Voices</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription.premiumVoicesUsed}
                <span className="text-lg font-normal text-gray-500">
                  /{subscription.limits.premiumVoicesPerMonth}
                </span>
              </p>
            </div>
          </div>

          {/* Renewal Info */}
          {isPaid && subscription.currentPeriodEnd && !isOnTrial && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {subscription.cancelAtPeriodEnd ? (
                <span>Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              ) : (
                <span>Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Trial billing info */}
          {isOnTrial && (
            <div className="flex items-center gap-2 text-sm text-lavender-600">
              <CreditCard className="h-4 w-4" />
              <span>
                First charge on{' '}
                {subscription.trialEnd
                  ? new Date(subscription.trialEnd).toLocaleDateString()
                  : 'trial end'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isPaid ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={managingBilling}
              >
                {managingBilling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            ) : (
              <Link href="/pricing">
                <Button>
                  Upgrade Plan <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/pricing">
              <Button variant="ghost">
                {isPaid ? 'Change Plan' : 'View All Plans'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Your Plan Includes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-3">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{subscription.limits.storiesPerMonth} stories per month</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{subscription.limits.premiumVoicesPerMonth} premium voice narrations</span>
            </li>
            {subscription.tier !== 'free' && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Unlimited saved stories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Story downloads</span>
                </li>
              </>
            )}
            {subscription.tier === 'magic_circle' && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Family sharing (2 accounts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Premium themes</span>
                </li>
              </>
            )}
            {subscription.tier === 'enchanted_library' && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Family sharing (4 accounts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>1 free gift subscription per year</span>
                </li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Gift Section */}
      <Card className="bg-gradient-to-r from-peach-50 to-mint-50 border-peach-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gift className="h-10 w-10 text-peach-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Gift Amari to Someone Special</h3>
                <p className="text-gray-600">Share the magic of bedtime stories</p>
              </div>
            </div>
            <Link href="/gifts">
              <Button variant="outline" className="border-peach-300">
                Shop Gifts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Gift Code */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Have a Gift Code?</h3>
              <p className="text-gray-600">Redeem your gift subscription</p>
            </div>
            <Link href="/gifts/redeem">
              <Button variant="outline">
                Redeem Code
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
