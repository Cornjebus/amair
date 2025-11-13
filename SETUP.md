# 🛠️ Setup Guide for Amari

This guide will help you set up Amari for local development.

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd amair
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Fill in your credentials in .env

# 4. Run development server
npm run dev
```

## Detailed Setup Instructions

### 1. Clerk Setup

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose authentication methods (Email recommended)
4. Copy your API keys:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
5. Set up webhook for local development:
   - Install ngrok: `npm install -g ngrok`
   - Run: `ngrok http 3000`
   - Copy the HTTPS URL
   - In Clerk Dashboard → Webhooks → Add Endpoint
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.deleted`
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for project to be ready (2-3 minutes)
4. Get your credentials:
   - Go to Project Settings → API
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
5. Set up the database:
   - Go to SQL Editor
   - Click "New Query"
   - Copy the entire contents of `supabase/schema.sql`
   - Paste and click "Run"
   - Verify tables are created in Table Editor

### 3. Stripe Setup

1. Go to [stripe.com](https://stripe.com) and sign up
2. Stay in **Test Mode** for development
3. Get your API keys:
   - Go to Developers → API keys
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
4. Create a product:
   - Go to Products → Add Product
   - Name: "Amari Premium"
   - Price: $9.99
   - Billing period: Monthly
   - Click "Save"
   - Copy the **Price ID** → `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`
5. Set up webhook for local development:
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Login: `stripe login`
   - Forward events: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`
   - Keep this terminal window open while developing

### 4. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys
4. Click "Create new secret key"
5. Copy the key → `OPENAI_API_KEY`
6. Set up billing:
   - Go to Settings → Billing
   - Add payment method
   - Set usage limits (recommended: $50/month for development)

### 5. Verify Setup

Create a `.env` file with all your credentials:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 6. Run the Application

```bash
# Terminal 1: Run the app
npm run dev

# Terminal 2: Forward Stripe webhooks (if testing payments)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Ngrok for Clerk webhooks (if testing auth)
ngrok http 3000
```

### 7. Test Everything

1. **Test Authentication**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Create an account
   - Verify you're redirected to dashboard
   - Check Supabase → Table Editor → users (should have new row)

2. **Test Story Creation**
   - Click "Create Story"
   - Go through the wizard
   - Generate a story
   - Verify story appears in database

3. **Test Payments (Optional)**
   - Go to Pricing page
   - Click "Upgrade to Premium"
   - Use test card: `4242 4242 4242 4242`
   - Any future date, any CVC
   - Complete checkout
   - Verify webhook received in Stripe CLI terminal
   - Check user subscription status updated in database

## Common Issues

### "Missing environment variable" error

Make sure all required variables are in your `.env` file and you've restarted the dev server.

### Clerk webhook not working

- Verify ngrok is running
- Update webhook URL in Clerk dashboard with latest ngrok URL
- Check webhook signing secret matches

### Stripe webhook not working

- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret matches

### Database connection error

- Verify Supabase project is running
- Check all three Supabase credentials are correct
- Verify schema has been run (check Table Editor)

### OpenAI API error

- Verify API key is correct
- Check you have billing set up
- Verify you have available credits

## Development Tips

1. **Use Test Data**
   - Stripe test cards: https://stripe.com/docs/testing
   - Test emails: use + addressing (yourname+test@gmail.com)

2. **Check Logs**
   - Browser console for frontend errors
   - Terminal for API route errors
   - Supabase logs for database errors
   - Stripe CLI for webhook events

3. **Database Queries**
   - Use Supabase Table Editor to view data
   - Use SQL Editor to run custom queries
   - Enable real-time subscriptions if needed

4. **Clear Cache**
   ```bash
   # If you encounter weird caching issues
   rm -rf .next
   npm run dev
   ```

## Next Steps

Once everything is working:

1. Customize the app (colors, text, etc.)
2. Add more features (see TODO in README)
3. Deploy to production (see DEPLOYMENT.md)
4. Set up monitoring and analytics

## Need Help?

- Check the README.md for general information
- Check DEPLOYMENT.md for production setup
- Open an issue on GitHub
- Check service status pages:
  - [Clerk Status](https://status.clerk.com)
  - [Supabase Status](https://status.supabase.com)
  - [Stripe Status](https://status.stripe.com)
  - [OpenAI Status](https://status.openai.com)

---

Happy Coding! 🦋💻
