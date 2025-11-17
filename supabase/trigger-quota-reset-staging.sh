#!/bin/bash
# ============================================================================
# MANUALLY TRIGGER CRON: Fix all expired subscriptions on STAGING
# ============================================================================
# This will reset quotas AND update period dates for all expired subscriptions
# After this, the hourly cron will work correctly
# ============================================================================

STAGING_URL="https://npalbinvsvbyddagwvjx.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWxiaW52c3ZieWRkYWd3dmp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAzNDAyMSwiZXhwIjoyMDcyNjEwMDIxfQ.3AXeJJi8H2h6LI_HLfQmH2ZMwYdwP78gEG4e4JfK1KU"
CRON_SECRET="f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029"

echo "🔄 Manually triggering quota reset cron job on STAGING..."
echo "This will fix all expired subscriptions and update their period dates"
echo ""

curl -X POST \
  "${STAGING_URL}/functions/v1/award-monthly-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  --data '{}' \
  | jq '.'

echo ""
echo "✅ Done! Check the output above for results."
echo ""
echo "Expected: It should find and reset any expired subscriptions"
echo "After this, the hourly cron will keep dates updated automatically"

