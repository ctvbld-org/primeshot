# Cron Job Management - Monthly Credits

## 📋 Overview

The monthly credit allocation system uses **pg_cron** to run hourly checks for subscriptions needing credits.

**Why not a migration?** Cron jobs are operational configuration, not schema changes. Running SQL directly is:
- ✅ More flexible (easy to change schedule)
- ✅ More secure (no secrets in Git)
- ✅ Environment-specific (different keys per environment)
- ✅ Easier to maintain

---

## 🚀 Setup New Environment

### **1. Get Your Service Role Key**
- Go to Supabase Dashboard
- Settings > API
- Copy `service_role` key (secret, long JWT)

### **2. Run Setup SQL**
1. Open `setup-cron-job.sql`
2. Replace `YOUR-SERVICE-ROLE-KEY-HERE` with your actual key
3. Go to Supabase Dashboard > SQL Editor
4. Paste and run the entire script

### **3. Verify**
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job;
```

Expected: `schedule = "0 * * * *"` (hourly)

---

## 🔧 Common Operations

### **Check Cron Job Status**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'award-monthly-subscription-credits';
```

### **View Recent Executions**
```sql
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'award-monthly-subscription-credits'
ORDER BY start_time DESC
LIMIT 10;
```

### **Change Schedule**
```sql
-- Remove old job
SELECT cron.unschedule('award-monthly-subscription-credits');

-- Create with new schedule
-- Examples:
-- Every 6 hours: '0 */6 * * *'
-- Every 3 hours: '0 */3 * * *'
-- Daily at 2 AM: '0 2 * * *'

-- (Then run the CREATE part from setup-cron-job.sql)
```

### **Disable Cron (Don't Delete)**
```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'award-monthly-subscription-credits';
```

### **Re-enable Cron**
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'award-monthly-subscription-credits';
```

### **Delete Cron Job**
```sql
SELECT cron.unschedule('award-monthly-subscription-credits');
```

---

## 🔐 Security Notes

### **Service Role Key:**
- ⚠️ **NEVER commit** to Git
- 🔒 Treat like a database password
- 🔄 Rotate if compromised
- 📝 Document location (not value!) for team

### **x-cron-secret:**
- ✅ Can be committed (just a validation token)
- 🔑 Set in Edge Function env var: `CRON_SECRET_TOKEN`
- 🎯 Provides second layer of security

---

## 📊 Monitoring

### **Check Credits Awarded Today**
```sql
SELECT 
  COUNT(*) AS awards,
  SUM(credits) AS total_credits,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_credits
WHERE metadata->>'award_type' = 'cron_job'
  AND created_at >= CURRENT_DATE;
```

### **Check for Failed Runs**
```sql
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'award-monthly-subscription-credits'
  AND jrd.status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🌍 Multiple Environments

### **Staging:**
- Use staging service role key
- Same cron secret (or different, your choice)
- URL: `https://npalbinvsvbyddagwvjx.supabase.co`

### **Production:**
- Use production service role key
- Same or different cron secret
- URL: Your production Supabase URL

**Important:** Each environment has its own cron job - they don't sync automatically!

---

## 🆘 Troubleshooting

### **Job Not Running**
```sql
-- Check if active
SELECT active FROM cron.job 
WHERE jobname = 'award-monthly-subscription-credits';

-- If false, enable it
UPDATE cron.job SET active = true 
WHERE jobname = 'award-monthly-subscription-credits';
```

### **401 Unauthorized Errors**
- Check service role key is correct
- Verify `CRON_SECRET_TOKEN` env var in Edge Function
- Ensure both Authorization and x-cron-secret headers are set

### **No Executions in History**
- Check pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verify job schedule is correct
- Wait for next hour (runs at :00 minutes)

---

## 📁 Files

- `setup-cron-job.sql` - Initial setup script (keep service role key out of Git!)
- `CRON_JOB_MANAGEMENT.md` - This file
- `verify-cron-setup.sql` - Verification queries

---

## ✅ Quick Checklist

- [ ] Service role key obtained from Dashboard
- [ ] `setup-cron-job.sql` updated with service role key
- [ ] SQL script run in Supabase SQL Editor
- [ ] Verification query confirms: `schedule = "0 * * * *"`
- [ ] Edge Function has `CRON_SECRET_TOKEN` env var
- [ ] Test execution confirmed (wait 1 hour or trigger manually)
- [ ] Monitoring queries bookmarked for regular checks

