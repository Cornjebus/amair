# 🚀 Deployment Guide for Amari

This guide will walk you through deploying Amari to production.

## Prerequisites Checklist

Before deploying, ensure you have:

- ✅ GitHub repository with your code
- ✅ Vercel account (or other hosting provider)
- ✅ Production Clerk account
- ✅ Production Supabase project
- ✅ Production Stripe account
- ✅ OpenAI API key with billing enabled

## Step-by-Step Deployment

### 1. Prepare Supabase

1. Create a new project in Supabase for production
2. Run the schema from `supabase/schema.sql`:
   - Go to SQL Editor in Supabase
   - Copy the contents of `supabase/schema.sql`
   - Execute the SQL
3. Verify all tables are created:
   - users
   - children
   - stories
   - story_seeds
   - daily_challenges
4. Note down:
   - Project URL
   - Anon key
   - Service role key

### 2. Configure Clerk

1. Create a production instance in Clerk
2. Configure:
   - Enable Email authentication
   - Set up OAuth providers (optional)
   - Add production domain to allowed domains
3. Create webhook:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.deleted`
   - Copy webhook signing secret
4. Note down:
   - Publishable key
   - Secret key
   - Webhook secret

### 3. Set Up Stripe

1. Switch to Stripe Live mode
2. Create products:
   ```
   Product: Amari Premium
   Price: $9.99/month (recurring)
   ```
3. Create webhook:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy webhook secret
4. Enable Customer Portal in Settings
5. Note down:
   - Publishable key
   - Secret key
   - Webhook secret
   - Monthly price ID

### 4. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `amair` directory if needed

3. **Configure Environment Variables**

   In Vercel Project Settings → Environment Variables, add:

   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   CLERK_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...

   # OpenAI
   OPENAI_API_KEY=sk-...

   # App
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your production URL

### 5. Update Webhooks

1. **Update Clerk Webhook**
   - Go to Clerk Dashboard → Webhooks
   - Edit your webhook
   - Update URL to: `https://your-domain.com/api/webhooks/clerk`

2. **Update Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Edit your webhook
   - Update URL to: `https://your-domain.com/api/webhooks/stripe`

### 6. Configure Custom Domain (Optional)

1. In Vercel:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. Update all services:
   - Update `NEXT_PUBLIC_APP_URL` in Vercel
   - Update Clerk allowed domains
   - Update Stripe webhook URLs
   - Redeploy

### 7. Test Production

1. **Test Authentication**
   - Sign up with a test account
   - Verify user is created in Supabase
   - Check Clerk webhook logs

2. **Test Story Creation**
   - Create a test story
   - Verify it saves to database
   - Test read-aloud feature

3. **Test Payments**
   - Use Stripe test cards in test mode
   - Test checkout flow
   - Verify subscription webhook

4. **Test Webhooks**
   - Check Clerk webhook deliveries
   - Check Stripe webhook deliveries
   - Verify webhook signing

## Post-Deployment Checklist

- ✅ All environment variables are set
- ✅ Webhooks are configured and tested
- ✅ Database schema is up to date
- ✅ SSL certificate is active (automatic with Vercel)
- ✅ Authentication works
- ✅ Story creation works
- ✅ Payment flow works
- ✅ Webhook handlers work
- ✅ Custom domain configured (if applicable)

## Monitoring & Maintenance

### Set Up Error Monitoring

Consider adding Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

### Monitor Database

- Set up Supabase alerts for:
  - High database usage
  - Query performance issues
  - Failed webhook calls

### Monitor Stripe

- Enable email notifications for:
  - Failed payments
  - Subscription cancellations
  - Disputes

### Monitor OpenAI Usage

- Set up billing alerts
- Monitor token usage
- Set spending limits

## Troubleshooting

### Webhook Failures

1. Check webhook signing secrets are correct
2. Verify webhook URLs are accessible
3. Check server logs in Vercel
4. Test with webhook test events

### Database Connection Issues

1. Verify Supabase keys are correct
2. Check RLS policies are set up
3. Verify network connectivity
4. Check Supabase project status

### Payment Issues

1. Verify Stripe keys are in live mode
2. Check webhook secret is correct
3. Verify price IDs match
4. Test with Stripe test cards first

## Rollback Plan

If something goes wrong:

1. In Vercel, go to Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Investigate the issue in the failed deployment logs

## Scaling Considerations

As your app grows, consider:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Set up read replicas in Supabase
   - Implement caching (Redis)

2. **API Rate Limiting**
   - Implement rate limiting for story generation
   - Use Vercel's built-in rate limiting

3. **CDN & Caching**
   - Optimize static assets
   - Use Next.js Image optimization
   - Configure cache headers

4. **Background Jobs**
   - Move long-running tasks to background workers
   - Consider using Vercel Functions with longer timeouts

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Check Stripe webhook logs
4. Check Clerk webhook logs
5. Open an issue in the repository

---

Happy Deploying! 🚀🦋
