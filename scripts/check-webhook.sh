#!/bin/bash

# Check Stripe Webhook Configuration
# This script helps diagnose webhook issues

set -e

echo "🔍 Checking Stripe Webhook Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI not installed${NC}"
    echo "Install from: https://stripe.com/docs/stripe-cli"
    echo ""
else
    echo -e "${GREEN}✅ Stripe CLI installed${NC}"
fi

# Check environment variables
echo -e "${BLUE}📋 Checking Environment Variables${NC}"
echo ""

if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local found${NC}"

    # Check Stripe keys
    if grep -q "STRIPE_SECRET_KEY" .env.local; then
        echo -e "${GREEN}✅ STRIPE_SECRET_KEY set${NC}"
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY missing${NC}"
    fi

    if grep -q "STRIPE_WEBHOOK_SECRET" .env.local; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET set${NC}"
    else
        echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET missing${NC}"
    fi

    if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing${NC}"
    fi
else
    echo -e "${RED}❌ .env.local not found${NC}"
fi

echo ""

# Check webhook endpoint in production
echo -e "${BLUE}🌐 Checking Production Webhook Endpoint${NC}"
echo ""

WEBHOOK_URL="https://amair.vercel.app/api/webhooks/stripe"
echo "Testing: $WEBHOOK_URL"
echo ""

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible (400 = signature verification required)${NC}"
elif [ "$HTTP_STATUS" = "405" ]; then
    echo -e "${YELLOW}⚠️  Webhook endpoint found but POST not allowed${NC}"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${RED}❌ Could not reach webhook endpoint${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected status code: $HTTP_STATUS${NC}"
fi

echo ""

# Check Vercel production environment
echo -e "${BLUE}☁️  Checking Vercel Production Environment${NC}"
echo ""

echo "Checking STRIPE_WEBHOOK_SECRET in production..."
vercel env ls production | grep STRIPE_WEBHOOK_SECRET | head -1

echo ""

# Instructions
echo -e "${BLUE}📖 Next Steps${NC}"
echo ""
echo "1. Check Stripe Dashboard:"
echo "   https://dashboard.stripe.com/test/webhooks"
echo ""
echo "2. Verify webhook endpoint is configured:"
echo "   URL: https://amair.vercel.app/api/webhooks/stripe"
echo "   Events: checkout.session.completed, customer.subscription.updated"
echo ""
echo "3. If webhook doesn't exist, add it:"
echo "   - Click 'Add endpoint'"
echo "   - Paste the URL above"
echo "   - Select events"
echo "   - Copy the signing secret (whsec_...)"
echo ""
echo "4. Update the webhook secret in Vercel:"
echo "   vercel env rm STRIPE_WEBHOOK_SECRET production --yes"
echo "   vercel env add STRIPE_WEBHOOK_SECRET production"
echo "   (paste the secret from Stripe)"
echo "   vercel --prod"
echo ""
echo "5. Test webhook endpoint:"
echo "   stripe trigger checkout.session.completed"
echo ""
echo -e "${GREEN}Done!${NC}"
