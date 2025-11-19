# Amari Monetization - Quick Start Guide

**Status**: ✅ Phase 1 Complete - Ready for Database Migration

---

## What's Been Implemented

✅ **Core Subscription System**
- Multi-tier subscription management (Free, Dream Weaver, Magic Circle, Enchanted Library)
- Usage tracking and enforcement
- Billing period management
- Subscription upgrade/downgrade logic
- Stripe webhook integration

✅ **Database Schema**
- Migration files created and ready to apply
- Tier configuration table
- Usage tracking table
- RLS policies and indexes

✅ **Test Suite**
- Comprehensive unit tests for all components
- Migration validation tests
- Integration test scenarios

---

## Next Steps (In Order)

### 1. Apply Database Migration

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push

# Regenerate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
```

**Why This Is Important**: The migration creates new tables and columns. TypeScript types must be regenerated for the code to compile.

### 2. Create Stripe Products

Go to Stripe Dashboard → Products and create 3 products with 6 total price IDs:

**Dream Weaver** - $6.99/month, $59.99/year
**Magic Circle** - $14.99/month, $119.99/year
**Enchanted Library** - $29.99/month, $249.99/year

Save all 6 price IDs for step 3.

### 3. Update Environment Variables

Add the 6 new price IDs to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL=price_xxx
```

And add them to Vercel:
```bash
vercel env add NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY
# ... repeat for all 6 price IDs
```

### 4. Test the System

```bash
# Type check should pass after regenerating types
npm run type-check

# Run tests
npm test tests/subscription/

# Start dev server
npm run dev

# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### 5. Integrate Usage Tracking

Update `app/api/generate-story/route.ts` to check and track usage:

```typescript
import { canGenerateStory, trackStoryGeneration } from '@/lib/subscription/usage'
import { getUserSubscription } from '@/lib/subscription/manager'

// Before generating story
const subscription = await getUserSubscription(userId)
const canGenerate = await canGenerateStory(
  userId,
  subscription!.tier,
  usePremiumVoice
)

if (!canGenerate.allowed) {
  return NextResponse.json({ error: canGenerate.reason }, { status: 403 })
}

// Generate story...

// After success
await trackStoryGeneration(userId, { usedPremiumVoice })
```

### 6. Deploy

```bash
git add .
git commit -m "feat: Implement multi-tier subscription system"
git push origin main
vercel --prod
```

---

## Files Created

### Core Services
- `lib/subscription/tiers.ts` - Tier configuration and limits
- `lib/subscription/usage.ts` - Usage tracking service
- `lib/subscription/manager.ts` - Subscription management
- `lib/subscription/webhook-handlers.ts` - Stripe webhook handlers

### Database
- `supabase/migrations/001_add_tier_system.sql` - Main migration
- `supabase/migrations/000_rollback_tier_system.sql` - Rollback if needed

### Tests
- `tests/subscription/tiers.test.ts` - Tier configuration tests
- `tests/subscription/usage.test.ts` - Usage tracking tests
- `tests/database/migration.test.ts` - Migration validation tests

### Documentation
- `docs/IMPLEMENTATION_STATUS.md` - Detailed status and architecture
- `docs/SETUP_GUIDE.md` - Step-by-step setup instructions
- `docs/QUICKSTART.md` - This file

### Configuration
- `lib/config/stripe.ts` - Updated with new tier price IDs
- `.env.example` - Updated with new environment variables
- `app/api/webhooks/stripe/route.ts` - Updated webhook handler

---

## Current Limitations

⚠️ **TypeScript Errors**: The code has type errors because database types need regeneration. This is expected and will be fixed after step 1.

⚠️ **No UI Yet**: The pricing page and usage dashboard are not implemented. Phase 2 will add these.

⚠️ **Story Generation Not Integrated**: Usage tracking is not yet integrated into the story generation API. This needs to be done in step 5.

---

## Troubleshooting

**Problem**: TypeScript errors about missing columns
```bash
# Solution: Regenerate types after migration
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
```

**Problem**: Stripe webhook fails
```bash
# Solution: Check webhook secret
echo $STRIPE_WEBHOOK_SECRET
# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Problem**: Migration fails
```bash
# Solution: Check if already applied
# In Supabase SQL Editor:
SELECT * FROM supabase_migrations.schema_migrations;

# If needed, rollback and retry
supabase db reset
supabase db push
```

---

## Success Criteria

✅ Database migration applied successfully
✅ TypeScript builds without errors
✅ All tests passing
✅ Stripe products created
✅ Environment variables configured
✅ Webhooks working (test with Stripe CLI)
✅ Story generation checks usage limits
✅ Usage tracked after story generation

---

## Support

- **Implementation Status**: See `docs/IMPLEMENTATION_STATUS.md`
- **Detailed Setup**: See `docs/SETUP_GUIDE.md`
- **Full Plan**: See `docs/MONETIZATION_IMPLEMENTATION_PLAN.md`

---

**Ready to start? Begin with Step 1: Apply Database Migration** 🚀
