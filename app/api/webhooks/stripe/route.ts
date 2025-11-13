import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const clerkUserId = session.metadata?.clerk_user_id

          if (!clerkUserId) {
            throw new Error('No clerk_user_id in session metadata')
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Update user in database
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_customer_id: customerId,
            })
            .eq('clerk_id', clerkUserId)

          if (error) {
            console.error('Error updating user subscription:', error)
            throw error
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Determine subscription status
        let status: 'free' | 'premium' | 'trial' = 'free'
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = subscription.status === 'trialing' ? 'trial' : 'premium'
        }

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription:', error)
          throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'free',
            subscription_end_date: null,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error canceling subscription:', error)
          throw error
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Optionally notify user or update status
        console.log(`Payment failed for customer: ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
