# Monthly Subscription Credit Allocation - Deployment Guide

## Overview

This system ensures that **yearly subscription users receive monthly credits** automatically, even though they're only billed once per year by Stripe.

### Problem Solved
- **Before**: Yearly subscribers only received credits once per year when Stripe billed them
- **After**: All subscribers (monthly & yearly) receive credits every month

### How It Works
1. **Webhooks** handle immediate credit awards when Stripe processes payments
2. **Cron Job** awards monthly credits for yearly subscriptions between billing cycles
3. **Idempotency Protection** prevents duplicate credit awards from concurrent webhooks or cron runs

---

## Prerequisites

- ✅ Supabase project with database access
- ✅ Stripe webhook configured
- ✅ Service role key for Edge Functions
- ✅ Access to run migrations

---

## Deployment Steps

### Step 1: Run Database Migrations

**Migration 1: Add tracking and idempotency**

```bash
cd /path/to/project
supabase db push
```

This migration adds:
- `last_awarded_month` column to `user_subscriptions`
- `invoice_id` column to `user_credits`
- `webhook_events` table for deduplication
- `credit_award_audit` table for audit trail
- `award_subscription_credits_idempotent()` RPC function
- `award_monthly_subscription_credits()` RPC function
- `get_subscriptions_needing_monthly_credits()` helper function

**Verify migration:**

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND column_name = 'last_awarded_month';

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('webhook_events', 'credit_award_audit');

-- Check RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%subscription_credits%';
```

### Step 2: Deploy Edge Function

**Deploy the function:**

```bash
supabase functions deploy award-monthly-credits
```

**Set the cron secret:**

```bash
# Generate a secure random token
CRON_TOKEN=$(openssl rand -hex 32)

# Set it as a Supabase secret
supabase secrets set CRON_SECRET_TOKEN="$CRON_TOKEN"

# Save it somewhere secure (you'll need it for cron configuration)
echo "CRON_SECRET_TOKEN=$CRON_TOKEN" >> .env.local
```

**Verify deployment:**

```bash
# Test the function locally first
supabase functions serve award-monthly-credits &

# In another terminal
curl -X POST http://localhost:54321/functions/v1/award-monthly-credits \
  -H "Authorization: Bearer $CRON_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 3: Configure Cron Trigger

Choose one of these options:

#### Option A: GitHub Actions (Recommended for simplicity)

Create `.github/workflows/award-monthly-credits.yml`:

```yaml
name: Award Monthly Subscription Credits
on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  award-credits:
    runs-on: ubuntu-latest
    steps:
      - name: Award Monthly Credits
        run: |
          response=$(curl -s -w "\n%{http_code}" -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/award-monthly-credits" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json")
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | head -n-1)
          
          echo "Response: $body"
          
          if [ "$http_code" -ne 200 ]; then
            echo "Error: HTTP $http_code"
            exit 1
          fi
```

**Set GitHub Secrets:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add `SUPABASE_URL` (e.g., `https://xxxxx.supabase.co`)
3. Add `CRON_SECRET_TOKEN` (the token you generated earlier)

#### Option B: Vercel Cron

If your app is deployed on Vercel:

**Create API route:** `app/api/cron/award-monthly-credits/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/award-monthly-credits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to award credits' }, { status: 500 });
  }
}
```

**Configure in `vercel.json`:**

```json
{
  "crons": [{
    "path": "/api/cron/award-monthly-credits",
    "schedule": "0 2 * * *"
  }]
}
```

### Step 4: Award Retroactive Credits

**For existing yearly subscribers who missed months:**

```bash
# Run the retroactive migration
supabase db execute -f supabase/migrations/20251108110255_retroactive_credit_awards.sql
```

This will:
- Find all active subscriptions
- Calculate missed months
- Award credits for all past months
- Log everything to audit table

**Verify retroactive awards:**

```sql
-- Check the summary
SELECT 
  metadata->>'total_subscriptions' AS subscriptions_processed,
  metadata->>'total_months' AS months_awarded,
  metadata->>'total_credits' AS credits_awarded,
  awarded_at
FROM credit_award_audit
WHERE award_type = 'retroactive'
ORDER BY awarded_at DESC
LIMIT 1;

-- Check individual subscriptions
SELECT 
  us.stripe_subscription_id,
  us.plan_name,
  us.last_awarded_month,
  COUNT(uc.id) AS credit_entries,
  SUM(uc.credits) AS total_credits
FROM user_subscriptions us
LEFT JOIN user_credits uc ON us.stripe_subscription_id = uc.source_id
WHERE us.status = 'active'
GROUP BY us.stripe_subscription_id, us.plan_name, us.last_awarded_month;
```

### Step 5: Update TypeScript Types

```bash
cd webapp
supabase gen types typescript --local > src/types/supabase.ts
```

### Step 6: Verify Webhook Updates

The webhook handler has been updated to use the new idempotent RPC function. Verify it's working:

1. **Test with Stripe CLI:**

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
stripe trigger invoice.payment_succeeded
```

2. **Check webhook_events table:**

```sql
SELECT * FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Verify credit awards:**

```sql
SELECT 
  uc.*,
  uc.metadata->>'month_number' AS month_number,
  uc.metadata->>'award_type' AS award_type
FROM user_credits uc
WHERE transaction_type = 'earned'
  AND source_type = 'subscription'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Monitoring & Maintenance

### Daily Checks

**1. Check Cron Job Execution:**

```bash
# View Edge Function logs
supabase functions logs award-monthly-credits --tail

# Or check GitHub Actions runs
# Go to: github.com/your-org/your-repo/actions
```

**2. Monitor Credit Awards:**

```sql
-- Credits awarded in last 24 hours
SELECT 
  COUNT(*) AS awards,
  SUM(credits) AS total_credits,
  metadata->>'award_type' AS award_type
FROM user_credits
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND transaction_type = 'earned'
  AND source_type = 'subscription'
GROUP BY metadata->>'award_type';
```

**3. Check for Failed Webhooks:**

```sql
SELECT * FROM webhook_events
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Weekly Checks

**1. Verify All Active Subscriptions Are Current:**

```sql
SELECT * FROM get_subscriptions_needing_monthly_credits();
-- Should return 0 rows if cron is working correctly
```

**2. Audit Trail Review:**

```sql
SELECT 
  DATE(awarded_at) AS date,
  award_type,
  COUNT(*) AS awards,
  SUM(credits_awarded) AS total_credits
FROM credit_award_audit
WHERE awarded_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(awarded_at), award_type
ORDER BY date DESC, award_type;
```

### Troubleshooting

**Issue: Credits not being awarded**

```sql
-- 1. Check if subscriptions are active
SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active';

-- 2. Check if any need credits
SELECT * FROM get_subscriptions_needing_monthly_credits();

-- 3. Check cron job logs
-- Run: supabase functions logs award-monthly-credits

-- 4. Manually trigger for one subscription
SELECT award_monthly_subscription_credits(
  p_user_id := '[user-uuid]',
  p_subscription_id := 'sub_xxx',
  p_month_number := 1,
  p_credits := 150,
  p_plan_name := 'pro'
);
```

**Issue: Duplicate credits awarded**

```sql
-- Check for duplicates (should be none due to unique constraints)
SELECT 
  source_id,
  invoice_id,
  COUNT(*) AS count
FROM user_credits
WHERE transaction_type = 'earned'
  AND source_type = 'subscription'
  AND invoice_id IS NOT NULL
GROUP BY source_id, invoice_id
HAVING COUNT(*) > 1;

-- If duplicates exist, they indicate a bug that bypassed protection
```

**Issue: Webhook signature verification failing**

Check environment variables:
```bash
# Ensure STRIPE_WEBHOOK_SECRET is set correctly
echo $STRIPE_WEBHOOK_SECRET

# Re-create webhook in Stripe dashboard if needed
```

---

## Rollback Plan

If you need to rollback:

### Step 1: Disable Cron

```bash
# GitHub Actions: Disable the workflow
# Vercel: Remove from vercel.json and redeploy
```

### Step 2: Revert Webhook Handler (if needed)

```bash
git revert [commit-hash]
git push
```

### Step 3: Remove Retroactive Credits (if needed)

```sql
-- Mark retroactive credits as refunded
UPDATE user_credits
SET transaction_type = 'refunded'
WHERE metadata->>'award_type' = 'cron_job'
  AND created_at >= '[deployment-date]';
```

### Step 4: Drop New Tables/Columns (if needed)

```sql
-- WARNING: This deletes data!
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS credit_award_audit CASCADE;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS last_awarded_month;
ALTER TABLE user_credits DROP COLUMN IF EXISTS invoice_id;
```

---

## Success Criteria

✅ **Webhook idempotency working**
- No duplicate credits from concurrent webhooks
- All webhook events logged in `webhook_events` table

✅ **Monthly credits working for yearly subscriptions**
- Cron job runs daily without errors
- All active subscriptions have `months_elapsed = last_awarded_month`

✅ **Retroactive credits awarded**
- All existing yearly subscribers received missing months
- Audit trail shows successful completion

✅ **Monitoring in place**
- Cron job logs accessible
- Audit queries documented
- Alerts configured for failures

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Edge Function logs: `supabase functions logs award-monthly-credits`
3. Check audit trail: `SELECT * FROM credit_award_audit ORDER BY awarded_at DESC`
4. Review webhook events: `SELECT * FROM webhook_events WHERE status = 'failed'`

