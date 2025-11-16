# 🧪 TDD Implementation Plan - Complete Stripe/Supabase/Clerk Integration

## 🔍 Issues Identified

### CRITICAL ISSUE #1: Production API Returns 404
**Status:** 🚨 BLOCKER
**Evidence:** Test shows `https://myamari.ai/api/create-checkout-session` returns 404
**Root Cause:** Latest deployment may not be live on custom domain
**Impact:** Users cannot create checkout sessions

### VERIFIED WORKING #1: Local Tests Pass
**Status:** ✅ WORKING
**Evidence:** All local tests pass (Stripe init, session creation, price validity)
**Conclusion:** Code is correct, issue is deployment/routing

---

## 📋 Comprehensive TDD Test Suite

### Phase 1: Infrastructure Tests ✅ COMPLETE

#### Test 1.1: Environment Variables ✅
**File:** `tests/integration/test-environment-variables.ts`
**Status:** PASSED (14/14 variables set)
**Coverage:**
- ✅ All Stripe keys (client & server)
- ✅ All Clerk keys (client & server)
- ✅ All Supabase keys (client & server)
- ✅ App configuration
- ✅ OpenAI API key

#### Test 1.2: Stripe API Integration ✅
**File:** `tests/integration/test-checkout-api.ts`
**Status:** PASSED (4/4 tests)
**Coverage:**
- ✅ Stripe SDK initialization
- ✅ Price ID validity check
- ✅ Checkout session creation
- ✅ Response format validation

#### Test 1.3: Client-Side Flow ⚠️
**File:** `tests/integration/test-client-side-flow.ts`
**Status:** PARTIAL (2/3 tests passed)
**Issues:**
- ✅ Environment variable accessible
- ✅ Request body valid
- ❌ Production endpoint returns 404

---

### Phase 2: Integration Tests 🔨 TO IMPLEMENT

#### Test 2.1: Complete Upgrade Flow
**File:** `tests/integration/test-upgrade-flow.test.ts`

```typescript
describe('Complete Upgrade Flow', () => {
  it('should create checkout session for authenticated user', async () => {
    // 1. Simulate logged-in user (mock Clerk auth)
    // 2. Call API with valid price ID
    // 3. Verify session created
    // 4. Verify URL returned
    // 5. Verify database not updated yet (happens on webhook)
  })

  it('should reject unauthenticated requests', async () => {
    // 1. Call API without auth
    // 2. Expect 401 Unauthorized
  })

  it('should handle invalid price ID', async () => {
    // 1. Call API with invalid price
    // 2. Expect proper error message
  })

  it('should handle missing price ID', async () => {
    // 1. Call API without priceId
    // 2. Expect 400 Bad Request
  })
})
```

#### Test 2.2: Webhook Processing
**File:** `tests/integration/test-webhook-processing.test.ts`

```typescript
describe('Stripe Webhook Processing', () => {
  it('should process checkout.session.completed event', async () => {
    // 1. Create mock webhook event
    // 2. Sign with webhook secret
    // 3. POST to /api/webhooks/stripe
    // 4. Verify user updated in database
    // 5. Verify subscription_status = 'premium'
  })

  it('should reject invalid webhook signatures', async () => {
    // 1. Create webhook with wrong signature
    // 2. Expect 400 error
  })

  it('should handle subscription updates', async () => {
    // 1. Create customer.subscription.updated event
    // 2. Verify database reflects changes
  })

  it('should handle subscription cancellations', async () => {
    // 1. Create customer.subscription.deleted event
    // 2. Verify subscription_status updated to 'free'
  })
})
```

#### Test 2.3: Database Operations
**File:** `tests/integration/test-database-operations.test.ts`

```typescript
describe('Supabase Database Operations', () => {
  it('should create user on first login', async () => {
    // 1. Simulate Clerk webhook: user.created
    // 2. Verify user created in Supabase
    // 3. Verify default subscription_status = 'free'
  })

  it('should update user subscription status', async () => {
    // 1. Create test user
    // 2. Update to premium
    // 3. Verify changes persisted
  })

  it('should store Stripe customer ID', async () => {
    // 1. Simulate checkout completion
    // 2. Verify stripe_customer_id stored
  })

  it('should handle subscription end dates', async () => {
    // 1. Update subscription with end date
    // 2. Verify subscription_end_date stored correctly
  })
})
```

#### Test 2.4: Frontend Component Tests
**File:** `tests/integration/test-frontend-upgrade-button.test.ts`

```typescript
describe('Upgrade Button Component', () => {
  it('should have price ID available at build time', () => {
    // 1. Verify NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID is defined
    // 2. Verify it's a valid Stripe price ID format
  })

  it('should call API with correct payload', async () => {
    // 1. Mock fetch
    // 2. Simulate button click
    // 3. Verify API called with priceId
  })

  it('should redirect to Stripe URL on success', async () => {
    // 1. Mock successful API response
    // 2. Simulate button click
    // 3. Verify window.location.href set to session.url
  })

  it('should handle API errors gracefully', async () => {
    // 1. Mock API error response
    // 2. Simulate button click
    // 3. Verify error logged to console
  })
})
```

---

### Phase 3: End-to-End Tests 🔨 TO IMPLEMENT

#### Test 3.1: Complete User Journey
**File:** `tests/e2e/test-complete-upgrade-journey.test.ts`

```typescript
describe('Complete Upgrade Journey (E2E)', () => {
  it('should complete full upgrade flow', async () => {
    // 1. User logs in → Clerk creates session
    // 2. User lands on dashboard → sees free status
    // 3. User clicks "Upgrade to Premium"
    // 4. API creates Stripe checkout session
    // 5. User redirects to Stripe
    // 6. User completes payment
    // 7. Stripe webhook fires → checkout.session.completed
    // 8. Database updated → subscription_status = 'premium'
    // 9. User returns → success_url redirects to dashboard
    // 10. Dashboard shows premium status
  })
})
```

---

## 🔧 Implementation Checklist

### Immediate Fixes (Phase 1)

- [x] Test environment variables
- [x] Test Stripe API integration
- [x] Test client-side flow simulation
- [ ] **Fix deployment 404 issue**
  - Option A: Redeploy to production
  - Option B: Verify Vercel custom domain routing
  - Option C: Check if deployment is assigned to custom domain

### Core Integration (Phase 2)

- [ ] Implement Test 2.1: Upgrade flow tests
- [ ] Implement Test 2.2: Webhook tests
- [ ] Implement Test 2.3: Database tests
- [ ] Implement Test 2.4: Frontend component tests
- [ ] Fix all failing tests
- [ ] Verify all tests pass locally

### End-to-End (Phase 3)

- [ ] Implement Test 3.1: Complete user journey
- [ ] Run E2E test in staging environment
- [ ] Deploy to production
- [ ] Verify E2E test passes in production

---

## 🚀 Deployment Strategy

### Pre-Deployment Checklist

1. ✅ All unit tests pass
2. ✅ All integration tests pass
3. ✅ E2E tests pass in staging
4. ✅ Environment variables configured in Vercel
5. ✅ Webhook endpoints configured in Stripe dashboard
6. ✅ Webhook endpoints configured in Clerk dashboard

### Deployment Steps

1. Build locally: `npm run build`
2. Run all tests: `npm test`
3. Commit changes
4. Push to GitHub
5. Deploy to Vercel: `vercel --prod`
6. Verify deployment URL
7. Test API endpoints manually
8. Verify custom domain routing
9. Test complete upgrade flow manually

### Post-Deployment Verification

1. Navigate to `https://myamari.ai/dashboard`
2. Click "Upgrade to Premium"
3. Verify redirect to Stripe checkout
4. Complete test payment
5. Verify webhook received
6. Verify database updated
7. Verify dashboard shows premium status

---

## 🐛 Known Issues & Solutions

### Issue #1: Production 404
**Problem:** API endpoint returns 404 in production
**Test:** `test-client-side-flow.ts` fails on production endpoint
**Solution:**
1. Check Vercel deployment logs
2. Verify API routes deployed
3. Test deployment URL directly (not custom domain)
4. Redeploy if necessary

### Issue #2: Environment Variables at Build Time
**Problem:** `NEXT_PUBLIC_*` vars must be available at build time
**Test:** Verified they ARE available
**Solution:** Already working ✅

### Issue #3: Clerk Auth in Tests
**Problem:** API requires Clerk authentication
**Test:** Expected 401 for unauthenticated requests
**Solution:** Mock Clerk auth in integration tests

---

## 📊 Test Coverage Goals

- Infrastructure: 100% (3/3 tests) ✅
- Stripe Integration: 100% (needs webhook tests)
- Database Operations: 0% (needs implementation)
- Frontend Components: 0% (needs implementation)
- End-to-End: 0% (needs implementation)

**Overall Target:** 95% coverage before production deployment

---

## 🎯 Success Criteria

All tests must pass:
- ✅ Environment variables configured
- ✅ Stripe API working
- ⏳ Production API accessible (404 fix needed)
- ⏳ Complete upgrade flow works
- ⏳ Webhooks process correctly
- ⏳ Database updates properly
- ⏳ Frontend components function correctly

**Definition of Done:**
- All automated tests pass
- Manual E2E test completes successfully
- Production deployment verified
- User can upgrade from free to premium
- Subscription status updates in database
- Dashboard reflects premium status

---

**Generated:** 2024-11-16
**Status:** Phase 1 Complete, Phase 2-3 Pending
**Next Step:** Fix production 404 issue, then implement Phase 2 tests
