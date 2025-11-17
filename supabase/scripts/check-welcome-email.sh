#!/bin/bash

# Quick verification script for welcome email system status

set -e

echo "=========================================="
echo "Welcome Email System Status"
echo "=========================================="
echo ""

# Check if Supabase is running
if ! supabase status >/dev/null 2>&1; then
    echo "❌ Supabase is not running locally"
    echo "   Run: supabase start"
    exit 1
fi

echo "✅ Supabase is running"
echo ""

# Get project URL
PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
echo "📡 Project URL: $PROJECT_URL"
echo ""

# Check configuration
echo "🔍 Checking database configuration..."
echo "----------------------------------------"

CONFIG_CHECK=$(supabase db execute "SELECT * FROM app.welcome_email_status;" --format csv 2>&1 || echo "error")

if [[ "$CONFIG_CHECK" == *"error"* ]] || [[ "$CONFIG_CHECK" == *"relation"* ]]; then
    echo "❌ Configuration table/view not found"
    echo "   Run migration first: supabase db push"
    exit 1
fi

echo "$CONFIG_CHECK"
echo ""

# Parse configuration status
if echo "$CONFIG_CHECK" | grep -q "true.*Configured"; then
    echo "✅ Configuration is complete"
    
    # Show config preview
    echo ""
    echo "📋 Current Configuration:"
    echo "----------------------------------------"
    supabase db execute "
        SELECT 
            project_ref,
            LEFT(welcome_hook_secret, 8) || '...' as secret_preview,
            updated_at
        FROM app.config 
        WHERE id = 1;
    " --format table
    
else
    echo "⚠️  Configuration incomplete"
    echo ""
    echo "Run setup script:"
    echo "  ./supabase/scripts/setup-welcome-email.sh"
    exit 1
fi

echo ""
echo "🔧 Edge Function Status:"
echo "----------------------------------------"

# Check if Edge Function exists
if [ -d "supabase/functions/send-welcome-email" ]; then
    echo "✅ Edge Function code exists"
    
    # Check environment variables in local .env
    if [ -f "supabase/.env.local" ] || [ -f "supabase/.env" ]; then
        ENV_FILE="supabase/.env.local"
        [ ! -f "$ENV_FILE" ] && ENV_FILE="supabase/.env"
        
        echo ""
        echo "📝 Checking local environment variables:"
        
        if grep -q "WELCOME_HOOK_SECRET" "$ENV_FILE" 2>/dev/null; then
            echo "   ✅ WELCOME_HOOK_SECRET is set"
        else
            echo "   ⚠️  WELCOME_HOOK_SECRET not found in $ENV_FILE"
        fi
        
        if grep -q "RESEND_API_KEY" "$ENV_FILE" 2>/dev/null; then
            echo "   ✅ RESEND_API_KEY is set"
        else
            echo "   ⚠️  RESEND_API_KEY not found in $ENV_FILE"
        fi
        
        if grep -q "RESEND_FROM" "$ENV_FILE" 2>/dev/null; then
            echo "   ✅ RESEND_FROM is set"
        else
            echo "   ⚠️  RESEND_FROM not found in $ENV_FILE"
        fi
    else
        echo "   ⚠️  No .env file found for Edge Functions"
        echo "   Create: supabase/.env.local"
    fi
else
    echo "❌ Edge Function not found"
fi

echo ""
echo "=========================================="
echo "🧪 Testing Options"
echo "=========================================="
echo ""
echo "Test trigger function:"
echo "  supabase db execute -f supabase/setup-welcome-email.sql"
echo ""
echo "Test Edge Function locally:"
echo "  supabase functions serve send-welcome-email"
echo ""
echo "Create test user:"
echo "  (Use your app's signup flow)"
echo ""
echo "View logs:"
echo "  supabase functions logs send-welcome-email"
echo ""
echo "=========================================="

