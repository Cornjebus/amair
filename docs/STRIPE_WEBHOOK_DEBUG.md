# Stripe Webhook Debug Guide

## Issue
User completed checkout successfully but their subscription status in Supabase wasn't updated from "free" to "premium".

## Root Cause Analysis

### Webhook Handler Logic (Looks Correct ✅)

The webhook handler in `/app/api/webhooks/stripe/route.ts` is correctly set up to:

1. **On `checkout.session.completed`** (lines 27-61):
   - Extracts `clerk_user_id` from session metadata
   - Updates Supabase user with:
     - `subscription_status: 'premium'`
     - `subscription_end_date`
     - `stripe_customer_id`
   - Finds user by: `.eq('clerk_id', clerkUserId)`

2. **On `customer.subscription.updated`** (lines 64-90):
   - Updates subscription status based on Stripe status
   - Finds user by: `.eq('stripe_customer_id', customerId)`

3. **On `customer.subscription.deleted`** (lines 92-109):
   - Sets status back to 'free'

### Possible Issues

#### 1. Webhook Not Being Called 🔴
**Most Likely Issue**: The webhook endpoint might not be configured in Stripe dashboard or is failing.

**Check:**
- Go to: https://dashboard.stripe.com/test/webhooks
- Look for webhook endpoint: `https://amair.vercel.app/api/webhooks/stripe`
- Check if events are being sent and if they're succeeding/failing

#### 2. Webhook Secret Mismatch 🔴
The webhook secret might not match between Stripe and Vercel.

**Local**: `whsec_OT8rlaHfi1YNzWP3MyQqWXezRGALPf43`
**Production**: Need to verify

#### 3. Metadata Not Being Passed 🟡
The `clerk_user_id` might not be in the checkout session metadata.

**Check in checkout creation** (`/app/api/create-checkout-session/route.ts` line 67-69):
```typescript
metadata: {
  clerk_user_id: userId,
},
```
This looks correct ✅

#### 4. User Not Found in Supabase 🟡
The clerk_id might not match between Clerk and Supabase.

---

## Debugging Steps

### Step 1: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find the webhook for: `https://amair.vercel.app/api/webhooks/stripe`
3. Check **recent events**:
   - Are `checkout.session.completed` events being sent?
   - What's the response status? (200 = success, 4xx/5xx = error)
4. Click on a recent event to see:
   - Request body
   - Response from your endpoint
   - Any error messages

### Step 2: Check Webhook Endpoint Configuration

**Production webhook endpoint should be:**
```
https://amair.vercel.app/api/webhooks/stripe
```

**Events to listen for:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed` (optional)

### Step 3: Verify Webhook Secret

The webhook secret in production must match what's in Stripe:

```bash
# Check production secret
vercel env ls production | grep STRIPE_WEBHOOK_SECRET
```

**If webhook is not configured or secret is wrong:**

1. In Stripe Dashboard → Webhooks
2. Click "Add endpoint" or edit existing
3. Enter: `https://amair.vercel.app/api/webhooks/stripe`
4. Select events (listed above)
5. Copy the **signing secret** (starts with `whsec_`)
6. Update Vercel:
   ```bash
   vercel env rm STRIPE_WEBHOOK_SECRET production --yes
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the secret from Stripe
   vercel --prod
   ```

### Step 4: Test User Lookup

Use the test endpoint to verify the user exists and can be updated:

```bash
# Test - Check if user exists
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "clerkUserId": "YOUR_CLERK_USER_ID",
    "action": "test"
  }'

# Test - Try manual upgrade
curl -X POST https://amair.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "clerkUserId": "YOUR_CLERK_USER_ID",
    "action": "upgrade"
  }'
```

Replace `YOUR_CLERK_USER_ID` with the actual Clerk user ID.

### Step 5: Check Recent Checkout Session

Get the session ID from the successful checkout and check it in Stripe:

```bash
# Get session details
stripe checkout sessions retrieve cs_test_xxxxx
```

Look for:
- `metadata.clerk_user_id` - Should contain the Clerk user ID
- `customer` - The Stripe customer ID
- `subscription` - The subscription ID

### Step 6: Manual Webhook Replay

If webhook failed, you can replay it from Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find your webhook endpoint
3. Click on a failed event
4. Click "Resend" to replay it

---

## Quick Fix Options

### Option A: Manual Database Update (Temporary)

```sql
-- In Supabase SQL Editor
UPDATE users
SET
  subscription_status = 'premium',
  subscription_end_date = NOW() + INTERVAL '30 days',
  stripe_customer_id = 'cus_xxxxx' -- Get from Stripe
WHERE clerk_id = 'YOUR_CLERK_USER_ID';
```

### Option B: Trigger Webhook Manually

```bash
# Use Stripe CLI to trigger a test webhook
stripe trigger checkout.session.completed
```

### Option C: Add Webhook Endpoint

If webhook doesn't exist in Stripe:

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**: `https://amair.vercel.app/api/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Copy signing secret**
5. **Update Vercel env var**
6. **Redeploy**

---

## Webhook Logs to Check

### In Vercel Logs

Check: https://vercel.com/cornelius-s-projects/amair/logs

Look for:
- `checkout.session.completed` events
- Any errors from `/api/webhooks/stripe`
- Console logs showing the update

### In Supabase Logs

Check: https://supabase.com/dashboard → Your Project → Logs

Look for:
- UPDATE queries on `users` table
- Any errors or failed queries

---

## Expected Flow

1. ✅ User clicks "Upgrade" button
2. ✅ `/api/create-checkout-session` creates session with metadata
3. ✅ User completes payment in Stripe
4. 🔴 **Stripe sends webhook** → This might be failing
5. 🔴 **Webhook updates Supabase** → This might not happen
6. ❌ User still shows as "free"

---

## Prevention

### Add Webhook Logging

Update `/app/api/webhooks/stripe/route.ts` to log more details:

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session

  console.log('Checkout completed:', {
    sessionId: session.id,
    customerId: session.customer,
    clerkUserId: session.metadata?.clerk_user_id,
    mode: session.mode,
  })

  // ... rest of code

  console.log('User updated successfully:', {
    clerkUserId,
    newStatus: 'premium'
  })
}
```

### Add Webhook Health Check

Create monitoring endpoint to verify webhook is reachable:

```typescript
// /app/api/webhooks/stripe/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhook_secret_set: !!process.env.STRIPE_WEBHOOK_SECRET,
  })
}
```

Test: `curl https://amair.vercel.app/api/webhooks/stripe/health`

---

## Next Steps

1. **Check Stripe Dashboard** for webhook configuration
2. **Verify webhook secret** matches between Stripe and Vercel
3. **Check recent webhook events** in Stripe for errors
4. **Use test endpoint** to verify user update works
5. **Replay failed webhook** if found in Stripe
6. **Add better logging** for future debugging

Let me know what you find in the Stripe dashboard!
