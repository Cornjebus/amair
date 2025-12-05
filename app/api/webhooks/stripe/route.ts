import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
  handlePaymentSucceeded,
} from '@/lib/subscription/webhook-handlers'
import { handleCreditPurchaseCompleted } from '@/lib/credits/webhook-handlers'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Check if this is a credit purchase or subscription
        if (session.metadata?.type === 'credit_purchase') {
          await handleCreditPurchaseCompleted(session, supabaseAdmin)
        } else {
          await handleCheckoutCompleted(session)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error processing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
