/**
 * Subscription System Types
 */

export type SubscriptionTier = 'free' | 'dream_weaver' | 'magic_circle' | 'enchanted_library';
export type BillingCycle = 'monthly' | 'annual' | 'gift' | 'free';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';
export type GiftStatus = 'pending' | 'redeemed' | 'expired' | 'refunded';

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  stories_used: number;
  premium_voices_used: number;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  gift_subscription_id?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPrice {
  id: string;
  tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  price_cents: number;
  currency: string;
  stripe_price_id?: string;
  is_active: boolean;
}

export interface SubscriptionWithLimits extends UserSubscription {
  limits: TierLimits;
  stories_remaining: number;
  premium_voices_remaining: number;
}

// =============================================================================
// TIER TYPES
// =============================================================================

export interface TierLimits {
  monthly_stories: number;
  monthly_premium_voices: number;
  max_children: number;
  max_saved_stories: number;
  features: TierFeatures;
}

export interface TierFeatures {
  web_voice_only?: boolean;
  downloads?: boolean;
  basic_themes?: boolean;
  family_sharing?: number;
  premium_themes?: boolean;
  scheduled_delivery?: boolean;
  analytics?: boolean;
  pdf_download?: boolean;
  mp3_download?: boolean;
  character_voices?: boolean;
  custom_themes?: boolean;
  priority_support?: boolean;
  early_access?: boolean;
  gift_per_year?: number;
}

export interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  limits: TierLimits;
  highlighted?: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

// =============================================================================
// GIFT TYPES
// =============================================================================

export interface GiftPackage {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  duration_months: number;
  price_cents: number;
  currency: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

export interface GiftSubscription {
  id: string;
  purchaser_user_id?: string;
  purchaser_email: string;
  purchaser_name?: string;
  gift_package_id: string;
  tier: SubscriptionTier;
  duration_months: number;
  price_paid_cents: number;
  currency: string;
  redemption_code: string;
  status: GiftStatus;
  recipient_email?: string;
  recipient_name?: string;
  recipient_user_id?: string;
  gift_message?: string;
  delivery_date?: string;
  purchased_at: string;
  redeemed_at?: string;
  expires_at: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
}

export interface GiftPurchaseInput {
  packageId: string;
  purchaserEmail: string;
  purchaserName?: string;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  deliveryDate?: string;
}

export interface GiftRedemptionResult {
  success: boolean;
  error_message?: string;
  tier?: SubscriptionTier;
  duration_months?: number;
  new_period_end?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface CanGenerateStoryResult {
  allowed: boolean;
  reason: string;
  stories_remaining: number;
  premium_voices_remaining: number;
}

export interface RecordStoryResult {
  success: boolean;
  stories_remaining: number;
  premium_voices_remaining: number;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  user_id: string;
  event_type: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'gift_redeemed';
  from_tier?: SubscriptionTier;
  to_tier?: SubscriptionTier;
  billing_cycle?: BillingCycle;
  metadata: Record<string, unknown>;
  created_at: string;
}
