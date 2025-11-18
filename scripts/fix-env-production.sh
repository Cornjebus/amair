#!/bin/bash

# Fix Environment Variables in Production
# This script cleans and re-adds environment variables to Vercel

set -e

echo "🔧 Fixing Production Environment Variables..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

echo -e "${YELLOW}Step 1: Cleaning environment files${NC}"
# Remove newline characters from all .env.production* files
find . -maxdepth 1 -name ".env.production*" -type f -exec sh -c '
    for file; do
        echo "  Cleaning: $file"
        # Remove \n characters
        sed -i "" "s/\\\\n\"$/\"/g" "$file"
        # Remove actual newline characters in values
        sed -i "" ":a;N;\$!ba;s/\"\n/\"/g" "$file"
    done
' sh {} +

echo ""
echo -e "${YELLOW}Step 2: Source .env.local${NC}"
set -a
source .env.local
set +a

echo ""
echo -e "${YELLOW}Step 3: Re-adding critical environment variables to Vercel Production${NC}"

# Function to add env var
add_env_var() {
    local var_name=$1
    local var_value=$2

    if [ -z "$var_value" ]; then
        echo -e "  ${RED}Skipping $var_name (not set in .env.local)${NC}"
        return
    fi

    echo -e "  Adding: ${GREEN}$var_name${NC}"

    # Remove existing
    vercel env rm "$var_name" production --yes 2>/dev/null || true

    # Add new (clean value, no newlines)
    clean_value=$(echo "$var_value" | tr -d '\n' | tr -d '\r')
    echo "$clean_value" | vercel env add "$var_name" production
}

# Critical environment variables
echo ""
echo "Adding OpenAI..."
add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"

echo ""
echo "Adding Supabase..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "Adding Clerk..."
add_env_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
add_env_var "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
add_env_var "CLERK_WEBHOOK_SECRET" "$CLERK_WEBHOOK_SECRET"

echo ""
echo "Adding Stripe..."
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
add_env_var "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "$NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID"

echo ""
echo "Adding App Configuration..."
add_env_var "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_IN_URL" "$NEXT_PUBLIC_CLERK_SIGN_IN_URL"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_UP_URL" "$NEXT_PUBLIC_CLERK_SIGN_UP_URL"
add_env_var "NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL" "$NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL"

echo ""
echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"
echo ""
echo -e "${YELLOW}Step 4: Verifying environment variables${NC}"
vercel env ls production | grep -E "(OPENAI|SUPABASE|CLERK|STRIPE)" | head -20

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Deploy to production: vercel --prod"
echo "2. Check health endpoint: curl https://amair.vercel.app/api/health"
echo "3. Test story generation"
echo ""
echo -e "${GREEN}Done!${NC}"
