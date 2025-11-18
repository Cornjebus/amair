#!/bin/bash

# Script to fix Vercel environment variables by removing \n characters
# This script will clean and re-upload all environment variables

set -e

echo "🔧 Fixing Vercel Environment Variables"
echo "======================================"
echo ""

# Read the clean local environment file
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

# Source the clean environment variables
set -a
source .env.local
set +a

echo "📋 Environment variables to fix:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - STRIPE_MONTHLY_PRICE_ID"
echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "  - NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID"
echo "  - NEXT_PUBLIC_APP_URL"
echo "  - CLERK_SECRET_KEY"
echo "  - CLERK_WEBHOOK_SECRET"
echo "  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - OPENAI_API_KEY"
echo ""

# Function to add environment variable to Vercel
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=$3

    if [ -z "$var_value" ]; then
        echo "⚠️  Skipping $var_name (empty value)"
        return
    fi

    echo "✅ Adding $var_name to $env_type..."
    echo "$var_value" | vercel env add "$var_name" "$env_type" --force
}

# Production environment
echo "🚀 Fixing Production Environment Variables..."
echo ""

# Stripe variables
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "production"
add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "production"
add_env_var "STRIPE_MONTHLY_PRICE_ID" "$NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "production"

# Public Stripe variables
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "production"
add_env_var "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "$NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "production"

# App URL - use production URL
add_env_var "NEXT_PUBLIC_APP_URL" "https://myamari.ai" "production"

# Clerk variables
add_env_var "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY" "production"
add_env_var "CLERK_WEBHOOK_SECRET" "$CLERK_WEBHOOK_SECRET" "production"
add_env_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "production"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_IN_URL" "$NEXT_PUBLIC_CLERK_SIGN_IN_URL" "production"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_UP_URL" "$NEXT_PUBLIC_CLERK_SIGN_UP_URL" "production"
add_env_var "NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL" "$NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL" "production"

# Supabase variables
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production"

# OpenAI
add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY" "production"

echo ""
echo "🎉 Production environment variables updated successfully!"
echo ""

# Preview environment
echo "🔍 Fixing Preview Environment Variables..."
echo ""

add_env_var "NEXT_PUBLIC_APP_URL" "https://myamari.ai" "preview"
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "preview"
add_env_var "NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "$NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID" "preview"
add_env_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "preview"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_IN_URL" "$NEXT_PUBLIC_CLERK_SIGN_IN_URL" "preview"
add_env_var "NEXT_PUBLIC_CLERK_SIGN_UP_URL" "$NEXT_PUBLIC_CLERK_SIGN_UP_URL" "preview"
add_env_var "NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL" "$NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL" "preview"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "preview"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "preview"

echo ""
echo "🎉 Preview environment variables updated successfully!"
echo ""
echo "✨ All environment variables have been cleaned and updated!"
echo ""
echo "Next steps:"
echo "1. Trigger a redeploy: vercel --prod"
echo "2. Test the checkout session at https://myamari.ai/pricing"
echo ""
