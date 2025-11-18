# Subscription Upgrade Issue - Investigation & Fix

## Problem
User completed Stripe checkout successfully, but their subscription status in Supabase remained "free" instead of upgrading to "premium".

## What I Added

### 1. Enhanced Webhook Logging ✅
**File**: `/app/api/webhooks/stripe/route.ts`

Added detailed console logging to track the entire webhook flow:

```
🎉 Checkout session completed: [session details]
📝 Processing subscription upgrade: [user/subscription IDs]
💾 Updating user in Supabase: [update details]
✅ User upgraded successfully: [result]
```

This will help you see exactly what's happening (or not happening) when webhooks are received.

### 2. Test Webhook Endpoint ✅
**File**: `/app/api/test-webhook/route.ts`

Manual testing endpoint to verify database updates work:

```bash
# Check if user exists
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId": "user_xxx", "action": "test"}'

# Manually upgrade user (for testing)
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId": "user_xxx", "action": "upgrade"}'
```

### 3. Webhook Diagnostic Script ✅
**File**: `/scripts/check-webhook.sh`

Run this to check webhook configuration:
```bash
./scripts/check-webhook.sh
```

Checks:
- Environment variables
- Webhook endpoint accessibility
- Vercel production settings
- Provides next steps

### 4. Comprehensive Debug Guide ✅
**File**: `/docs/STRIPE_WEBHOOK_DEBUG.md`

Complete troubleshooting guide covering:
- How webhooks should work
- Common failure points
- Step-by-step debugging
- Quick fixes

## Most Likely Root Causes

### 1. 🔴 Webhook Not Configured in Stripe (Most Likely)

**Check**: https://dashboard.stripe.com/test/webhooks

**Expected**:
- Endpoint URL: `https://amair.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, etc.
- Status: Active with recent successful events

**If missing**: Follow instructions in `docs/STRIPE_WEBHOOK_DEBUG.md`

### 2. 🔴 Webhook Secret Mismatch

The signing secret in Vercel Production must match what's in Stripe Dashboard.

**Fix**:
```bash
# Get secret from Stripe Dashboard
# Then update Vercel:
vercel env rm STRIPE_WEBHOOK_SECRET production --yes
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the secret (starts with whsec_)
vercel --prod
```

### 3. 🟡 Webhook Failing Silently

Check Stripe Dashboard → Webhooks → Recent Events for:
- 4xx/5xx error responses
- Missing/incorrect clerk_user_id in metadata
- Any error messages

## How to Debug Now

### Step 1: Check Stripe Webhook Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Look for your webhook endpoint
3. Check recent `checkout.session.completed` events
4. See if they succeeded (200) or failed (4xx/5xx)

### Step 2: Check Recent Checkout Session

From your Stripe logs, get the session ID (starts with `cs_test_...`):

```bash
# View session details
stripe checkout sessions retrieve cs_test_xxxxx
```

Look for:
- `metadata.clerk_user_id` - Should be present
- `customer` - The customer ID
- `subscription` - The subscription ID

### Step 3: Check Vercel Deployment Logs

Go to: https://vercel.com/cornelius-s-projects/amair/logs

Filter for recent webhook calls:
- Look for `🎉 Checkout session completed`
- Check if `📝 Processing subscription upgrade` appears
- Look for `✅ User upgraded successfully` or errors

### Step 4: Test Manually

Use the test endpoint to verify database updates work:

```bash
# Replace with actual Clerk user ID
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId": "user_xxxxx", "action": "upgrade"}'
```

If this works, it means the database update logic is fine and the issue is with webhook delivery.

### Step 5: Replay Failed Webhook

If you find a failed webhook event in Stripe Dashboard:
1. Click on the event
2. Click "Resend"
3. Check Vercel logs for the webhook processing

## Quick Temporary Fix

If you need to upgrade the user immediately while debugging:

```bash
# Use the test endpoint
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "clerkUserId": "THEIR_CLERK_USER_ID",
    "action": "upgrade"
  }'
```

Or update directly in Supabase SQL Editor:
```sql
UPDATE users
SET
  subscription_status = 'premium',
  subscription_end_date = NOW() + INTERVAL '30 days',
  stripe_customer_id = 'cus_xxxxx'
WHERE clerk_id = 'THEIR_CLERK_USER_ID';
```

## Deployment Status

✅ Changes deployed to GitHub
⏳ Waiting for Vercel deployment

After Vercel deploys:
1. Check webhook endpoint is accessible
2. Review logs from the next checkout attempt
3. Should see detailed logging now

## What to Share

When you check Stripe Dashboard, please share:

1. **Does the webhook endpoint exist?**
   - URL: `https://amair.vercel.app/api/webhooks/stripe`
   - Status: Active/Inactive

2. **Recent webhook events**
   - Are `checkout.session.completed` events showing up?
   - What's the response status? (200, 400, 500?)

3. **Recent checkout session ID**
   - From Stripe logs: `cs_test_xxxxx`
   - So I can help check the metadata

4. **Vercel logs**
   - Any webhook-related logs?
   - Any emoji logs (🎉, 📝, ✅) appearing?

This will help pinpoint exactly where the issue is!

---

**Next**: Check Stripe Dashboard and let me know what you find. The enhanced logging will show us exactly what's happening!
