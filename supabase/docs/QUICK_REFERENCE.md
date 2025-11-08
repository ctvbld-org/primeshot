# Quick Reference: Monthly Subscription Credits

## 🎯 What Was Implemented

**Problem**: Yearly subscribers only got credits once/year (when Stripe billed them)  
**Solution**: Hybrid system awards credits monthly for ALL subscriptions

## 📦 Files Created/Modified

### Created:
1. `supabase/migrations/20251108110254_add_subscription_month_tracking_and_idempotency.sql`
   - Adds month tracking & idempotency protection
   
2. `supabase/migrations/20251108110255_retroactive_credit_awards.sql`
   - One-time script to award missed months to existing users
   
3. `supabase/functions/award-monthly-credits/index.ts`
   - Cron job that awards monthly credits
   
4. `supabase/functions/award-monthly-credits/README.md`
   - Documentation for the Edge Function
   
5. `DEPLOYMENT_GUIDE_MONTHLY_CREDITS.md`
   - Step-by-step deployment instructions
   
6. `IMPLEMENTATION_SUMMARY.md`
   - Technical details and architecture

### Modified:
1. `webapp/src/app/api/payment/webhook/route.ts`
   - Added idempotency protection
   - Updated to track month numbers
   - Records all webhook events

## 🚀 Deployment Steps (Quick)

```bash
# 1. Run migrations
cd /path/to/project
supabase db push

# 2. Deploy Edge Function
supabase functions deploy award-monthly-credits

# 3. Set cron secret
supabase secrets set CRON_SECRET_TOKEN="$(openssl rand -hex 32)"

# 4. Configure cron trigger (see DEPLOYMENT_GUIDE)
# - GitHub Actions (recommended)
# - OR Vercel Cron
# - OR Supabase Cron

# 5. Run retroactive migration
supabase db execute -f supabase/migrations/20251108110255_retroactive_credit_awards.sql

# 6. Update types
cd webapp
supabase gen types typescript --local > src/types/supabase.ts
```

## ✅ Quick Verification

```sql
-- 1. Should return 0 (all subscriptions current)
SELECT COUNT(*) FROM get_subscriptions_needing_monthly_credits();

-- 2. Check recent credit awards
SELECT 
  metadata->>'award_type' AS type,
  COUNT(*) AS count,
  SUM(credits) AS total
FROM user_credits
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND transaction_type = 'earned'
GROUP BY type;

-- 3. Check for failed webhooks
SELECT COUNT(*) FROM webhook_events WHERE status = 'failed';
```

## 🔍 Monitoring Commands

```bash
# View Edge Function logs
supabase functions logs award-monthly-credits --tail

# Test webhook
stripe listen --forward-to localhost:3000/api/payment/webhook
stripe trigger invoice.payment_succeeded

# Test Edge Function locally
supabase functions serve award-monthly-credits
curl -X POST http://localhost:54321/functions/v1/award-monthly-credits \
  -H "Authorization: Bearer test" -H "Content-Type: application/json"
```

## 🛡️ Idempotency Protection (4 Layers)

1. **Webhook Event ID** - Checks `webhook_events` table
2. **Invoice ID** - Checks `user_credits.invoice_id`
3. **Database Constraint** - `UNIQUE (source_id, invoice_id)`
4. **Month Tracking** - `last_awarded_month` prevents re-awards

## 📊 How It Works

### Monthly Subscriptions (No Change)
```
Month 0: Subscribe → Webhook awards credits
Month 1: Renewal → Webhook awards credits
Month 2: Renewal → Webhook awards credits
```

### Yearly Subscriptions (NEW!)
```
Month 0: Subscribe → Webhook awards credits
Month 1: (no payment) → Cron awards credits
Month 2: (no payment) → Cron awards credits
...
Month 12: Renewal → Webhook awards credits
```

## 🔧 Common Tasks

### Check Subscription Status
```sql
SELECT 
  stripe_subscription_id,
  plan_name,
  last_awarded_month,
  (EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER * 12 + 
   EXTRACT(MONTH FROM AGE(NOW(), created_at))::INTEGER) AS months_elapsed
FROM user_subscriptions
WHERE status = 'active';
```

### Manually Award Credits
```sql
SELECT award_monthly_subscription_credits(
  p_user_id := '[user-uuid]',
  p_subscription_id := 'sub_xxx',
  p_month_number := 5,
  p_credits := 150,
  p_plan_name := 'pro'
);
```

### View Audit Trail
```sql
SELECT * FROM credit_award_audit 
ORDER BY awarded_at DESC 
LIMIT 50;
```

## ⚠️ Important Notes

1. **Cron runs daily** - Credits awarded within 24h of due date
2. **Webhooks still primary** - Immediate for payments
3. **Idempotency guaranteed** - Safe to run multiple times
4. **Calendar months** - Uses PostgreSQL date arithmetic (matches Stripe)
5. **Retroactive only once** - Don't run twice!

## 📚 Full Documentation

- **Deployment**: `DEPLOYMENT_GUIDE_MONTHLY_CREDITS.md`
- **Technical Details**: `IMPLEMENTATION_SUMMARY.md`
- **Edge Function**: `supabase/functions/award-monthly-credits/README.md`

## 🆘 Troubleshooting

**Credits not awarded?**
```sql
-- Check if subscriptions need credits
SELECT * FROM get_subscriptions_needing_monthly_credits();

-- Check cron job logs
-- supabase functions logs award-monthly-credits
```

**Duplicate credits?**
```sql
-- Should return 0 rows
SELECT source_id, invoice_id, COUNT(*) 
FROM user_credits 
WHERE invoice_id IS NOT NULL 
GROUP BY source_id, invoice_id 
HAVING COUNT(*) > 1;
```

**Webhook failing?**
```sql
-- Check recent failures
SELECT * FROM webhook_events 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

**Status**: ✅ Ready for Deployment  
**Date**: November 8, 2025  
**Next Step**: Follow DEPLOYMENT_GUIDE_MONTHLY_CREDITS.md

