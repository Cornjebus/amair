import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    const stripe = getStripe()
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

        console.log('🎉 Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          mode: session.mode,
          metadata: session.metadata,
          subscription: session.subscription,
        })

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const clerkUserId = session.metadata?.clerk_user_id

          console.log('📝 Processing subscription upgrade:', {
            clerkUserId,
            customerId,
            subscriptionId,
          })

          if (!clerkUserId) {
            console.error('❌ No clerk_user_id in session metadata:', session.metadata)
            throw new Error('No clerk_user_id in session metadata')
          }

          // Get subscription details
          const stripe = getStripe()
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const periodEnd = (subscription as any).current_period_end

          // Update user in database
          console.log('💾 Updating user in Supabase:', {
            clerkUserId,
            newStatus: 'premium',
            customerId,
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })

          const { data: updatedUser, error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_end_date: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              stripe_customer_id: customerId,
            })
            .eq('clerk_id', clerkUserId)
            .select()

          if (error) {
            console.error('❌ Error updating user subscription:', error)
            throw error
          }

          console.log('✅ User upgraded successfully:', {
            userId: updatedUser?.[0]?.id,
            clerkId: updatedUser?.[0]?.clerk_id,
            newStatus: updatedUser?.[0]?.subscription_status,
            customerId: updatedUser?.[0]?.stripe_customer_id,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const periodEnd = (subscription as any).current_period_end

        // Determine subscription status
        let status: 'free' | 'premium' | 'trial' = 'free'
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = subscription.status === 'trialing' ? 'trial' : 'premium'
        }

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: status,
            subscription_end_date: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
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
