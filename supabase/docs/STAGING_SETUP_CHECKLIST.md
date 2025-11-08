# 🚀 Staging Deployment Checklist - Monthly Credits System

## ✅ Completed (You mentioned these are done)
- [x] Database migrations deployed to staging
- [x] Edge Function `award-monthly-credits` deployed to staging

---

## 📋 TODO: Setup pg_cron (5 minutes)

### Step 1: Get Your Staging Project Reference
1. Go to Supabase Dashboard
2. Look at the URL or Settings to find your project reference
   - Example: `abcdefghijklmn` from `https://abcdefghijklmn.supabase.co`

### Step 2: Update and Run SQL Script
1. Open `setup-cron-staging.sql` (I just created it)
2. Replace `YOUR-STAGING-PROJECT-REF` with your actual project ref
3. Copy the entire SQL script
4. Go to Supabase Dashboard > **SQL Editor**
5. Paste and run the script

**What it does:**
- Enables pg_cron extension
- Configures your staging URL
- Sets the secret token: `f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029`
- Schedules daily job at 2 AM UTC

### Step 3: Add Environment Variable to Edge Function
1. Go to Supabase Dashboard > **Edge Functions**
2. Click on `award-monthly-credits`
3. Go to **Settings** tab
4. Click **Add Secret**
5. Add:
   - **Key:** `CRON_SECRET_TOKEN`
   - **Value:** `f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029`
6. Click **Save**

### Step 4: Verify Setup
Run this query in SQL Editor:

```sql
-- Should show 1 row with active = true
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'award-monthly-subscription-credits';
```

**Expected result:**
```
jobid | jobname                            | schedule   | active
1     | award-monthly-subscription-credits | 0 2 * * *  | t
```

### Step 5: Test It (Optional but Recommended)

**Option A: Manual Edge Function Test**
```bash
curl -X POST 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/award-monthly-credits' \
  -H 'Authorization: Bearer f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029' \
  -H 'Content-Type: application/json'
```

**Option B: Quick Cron Test (runs every minute for 2 minutes)**

See the testing section in `setup-cron-staging.sql` - uncomment the test queries.

---

## 🎯 What Happens Next?

### Automatic Daily Process (Starting Tomorrow at 2 AM UTC)
1. **pg_cron** wakes up at 2 AM UTC
2. Calls your **Edge Function** with the secret token
3. Edge Function calls `get_subscriptions_needing_monthly_credits()` RPC
4. Awards credits to all subscriptions that need them
5. Logs everything to `credit_award_audit` table

### Monitoring Queries

**Check if cron is running:**
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 10;
```

**Check credits awarded today:**
```sql
SELECT 
  COUNT(*) AS awards,
  SUM(credits) AS total_credits
FROM user_credits
WHERE metadata->>'award_type' = 'cron_job'
  AND created_at >= CURRENT_DATE;
```

**Check for errors:**
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

---

## 🔧 Troubleshooting

### Issue: "Could not find setting app.settings.supabase_url"
**Solution:** Reconnect to the database (close SQL Editor and reopen) or run:
```sql
SELECT pg_reload_conf();
```

### Issue: Edge Function returns 401
**Solution:** Double-check the `CRON_SECRET_TOKEN` in Edge Function settings matches the token in database settings.

### Issue: Cron job not appearing
**Solution:** Verify pg_cron is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

## 📊 Success Criteria

After setup, verify:
- [ ] `SELECT * FROM cron.job` shows 1 active job
- [ ] Edge Function has `CRON_SECRET_TOKEN` environment variable
- [ ] Manual curl test to Edge Function returns 200 OK
- [ ] After 24 hours, check `cron.job_run_details` shows successful runs

---

## 🎉 You're Done!

No GitHub Actions needed! Everything runs natively in Supabase.

**Current Token:** `f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029`

**Next:** Wait for 2 AM UTC tomorrow, or run the manual test to verify immediately.

---

## 📁 Files Reference

- **SQL Setup:** `setup-cron-staging.sql` (ready to run)
- **Full Guide:** `SUPABASE_CRON_SETUP.md` (detailed docs)
- **Migration:** `20251108110262_setup_pg_cron_job.sql` (if you want to use migrations instead)

