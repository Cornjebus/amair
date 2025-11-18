# Production Checkout Session Failure - Root Cause Analysis

## Problem
Checkout sessions fail with 500 error in production: `Failed to load resource: the server responded with a status of 500`

## Root Causes Identified

### 1. ✅ CRITICAL: Newline Characters in Environment Variables
**Location:** `.env.production` (Vercel production environment)

**Issue:** All environment variables have `\n` appended:
```bash
STRIPE_SECRET_KEY="sk_test_51ST7SDKIw4Zz4xBR...\n"
NEXT_PUBLIC_APP_URL="https://myamari.ai\n"
CLERK_SECRET_KEY="sk_test_tF1xKopB6Q9...\n"
```

**Impact:**
- Stripe API rejects authentication (invalid secret key format)
- 500 errors when creating checkout sessions
- Breaks all Stripe operations

**Fix Required:**
```bash
# Clean all environment variables in Vercel dashboard
# Remove the \n from each value

# Correct format:
STRIPE_SECRET_KEY="sk_test_51ST7SDKIw4Zz4xBR..."
NEXT_PUBLIC_APP_URL="https://myamari.ai"
```

### 2. ✅ CRITICAL: Using Test Keys in Production

**Current State:**
- Clerk: `pk_test_...` and `sk_test_...` (test mode)
- Stripe: `pk_test_...` and `sk_test_...` (test mode)

**Impact:**
- Real payments don't work
- Clerk rate limits apply
- Production users can't subscribe
- Console warning: "Clerk has been loaded with development keys"

**Required Production Keys:**

#### Clerk Production Keys
1. Go to https://dashboard.clerk.com
2. Switch to production instance
3. Get production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `pk_live_...`
   - `CLERK_SECRET_KEY` → `sk_live_...`
   - `CLERK_WEBHOOK_SECRET` → new production webhook

#### Stripe Production Keys
1. Go to https://dashboard.stripe.com
2. Toggle to "Live mode" (top right)
3. Get production keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → new production webhook
   - `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` → create production price

### 3. Environment Variable Corruption Source

**Likely Cause:** Vercel CLI or manual entry added newlines

**Verification:**
```bash
# Check current values
vercel env ls

# Pull and inspect
vercel env pull .env.production --environment production
cat .env.production | od -c  # Shows \n characters
```

## Step-by-Step Fix

### Step 1: Clean Vercel Environment Variables

```bash
# For each variable, remove and re-add without newlines

# Example for STRIPE_SECRET_KEY:
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production

# When prompted, paste the value WITHOUT any trailing newlines or spaces
# Press Enter only once after the value
```

**Variables to clean:**
1. `STRIPE_SECRET_KEY`
2. `STRIPE_WEBHOOK_SECRET`
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`
5. `CLERK_SECRET_KEY`
6. `CLERK_WEBHOOK_SECRET`
7. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
8. `NEXT_PUBLIC_APP_URL`
9. `SUPABASE_SERVICE_ROLE_KEY`
10. `OPENAI_API_KEY`

### Step 2: Upgrade to Production Keys

#### Clerk Production Setup
```bash
# 1. Create production instance in Clerk dashboard
# 2. Configure same settings as test instance
# 3. Add production webhook endpoint:
#    https://myamari.ai/api/webhooks/clerk

# 4. Update environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# Paste: pk_live_...

vercel env add CLERK_SECRET_KEY production
# Paste: sk_live_...

vercel env add CLERK_WEBHOOK_SECRET production
# Paste: whsec_... (from production webhook)
```

#### Stripe Production Setup
```bash
# 1. Switch to Live mode in Stripe dashboard
# 2. Create production price for monthly subscription
# 3. Set up production webhook endpoint:
#    https://myamari.ai/api/webhooks/stripe
#    Events: checkout.session.completed, customer.subscription.updated, etc.

# 4. Update environment variables
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_live_...

vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_...

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_... (from production webhook)

vercel env add NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID production
# Paste: price_... (production price ID)

vercel env add STRIPE_MONTHLY_PRICE_ID production
# Paste: price_... (same production price ID)
```

### Step 3: Verify Configuration

```bash
# Pull fresh environment
vercel env pull .env.production.clean --environment production

# Verify no newlines
cat .env.production.clean | grep -v "^#" | grep "\\\\n"
# Should return nothing

# Check values are correct
cat .env.production.clean
```

### Step 4: Deploy and Test

```bash
# Trigger new deployment
git commit --allow-empty -m "fix: Clean environment variables and use production keys"
git push

# After deployment, test checkout flow:
# 1. Navigate to https://myamari.ai/dashboard
# 2. Click "Upgrade to Premium"
# 3. Verify redirect to Stripe checkout
# 4. Test with Stripe test card (in test mode) or real card (in live mode)
```

## Testing Checklist

- [ ] No console warning about "development keys"
- [ ] Clerk shows `pk_live_...` in network requests
- [ ] Stripe checkout redirects successfully
- [ ] No 500 errors in browser console
- [ ] Checkout session creation logs show success in Vercel
- [ ] Webhook events received in Stripe dashboard
- [ ] User subscription status updates correctly

## Prevention

1. **Always verify environment variables after adding:**
   ```bash
   vercel env pull --environment production
   cat .env.production | grep "\\\\n"
   ```

2. **Use production keys in production:**
   - Never use `pk_test_` or `sk_test_` in live environments
   - Set up proper webhook endpoints for production domain

3. **Monitor logs:**
   ```bash
   vercel logs [deployment-url]
   ```

## Code Changes Not Required

The application code is **correct**. The issue is purely **environment configuration**:

- ✅ `app/api/create-checkout-session/route.ts` - Correct
- ✅ `lib/stripe/server.ts` - Correct
- ✅ `lib/config/stripe.ts` - Correct (has fallbacks)
- ✅ `app/(app)/dashboard/page.tsx` - Correct

## Summary

**Immediate Actions:**
1. Remove and re-add all Vercel environment variables (clean `\n` characters)
2. Replace all test keys with production keys
3. Redeploy
4. Test checkout flow

**Why It's Failing:**
- Stripe receives `sk_test_...\n` instead of `sk_test_...`
- Invalid API key format causes authentication failure
- Results in 500 error when creating checkout session

**Expected Result After Fix:**
- ✅ Clean environment variables
- ✅ Production keys in production
- ✅ Successful Stripe checkout redirects
- ✅ Real subscription processing
