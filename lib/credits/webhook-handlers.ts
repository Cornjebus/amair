import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { captureError, captureMessage } from '@/lib/monitoring/sentry';

// =============================================================================
// Credit Purchase Webhook Handlers
// =============================================================================

/**
 * Handle successful credit purchase checkout
 */
export async function handleCreditPurchaseCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const metadata = session.metadata;

  if (!metadata) {
    captureMessage('No metadata in checkout session', 'warning', {
      sessionId: session.id,
    });
    return;
  }

  const userId = metadata.userId;
  const packageId = metadata.packageId;
  const credits = parseInt(metadata.credits || '0', 10);
  const bonusCredits = parseInt(metadata.bonusCredits || '0', 10);
  const totalCredits = credits + bonusCredits;

  if (!userId || !totalCredits) {
    captureMessage('Invalid checkout session metadata', 'warning', {
      sessionId: session.id,
      metadata,
    });
    return;
  }

  try {
    // Update purchase record
    const { error: updateError } = await supabase
      .from('credit_purchases')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id);

    if (updateError) {
      throw updateError;
    }

    // Add credits to user account using the database function
    const { data, error: rpcError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: totalCredits,
      p_type: 'purchase',
      p_description: `Purchased ${credits} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ''}`,
      p_metadata: {
        packageId,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        credits,
        bonusCredits,
      },
    });

    if (rpcError) {
      throw rpcError;
    }

    const result = data?.[0];

    if (!result?.success) {
      throw new Error(result?.error_message || 'Failed to add credits');
    }

    captureMessage('Credit purchase completed', 'info', {
      userId,
      totalCredits,
      newBalance: result.new_balance,
      transactionId: result.transaction_id,
      sessionId: session.id,
    });

    console.log(
      `[Credits] Added ${totalCredits} credits to user ${userId}. New balance: ${result.new_balance}`
    );
  } catch (error) {
    captureError(error as Error, {
      action: 'handle_credit_purchase',
      userId,
      metadata: {
        sessionId: session.id,
        totalCredits,
        packageId,
      },
    });
    throw error;
  }
}

/**
 * Handle expired checkout session
 */
export async function handleCreditCheckoutExpired(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const metadata = session.metadata;

  if (metadata?.type !== 'credit_purchase') {
    return;
  }

  // Update purchase record to expired
  await supabase
    .from('credit_purchases')
    .update({ status: 'expired' })
    .eq('stripe_checkout_session_id', session.id);

  captureMessage('Credit checkout expired', 'info', {
    sessionId: session.id,
    userId: metadata.userId,
  });
}

/**
 * Handle failed payment for credits
 */
export async function handleCreditPaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  captureMessage('Credit payment failed', 'warning', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    error: paymentIntent.last_payment_error?.message,
  });

  // Update any associated purchases
  await supabase
    .from('credit_purchases')
    .update({
      status: 'failed',
      metadata: {
        failureMessage: paymentIntent.last_payment_error?.message,
        failureCode: paymentIntent.last_payment_error?.code,
      },
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}
