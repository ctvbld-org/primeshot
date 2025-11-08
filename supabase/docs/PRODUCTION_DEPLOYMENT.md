# 🚀 Production Deployment Checklist - Monthly Credits System

## 📋 Pre-Deployment Checklist

- [ ] All staging testing completed successfully
- [ ] Cron job running hourly on staging without issues
- [ ] Credits awarded correctly on staging (verify in database)
- [ ] Edge Function tested on staging
- [ ] Production Supabase project ready
- [ ] Production database backup taken (optional but recommended)

---

## 🗂️ Migrations to Deploy (In Order)

These migrations set up the database schema and functions:

### **1. Core Schema & Functions**
```
20251108110257_add_subscription_month_tracking_and_idempotency.sql
```
- Adds `last_awarded_month` to `user_subscriptions`
- Adds `invoice_id` to `user_credits` with unique index
- Creates `webhook_events` table
- Creates `credit_award_audit` table
- Creates RPC functions for credit allocation

### **2. Retroactive Credit Awards**
```
20251108110258_retroactive_credit_awards.sql
```
- One-time migration to award missed monthly credits
- Awards credits to existing yearly subscriptions

### **3. RPC Function Updates**
```
20251108110260_update_rpc_use_monthly_credits.sql
20251108110261_update_award_function_lookup_credits.sql
```
- Updates RPC functions to look up credits from `subscriptions` table
- Removes hardcoded credit amounts

---

## 📝 Step-by-Step Deployment

### **Step 1: Apply Database Migrations**

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to **Database** > **Migrations**
2. Should show pending migrations
3. Click **Apply** for each in order

**Option B: Via CLI**
```bash
# Get your production connection string from Dashboard > Settings > Database
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Verify:**
```sql
-- Check migrations were applied
SELECT version, name, executed_at 
FROM supabase_migrations.schema_migrations 
WHERE name LIKE '%2025110811%'
ORDER BY version;

-- Should show 4 migrations with today's date
```

---

### **Step 2: Deploy Edge Function**

Get your production project reference:
- Go to Supabase Dashboard
- Look at URL or Settings
- Format: `https://[PROJECT-REF].supabase.co`

```bash
cd /path/to/your/project

# Deploy to production
supabase functions deploy award-monthly-credits --project-ref YOUR-PROD-PROJECT-REF

# Example:
# supabase functions deploy award-monthly-credits --project-ref abcdefghijk
```

**Verify:**
- Go to Dashboard > Edge Functions
- Should see `award-monthly-credits` listed
- Status should be "Active"

---

### **Step 3: Set Environment Variables**

Go to **Dashboard** > **Edge Functions** > `award-monthly-credits` > **Settings**

Add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `CRON_SECRET_TOKEN` | `f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029` | Same as staging (or generate new one) |

Other required variables (should be auto-populated):
- `SUPABASE_URL` - Auto-populated by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-populated by Supabase

Click **Save**.

---

### **Step 4: Setup Cron Job**

**Important:** Use production service role key (different from staging!)

1. **Get Production Service Role Key:**
   - Go to **Settings** > **API**
   - Copy `service_role` key (secret, long JWT)

2. **Create Production Cron Setup:**
   - Copy `setup-cron-job.sql`
   - Replace with production values:
     - URL: Your production Supabase URL
     - Service role key: Your production service role key
     - Cron secret: Same as staging or generate new one

3. **Run in SQL Editor:**
   - Go to **Database** > **SQL Editor**
   - Paste the updated SQL
   - Click **Run**

4. **Verify:**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'award-monthly-subscription-credits';
```

Expected: `schedule = "0 * * * *"`, `active = true`

---

### **Step 5: Test Production**

**Manual Test (before waiting for cron):**

```bash
# Get your production service role key
# Then run:
curl -X POST 'https://YOUR-PROD-PROJECT-REF.supabase.co/functions/v1/award-monthly-credits' \
  -H 'Authorization: Bearer YOUR-PROD-SERVICE-ROLE-KEY' \
  -H 'x-cron-secret: f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029' \
  -H 'Content-Type: application/json'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Monthly credit allocation completed" / "No subscriptions need credits",
  "results": { ... }
}
```

---

### **Step 6: Verify Everything Works**

**1. Check Cron Job Status:**
```sql
-- Wait 1 hour after setup, then check
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'award-monthly-subscription-credits'
ORDER BY start_time DESC
LIMIT 5;
```

**2. Check Credits Awarded:**
```sql
SELECT 
  COUNT(*) AS total_awards,
  SUM(credits) AS total_credits,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_credits
WHERE metadata->>'award_type' = 'cron_job'
  AND created_at >= CURRENT_DATE;
```

**3. Check for Errors:**
```sql
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'award-monthly-subscription-credits'
  AND jrd.status = 'failed'
ORDER BY start_time DESC;
```

---

## 🎯 Final Checklist

- [ ] All 4 migrations applied successfully
- [ ] Edge Function deployed and active
- [ ] `CRON_SECRET_TOKEN` environment variable set
- [ ] Cron job created with production service role key
- [ ] Cron job shows: `schedule = "0 * * * *"`, `active = true`
- [ ] Manual curl test returns 200 OK
- [ ] First hourly run completed successfully (check after 1 hour)
- [ ] Credits awarded to subscriptions correctly
- [ ] No errors in cron job history
- [ ] Monitoring queries bookmarked for regular checks

---

## 📊 Key Differences: Staging vs Production

| Component | Staging | Production |
|-----------|---------|------------|
| **Migrations** | ✅ Same files | ✅ Same files |
| **Edge Function** | ✅ Same code | ✅ Same code |
| **Cron Secret** | Can be same | Can be same or different |
| **Service Role Key** | ⚠️ DIFFERENT | ⚠️ DIFFERENT |
| **Project URL** | ⚠️ DIFFERENT | ⚠️ DIFFERENT |
| **Supabase Project** | Staging | Production |

---

## 🔐 Security Reminders

1. **Never commit** production service role keys to Git
2. **Different keys** for staging and production
3. **Rotate keys** if compromised
4. **Monitor** cron job execution logs regularly
5. **Backup** database before major deployments

---

## 📞 Support

**If something goes wrong:**

1. Check Edge Function logs: Dashboard > Edge Functions > award-monthly-credits > Logs
2. Check cron execution history: Use verification queries above
3. Check database migration status: `SELECT * FROM supabase_migrations.schema_migrations`
4. Rollback if needed (database migrations only - cron can be deleted/recreated)

---

## ✅ Success Criteria

1. ✅ All migrations applied
2. ✅ Edge Function deployed and active
3. ✅ Cron job running hourly
4. ✅ Manual test successful
5. ✅ First automatic run successful
6. ✅ Credits awarded correctly
7. ✅ No errors in logs

---

**🎉 Once complete, the system will automatically award monthly credits every hour!**

Production deployment time: ~15-20 minutes

