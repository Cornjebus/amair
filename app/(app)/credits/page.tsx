'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Coins,
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  BookOpen,
  Image,
  Mic,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  savings?: string
  popular?: boolean
  description: string
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 50,
    price: 4.99,
    description: 'Perfect for trying out all features',
  },
  {
    id: 'storyteller',
    name: 'Storyteller Pack',
    credits: 150,
    price: 12.99,
    savings: 'Save 13%',
    popular: true,
    description: 'Most popular for regular storytellers',
  },
  {
    id: 'family',
    name: 'Family Pack',
    credits: 350,
    price: 24.99,
    savings: 'Save 29%',
    description: 'Great value for the whole family',
  },
  {
    id: 'library',
    name: 'Library Pack',
    credits: 800,
    price: 49.99,
    savings: 'Save 38%',
    description: 'Best value for avid storytellers',
  },
]

const creditCosts = [
  { feature: 'Short Story', cost: 3, icon: BookOpen },
  { feature: 'Medium Story', cost: 5, icon: BookOpen },
  { feature: 'Long Story', cost: 8, icon: BookOpen },
  { feature: 'Standard Illustration', cost: 5, icon: Image },
  { feature: 'HD Illustration', cost: 10, icon: Image },
  { feature: 'Basic Narration', cost: 3, icon: Mic },
  { feature: 'Premium Narration', cost: 8, icon: Mic },
]

export default function CreditsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [credits, setCredits] = useState({
    balance: 0,
    tier: 'free',
    lifetimeCredits: 0,
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  // Check for success/cancel params
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    async function loadData() {
      try {
        const [creditsResponse, transactionsResponse] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/credits/transactions?limit=10'),
        ])

        if (creditsResponse.ok) {
          const data = await creditsResponse.json()
          setCredits({
            balance: data.balance || 0,
            tier: data.tier || 'free',
            lifetimeCredits: data.lifetimeCredits || 0,
          })
        }

        if (transactionsResponse.ok) {
          const data = await transactionsResponse.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error loading credits:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePurchase = async (packageId: string) => {
    const pkg = creditPackages.find(p => p.id === packageId)
    if (!pkg) return

    setPurchasing(packageId)
    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          credits: pkg.credits,
          priceInCents: Math.round(pkg.price * 100),
          name: pkg.name,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl || data.url) {
        window.location.href = data.checkoutUrl || data.url
      } else {
        alert(data.error || 'Error creating checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow animate-flutter mx-auto mb-4">
            <span className="text-4xl">🦋</span>
          </div>
          <p className="text-lavender-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Success Message */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Purchase Successful!</h3>
                <p className="text-green-700">Your credits have been added to your account.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canceled Message */}
      {canceled && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Purchase Canceled</h3>
                <p className="text-yellow-700">Your purchase was canceled. No charges were made.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-playfair font-bold text-lavender-900 mb-4">
          Credits
        </h1>
        <p className="text-lg text-lavender-600">
          Power your magical storytelling adventures
        </p>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-lavender-50 to-skyblue-50 border-lavender-200">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lavender-600 mb-1">Your Balance</p>
              <p className="text-5xl font-bold text-lavender-900">
                {credits.balance.toLocaleString()}
                <span className="text-2xl font-normal text-lavender-600 ml-2">credits</span>
              </p>
              <p className="text-sm text-lavender-500 mt-2">
                Lifetime earned: {credits.lifetimeCredits.toLocaleString()} credits
              </p>
            </div>
            <div className="text-8xl animate-flutter opacity-50">
              <Coins className="h-24 w-24 text-lavender-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-3xl font-playfair font-bold text-lavender-900 mb-6">
          Buy Credits
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular ? 'border-lavender-500 shadow-lg scale-105' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-lavender-500">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {pkg.name}
                  {pkg.savings && (
                    <Badge variant="secondary" className="text-xs">
                      {pkg.savings}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-lavender-500" />
                    <span className="text-4xl font-bold text-lavender-900">
                      {pkg.credits}
                    </span>
                  </div>
                  <p className="text-lavender-600">credits</p>
                </div>

                <div className="text-center py-4 border-t border-b border-lavender-100">
                  <span className="text-3xl font-bold text-lavender-900">
                    ${pkg.price}
                  </span>
                  <p className="text-sm text-lavender-500 mt-1">
                    ${(pkg.price / pkg.credits * 100).toFixed(1)}¢ per credit
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className="w-full"
                  variant={pkg.popular ? 'default' : 'outline'}
                  disabled={purchasing !== null}
                >
                  {purchasing === pkg.id ? (
                    'Processing...'
                  ) : (
                    <>
                      Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Costs Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-lavender-500" />
            Credit Cost Guide
          </CardTitle>
          <CardDescription>
            See how many credits each feature costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCosts.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.feature}
                  className="flex items-center justify-between p-3 rounded-lg bg-lavender-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-lavender-500" />
                    <span className="text-lavender-800">{item.feature}</span>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {item.cost} credits
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-lavender-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-lavender-50"
                >
                  <div>
                    <p className="font-medium text-lavender-900">{tx.reason}</p>
                    <p className="text-sm text-lavender-500">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-semibold tabular-nums ${
                      tx.amount > 0 ? 'text-green-600' : 'text-lavender-700'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Dashboard */}
      <div className="text-center">
        <Link href="/dashboard">
          <Button variant="outline" size="lg">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
