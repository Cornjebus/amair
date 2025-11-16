#!/bin/bash

# Stripe Diagnostic Test Runner
# Runs all Stripe integration tests

echo ""
echo "========================================"
echo "STRIPE DIAGNOSTIC TEST SUITE"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with required environment variables"
    exit 1
fi

# Check for required environment variables
if ! grep -q "STRIPE_SECRET_KEY" .env.local; then
    echo -e "${RED}❌ Error: STRIPE_SECRET_KEY not found in .env.local${NC}"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" .env.local; then
    echo -e "${RED}❌ Error: NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID not found in .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"
echo ""

# Install dependencies if needed
echo "Checking dependencies..."
npm install --silent dotenv

# Run Test 1: API Version
echo -e "${YELLOW}Running Test 1: API Version Validation${NC}"
echo "----------------------------------------"
npx tsx tests/stripe/test-api-version.ts
TEST1_EXIT=$?
echo ""

# Run Test 2: Session Structure
echo -e "${YELLOW}Running Test 2: Session Structure Verification${NC}"
echo "----------------------------------------"
npx tsx tests/stripe/test-session-structure.ts
TEST2_EXIT=$?
echo ""

# Summary
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
if [ $TEST1_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Test 1 (API Version): PASSED${NC}"
else
    echo -e "${RED}❌ Test 1 (API Version): FAILED${NC}"
fi

if [ $TEST2_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Test 2 (Session Structure): PASSED${NC}"
else
    echo -e "${RED}❌ Test 2 (Session Structure): FAILED${NC}"
fi
echo ""

# Exit with failure if any test failed
if [ $TEST1_EXIT -ne 0 ] || [ $TEST2_EXIT -ne 0 ]; then
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
