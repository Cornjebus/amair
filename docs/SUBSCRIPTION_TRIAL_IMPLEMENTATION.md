# MyAmari Subscription Trial Implementation Plan

> **Version:** 1.0
> **Created:** December 2025
> **Status:** Ready for Implementation
> **Replaces:** Free Tier Model

---

## Overview

Migrate from a freemium model (free tier + paid tiers) to a **14-day free trial model** that requires payment info upfront. This change:

- Eliminates the free tier entirely
- Adds 14-day trials to Dream Weaver and Magic Circle tiers
- Captures payment method before trial starts
- Auto-charges after trial ends unless cancelled
- Implements trial reminder emails via Resend

---

## New Pricing Structure

| Tier | Monthly | Annual | Trial | Features During Trial |
|------|---------|--------|-------|----------------------|
| ~~Free~~ | ~~$0~~ | ~~$0~~ | ~~N/A~~ | **DEPRECATED** |
| **Dream Weaver** | $6.99 | $59.99 | **14 days free** | 10 stories, 3 premium voices, illustrations |
| **Magic Circle** | $14.99 | $119.99 | **14 days free** | 30 stories, 15 premium voices, illustrations |
| **Enchanted Library** | $29.99 | $249.99 | No trial | 60 stories, 60 premium voices, all features |

**Trial Behavior:**
- User selects Dream Weaver or Magic Circle
- Enters payment method via Stripe Checkout
- Gets full tier features for 14 days
- Charged automatically on day 15 unless cancelled
- Can upgrade to higher tier anytime (trial converts)

---

## Implementation Tasks

### Phase 1: Stripe Configuration

#### 1.1 Update Stripe Products
```
Dream Weaver Monthly → Enable 14-day trial
Dream Weaver Annual → Enable 14-day trial
Magic Circle Monthly → Enable 14-day trial
Magic Circle Annual → Enable 14-day trial
Enchanted Library → No trial (immediate charge)
```

#### 1.2 Stripe Subscription Creation
```typescript
// lib/stripe/create-trial-subscription.ts
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 14,
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel', // Cancel if no payment method
    },
  },
  payment_settings: {
    save_default_payment_method: 'on_subscription',
  },
});
```

#### 1.3 New Webhook Events to Handle
```typescript
// Events to add to webhook handler
'customer.subscription.trial_will_end'  // 3 days before trial ends
'customer.subscription.updated'          // Trial converted to paid
'customer.subscription.deleted'          // Cancelled during trial
```

---

### Phase 2: Remove Free Tier

#### 2.1 Update Tier Configuration
```typescript
// lib/subscription/tiers.ts - REMOVE 'free' from SubscriptionTier type
export type SubscriptionTier = 'dream_weaver' | 'magic_circle' | 'enchanted_library'

// Remove free tier from TIER_CONFIG and TIER_INFO
```

#### 2.2 Update Database
```sql
-- Remove default 'free' tier references
-- Update any existing logic that defaults to 'free'
ALTER TABLE user_subscriptions
  ALTER COLUMN tier SET DEFAULT 'dream_weaver';
```

#### 2.3 Files to Update
- `/lib/subscription/tiers.ts` - Remove free tier
- `/app/(app)/pricing/page.tsx` - Remove free tier card, add trial messaging
- `/app/(app)/dashboard/page.tsx` - Update for trial status display
- `/app/(app)/settings/subscription/page.tsx` - Show trial status/days remaining
- `/components/subscription/pricing-card.tsx` - Add "Start 14-day trial" CTA
- `/middleware.ts` - Update auth logic (no more free access)

---

### Phase 3: Trial UI/UX Updates

#### 3.1 Pricing Page Changes
```
Before: "Get Started Free" → "Subscribe" / "Subscribe" / "Subscribe"
After:  "Start 14-Day Trial" → "Start 14-Day Trial" → "Subscribe Now"
```

**New Copy:**
- Dream Weaver: "Start your 14-day free trial • Cancel anytime"
- Magic Circle: "Start your 14-day free trial • Cancel anytime"
- Enchanted Library: "Subscribe now • Best value for families"

#### 3.2 Trial Status Components
```typescript
// components/subscription/trial-banner.tsx
// Shows: "You have X days left in your trial"
// CTA: "Upgrade now" or "Manage subscription"

// components/subscription/trial-countdown.tsx
// Dashboard widget showing days remaining
```

#### 3.3 Checkout Flow
1. User clicks "Start 14-Day Trial"
2. Stripe Checkout opens (collects card)
3. Subscription created with trial_period_days: 14
4. Redirect to dashboard with welcome message
5. Full tier access begins immediately

---

### Phase 4: Trial Reminder Emails (Resend)

#### 4.1 Install Resend
```bash
npm install resend
```

#### 4.2 Email Templates

**Day 1: Welcome Email**
```
Subject: Welcome to MyAmari! Your magical journey begins ✨

Hi {name},

Welcome to MyAmari! Your 14-day free trial of {tier_name} is now active.

Here's what you can do:
- Create up to {story_limit} personalized bedtime stories
- Use {voice_limit} premium AI voices
- Generate beautiful illustrations for your stories

Get started: {dashboard_link}

Your trial ends on {trial_end_date}. We'll remind you before it ends.

Happy storytelling!
The MyAmari Team
```

**Day 10: 4 Days Left**
```
Subject: 4 days left in your MyAmari trial

Hi {name},

Just a heads up - your MyAmari trial ends in 4 days ({trial_end_date}).

You've created {stories_created} stories so far!

To keep your stories and continue creating:
- Your {tier_name} subscription will automatically start
- You'll be charged {price}/month

Want to change plans or cancel? {manage_link}

Keep the magic going!
The MyAmari Team
```

**Day 13: Trial Ends Tomorrow**
```
Subject: Your MyAmari trial ends tomorrow

Hi {name},

Your 14-day trial ends tomorrow ({trial_end_date}).

What happens next:
✓ Your {tier_name} subscription begins automatically
✓ You'll be charged {price}
✓ All your stories are saved

Need to make changes? {manage_link}

Thank you for trying MyAmari!
The MyAmari Team
```

#### 4.3 Email Triggers

| Trigger | When | Email |
|---------|------|-------|
| `subscription.created` (with trial) | Immediately | Welcome |
| `customer.subscription.trial_will_end` | 3 days before | Day 10 (4 days left) |
| Cron job or Inngest | Day 13 | Trial ends tomorrow |

#### 4.4 Resend Implementation
```typescript
// lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTrialWelcomeEmail(data: {
  email: string;
  name: string;
  tierName: string;
  storyLimit: number;
  voiceLimit: number;
  trialEndDate: string;
}) {
  await resend.emails.send({
    from: 'MyAmari <hello@myamari.ai>',
    to: data.email,
    subject: 'Welcome to MyAmari! Your magical journey begins ✨',
    react: TrialWelcomeEmail(data), // React email template
  });
}
```

---

### Phase 5: Inngest Jobs for Trial Management

#### 5.1 Trial Email Scheduler
```typescript
// lib/inngest/functions.ts

// Send Day 13 reminder (1 day before trial ends)
export const trialEndingReminder = inngest.createFunction(
  { id: 'trial-ending-reminder' },
  { cron: '0 9 * * *' }, // Run daily at 9 AM
  async ({ step }) => {
    // Find trials ending tomorrow
    const { data: endingTrials } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*, users(*)')
      .eq('status', 'trialing')
      .gte('trial_end', tomorrow)
      .lt('trial_end', dayAfterTomorrow);

    for (const trial of endingTrials) {
      await step.run(`send-reminder-${trial.id}`, async () => {
        await sendTrialEndingEmail(trial);
      });
    }
  }
);
```

---

## Database Changes

### New Columns for user_subscriptions
```sql
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT false;

-- Update status enum to include 'trialing'
-- (May already exist from Stripe webhook handling)
```

### Remove Free Tier References
```sql
-- Check for any users on free tier (should be none per user)
SELECT * FROM user_subscriptions WHERE tier = 'free';

-- Update default tier
ALTER TABLE user_subscriptions
  ALTER COLUMN tier SET DEFAULT NULL;
```

---

## Environment Variables

```bash
# Resend (Email)
RESEND_API_KEY=re_xxxxx

# Updated Stripe (ensure trial-enabled prices)
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY=price_xxx  # With trial
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL=price_xxx   # With trial
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY=price_xxx  # With trial
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL=price_xxx   # With trial
```

---

## Testing Checklist

### Stripe Testing
- [ ] Dream Weaver monthly trial starts correctly
- [ ] Dream Weaver annual trial starts correctly
- [ ] Magic Circle monthly trial starts correctly
- [ ] Magic Circle annual trial starts correctly
- [ ] Enchanted Library charges immediately (no trial)
- [ ] Trial converts to paid after 14 days
- [ ] Cancellation during trial works
- [ ] Upgrade during trial works
- [ ] Webhook `trial_will_end` fires correctly

### Email Testing
- [ ] Welcome email sends on trial start
- [ ] Day 10 reminder sends (use Stripe test clock)
- [ ] Day 13 reminder sends
- [ ] Emails render correctly
- [ ] Unsubscribe links work

### UI Testing
- [ ] Pricing page shows trial CTAs
- [ ] Dashboard shows trial status
- [ ] Settings show trial end date
- [ ] Trial banner appears for trial users
- [ ] No free tier options appear anywhere

---

## Rollout Plan

### Step 1: Prepare (No user impact)
1. Set up Resend account and verify domain
2. Create email templates
3. Update Stripe products with trial settings
4. Deploy code changes (feature flagged)

### Step 2: Soft Launch
1. Enable for new signups only
2. Monitor trial conversions
3. Check email delivery rates
4. Fix any issues

### Step 3: Full Launch
1. Remove free tier from all UI
2. Update marketing site
3. Monitor metrics

---

## Success Metrics

| Metric | Current (Free Tier) | Target (Trial) |
|--------|---------------------|----------------|
| Signup → Paid conversion | ~5-10% | 20-30% |
| Trial → Paid conversion | N/A | 40-60% |
| Revenue per signup | Low | Higher |
| Support tickets (limits) | Frequent | Reduced |

---

## Rollback Plan

If trial model underperforms:
1. Re-enable free tier in Stripe
2. Revert tier configuration
3. Update UI to show free option
4. Keep trial as optional upgrade path

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Trial duration | 14 days |
| Which tiers get trials | Dream Weaver + Magic Circle |
| Enchanted Library | No trial (premium, immediate charge) |
| Existing free users | None exist, deprecate free tier |
| Trial reminder emails | Yes, via Resend (Day 1, 10, 13) |
| Trial features | Full tier features during trial |
