# Webhook Setup Instructions

## Production Deployment URL
`https://amair-y5uj19ve0-cornelius-s-projects.vercel.app`

---

## Stripe Webhook Configuration

### Step 1: Create Stripe Webhook Endpoint
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:**
   ```
   https://amair-y5uj19ve0-cornelius-s-projects.vercel.app/api/webhooks/stripe
   ```
4. **Events to select:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`)

### Step 2: Update Vercel Environment Variable
Once you have the signing secret, run:
```bash
echo "YOUR_STRIPE_WEBHOOK_SECRET_HERE" | vercel env add STRIPE_WEBHOOK_SECRET production
```

Or update via Vercel Dashboard:
1. Go to: https://vercel.com/cornelius-s-projects/amair/settings/environment-variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. Click "Edit" and paste the new secret
4. Save changes

---

## Clerk Webhook Configuration

### Step 1: Create Clerk Webhook Endpoint
1. Go to: https://dashboard.clerk.com
2. Navigate to **"Webhooks"** in the sidebar
3. Click **"Add Endpoint"**
4. **Endpoint URL:**
   ```
   https://amair-y5uj19ve0-cornelius-s-projects.vercel.app/api/webhooks/clerk
   ```
5. **Events to subscribe:**
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Click **"Create"**
7. **Copy the Signing Secret** (starts with `whsec_`)

### Step 2: Update Vercel Environment Variable
Once you have the signing secret, run:
```bash
echo "YOUR_CLERK_WEBHOOK_SECRET_HERE" | vercel env add CLERK_WEBHOOK_SECRET production
```

Or update via Vercel Dashboard:
1. Go to: https://vercel.com/cornelius-s-projects/amair/settings/environment-variables
2. Find `CLERK_WEBHOOK_SECRET` (or add it if missing)
3. Click "Edit" and paste the new secret
4. Save changes

---

## Verification & Testing

### Redeploy After Adding Secrets
After setting up both webhooks, redeploy to pick up the new environment variables:
```bash
vercel --prod --yes
```

### Test Stripe Webhook
Using Stripe CLI:
```bash
# Install Stripe CLI if needed
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Test webhook
stripe trigger checkout.session.completed
```

Or use Stripe Dashboard:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select an event type
5. Check Vercel logs for receipt

### Test Clerk Webhook
In Clerk Dashboard:
1. Go to "Users"
2. Create a test user
3. Check Vercel logs to verify webhook was received:
   ```bash
   vercel logs --prod
   ```

### Monitor Webhook Deliveries

**Stripe:**
- Dashboard: https://dashboard.stripe.com/test/webhooks
- View delivery attempts, response codes, and retry history

**Clerk:**
- Dashboard: https://dashboard.clerk.com → Webhooks
- View delivery logs and response status

---

## Webhook Endpoints Summary

| Service | Endpoint URL | Events |
|---------|-------------|--------|
| **Stripe** | `/api/webhooks/stripe` | `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed` |
| **Clerk** | `/api/webhooks/clerk` | `user.created`, `user.updated`, `user.deleted` |

---

## Troubleshooting

### Webhook Returns 400/401 Error
- Verify the webhook signing secret is correctly set in Vercel
- Check that the environment variable name matches exactly
- Redeploy after updating environment variables

### Webhook Times Out
- Check Vercel function logs for errors
- Verify database connection (Supabase credentials)
- Ensure API route is not throwing unhandled errors

### Test Webhooks Not Triggering
- Verify the webhook URL is correct (check for typos)
- Ensure you selected the correct events
- Check that webhook is enabled in the dashboard

---

## Current Configuration Status

- ✅ Stripe webhook URL ready: `https://amair-y5uj19ve0-cornelius-s-projects.vercel.app/api/webhooks/stripe`
- ✅ Clerk webhook URL ready: `https://amair-y5uj19ve0-cornelius-s-projects.vercel.app/api/webhooks/clerk`
- ⚠️ Webhook secrets need to be updated after endpoint creation
- ⚠️ Redeploy required after adding webhook secrets
