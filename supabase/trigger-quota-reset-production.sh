#!/bin/bash
# ============================================================================
# MANUALLY TRIGGER CRON: Fix all expired subscriptions
# ============================================================================
# This will reset quotas AND update period dates for all expired subscriptions
# After this, the hourly cron will work correctly
# ============================================================================

PRODUCTION_URL="https://api.primeshot.ai"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d21wZnloYmFrcnhtbG1rcXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQzNDMzNywiZXhwIjoyMDU5MDEwMzM3fQ.3hxIAgOufxzZDG7KpLanOgXxu8zp1dPerQLtE4vF1kw"
CRON_SECRET="f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029"

echo "🔄 Manually triggering quota reset cron job..."
echo "This will fix all expired subscriptions and update their period dates"
echo ""

curl -X POST \
  "${PRODUCTION_URL}/functions/v1/award-monthly-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  --data '{}' \
  | jq '.'

echo ""
echo "✅ Done! Check the output above for results."
echo ""
echo "Expected: It should find and reset the 5 expired subscriptions"
echo "After this, run the check-period-dates.sql query again to verify all dates are now valid"

