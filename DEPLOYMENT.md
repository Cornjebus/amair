# 🚀 Amari Deployment Guide - Vercel

## Quick Deployment Steps

### 1. Deploy to Vercel
- Go to https://vercel.com/new
- Import repository: Cornjebus/amair
- Branch: claude/amari-production-setup-011CV65mEyXDtCjhyDb3pN5f
- Framework: Next.js (auto-detected)

### 2. Environment Variables (16 required)

Add these in Vercel Project Settings → Environment Variables:

**Clerk (6 variables):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL=/dashboard
```

**Supabase (3 variables):**
```
NEXT_PUBLIC_SUPABASE_URL=https://pvrghvqtludzieffbfma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cmdodnF0bHVkemllZmZiZm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjIzNzksImV4cCI6MjA3ODYzODM3OX0.4emUGw7OMLaU9_j27ENSe-TbOfzp4pTxduxzzQAMB1w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cmdodnF0bHVkemllZmZiZm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MjM3OSwiZXhwIjoyMDc4NjM4Mzc5fQ.FkvMyeiP6XMU4ZbkJlvnjnp5wGDiRgAvooC4J3fz-zI
```

**Stripe (5 variables):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_YOUR_PRODUCTION_PRICE
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**OpenAI (1 variable):**
```
OPENAI_API_KEY=sk-proj-YOUR_API_KEY
```

**Node (1 variable):**
```
NODE_ENV=production
```

### 3. Get Production Stripe Keys

**Switch Stripe to LIVE mode**, then create product:

```bash
# Get your live secret key from https://dashboard.stripe.com/apikeys

# Create product
stripe products create \
  --name="Amari Premium" \
  --description="Unlimited magical bedtime stories" \
  --api-key YOUR_LIVE_SECRET_KEY

# Create monthly price ($9.99)
stripe prices create \
  -d product=prod_XXXXX \
  -d unit_amount=999 \
  -d currency=usd \
  -d "recurring[interval]=month" \
  --api-key YOUR_LIVE_SECRET_KEY
```

Use the returned `price_XXXXX` for `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`

### 4. Configure Production Webhooks

**Stripe Webhook:**
1. https://dashboard.stripe.com/webhooks (LIVE mode)
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

**Clerk Webhook:**
1. https://dashboard.clerk.com → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret → Add as `CLERK_WEBHOOK_SECRET` in Vercel

### 5. Deploy

Click "Deploy" in Vercel!

---

## After Deployment

1. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
2. Update Clerk redirect URLs to use your domain
3. Update Stripe webhook URL to use your domain
4. Test sign up, story creation, and subscription flow

---

## Testing Checklist

- [ ] Sign up works
- [ ] Dashboard loads
- [ ] Story generation works with correct pronouns
- [ ] Subscription checkout works
- [ ] Webhooks fire and activate subscription
- [ ] User sees premium status after payment

---

**Important:** Use Stripe test mode first, then switch to live mode for production!
