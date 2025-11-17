#!/bin/bash

# Welcome Email Configuration Script
# This script helps you configure the welcome email system

set -e

echo "=========================================="
echo "Welcome Email Configuration Helper"
echo "=========================================="
echo ""

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Get project reference
echo "📋 Step 1: Project Reference"
echo "----------------------------------------"
echo "Your Supabase project URL looks like:"
echo "  https://[PROJECT_REF].supabase.co"
echo ""
read -p "Enter your project reference: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: Project reference is required"
    exit 1
fi

# Generate or input secret
echo ""
echo "🔐 Step 2: Webhook Secret"
echo "----------------------------------------"
read -p "Generate new secret? (y/n): " GENERATE_SECRET

if [[ "$GENERATE_SECRET" =~ ^[Yy]$ ]]; then
    HOOK_SECRET=$(openssl rand -hex 32)
    echo "✅ Generated secret: $HOOK_SECRET"
else
    read -p "Enter existing secret: " HOOK_SECRET
fi

if [ -z "$HOOK_SECRET" ]; then
    echo "❌ Error: Secret is required"
    exit 1
fi

# Create SQL file
echo ""
echo "📝 Step 3: Creating configuration SQL"
echo "----------------------------------------"

SQL_FILE="supabase/temp-welcome-config.sql"

cat > "$SQL_FILE" << EOF
-- Auto-generated configuration for welcome email system
-- Generated: $(date)

-- Update configuration
SELECT app.update_welcome_email_config(
  '$PROJECT_REF',
  '$HOOK_SECRET'
);

-- Verify configuration
SELECT * FROM app.welcome_email_status;

-- Show current config (without exposing full secret)
SELECT 
  project_ref,
  LEFT(welcome_hook_secret, 8) || '...' as secret_preview,
  updated_at
FROM app.config 
WHERE id = 1;
EOF

echo "✅ Created: $SQL_FILE"

# Instructions
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1️⃣  Apply database configuration:"
echo "   Run this SQL in Supabase SQL Editor:"
echo "   https://app.supabase.com/project/$PROJECT_REF/sql/new"
echo ""
echo "   Or run locally:"
echo "   supabase db execute -f $SQL_FILE"
echo ""
echo "2️⃣  Set Edge Function environment variables:"
echo "   Go to: https://app.supabase.com/project/$PROJECT_REF/functions/send-welcome-email/secrets"
echo ""
echo "   Add these secrets:"
echo "   WELCOME_HOOK_SECRET = $HOOK_SECRET"
echo "   RESEND_API_KEY = [your Resend API key]"
echo "   RESEND_FROM = Primeshot <info@mail.primeshot.ai>"
echo ""
echo "3️⃣  Verify Edge Function is deployed:"
echo "   supabase functions deploy send-welcome-email"
echo ""
echo "4️⃣  Test with a new user signup"
echo ""
echo "5️⃣  Check logs if emails aren't received:"
echo "   https://app.supabase.com/project/$PROJECT_REF/functions/send-welcome-email/logs"
echo ""
echo "=========================================="
echo "✅ Configuration prepared!"
echo "=========================================="

