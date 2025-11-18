#!/bin/bash

# Test API Endpoints
# This script tests the health and story generation endpoints

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Amari API Endpoints${NC}"
echo ""

# Determine environment
if [ "$1" == "production" ]; then
    BASE_URL="https://amair.vercel.app"
    ENV="production"
else
    BASE_URL="http://localhost:3000"
    ENV="local"
fi

echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check Endpoint${NC}"
echo "GET $BASE_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks | to_entries[] | "\(.key): \(.value.status)"' 2>/dev/null || echo "Failed to parse")

if [ "$HEALTH_STATUS" == "Failed to parse" ]; then
    echo -e "${RED}❌ Health check failed or returned invalid JSON${NC}"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

echo "$HEALTH_STATUS"
echo ""

# Check if all services are OK
if echo "$HEALTH_STATUS" | grep -q "error"; then
    echo -e "${RED}❌ Some services have errors${NC}"
    echo ""
    echo "Full response:"
    echo "$HEALTH_RESPONSE" | jq '.'
    exit 1
else
    echo -e "${GREEN}✅ All services healthy${NC}"
fi

echo ""
echo "Full health check response:"
echo "$HEALTH_RESPONSE" | jq '.'
echo ""

# Test 2: OpenAI API Key Direct Test
echo -e "${BLUE}Test 2: OpenAI API Key Validation${NC}"
echo ""

if [ -f .env.local ]; then
    source .env.local

    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  OPENAI_API_KEY not found in .env.local${NC}"
    else
        echo "Testing OpenAI API key directly..."
        OPENAI_RESPONSE=$(curl -s https://api.openai.com/v1/models \
            -H "Authorization: Bearer $OPENAI_API_KEY" 2>&1)

        if echo "$OPENAI_RESPONSE" | jq -e '.data' >/dev/null 2>&1; then
            MODEL_COUNT=$(echo "$OPENAI_RESPONSE" | jq '.data | length')
            echo -e "${GREEN}✅ OpenAI API key is valid ($MODEL_COUNT models available)${NC}"
        else
            echo -e "${RED}❌ OpenAI API key is invalid${NC}"
            echo "Error: $OPENAI_RESPONSE"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found, skipping direct OpenAI test${NC}"
fi

echo ""

# Test 3: Story Generation (requires authentication)
echo -e "${BLUE}Test 3: Story Generation Endpoint${NC}"
echo ""
echo -e "${YELLOW}Note: This test requires authentication${NC}"
echo "To test manually, use the app UI or provide a Clerk auth token"
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ API Testing Complete${NC}"
echo ""
echo "Next steps:"
echo "1. If health check passed: Test story generation in the UI"
echo "2. If OpenAI failed: Generate a new API key at https://platform.openai.com/api-keys"
echo "3. If Supabase failed: Check database connection and service role key"
echo ""
