# Monthly Credit Allocation System - Documentation

This directory contains all documentation and scripts for the monthly credit allocation system for yearly subscriptions.

## 📁 File Structure

### Setup Scripts (in `/supabase`)
- **`setup-cron-job.sql`** - Cron job setup for staging environment
- **`setup-cron-job-production.sql`** - Cron job setup for production environment

### Migrations (in `/supabase/migrations`)
- **`20251108110257_add_subscription_month_tracking_and_idempotency.sql`** - Core schema and RPC functions
- **`20251108110258_retroactive_credit_awards.sql`** - One-time retroactive credit awards
- **`20251108110260_update_rpc_use_monthly_credits.sql`** - Updates RPC to use monthly credits
- **`20251108110261_update_award_function_lookup_credits.sql`** - Dynamic credit lookup from subscriptions table
- **`20251108110263_add_audit_logging_to_cron_awards.sql`** - Adds audit logging to cron awards

### Edge Functions (in `/supabase/functions`)
- **`award-monthly-credits/`** - Edge Function called by cron to award monthly credits

### Documentation

#### Quick Start
- **`QUICK_REFERENCE.md`** - Quick reference card for common tasks

#### Setup Guides
- **`STAGING_SETUP_CHECKLIST.md`** - Step-by-step staging setup
- **`PRODUCTION_DEPLOYMENT.md`** - Production deployment guide
- **`LOCAL_TESTING_GUIDE.md`** - Local testing instructions

#### Operational
- **`CRON_JOB_MANAGEMENT.md`** - Managing cron jobs (change schedule, monitor, troubleshoot)

#### Technical
- **`IMPLEMENTATION_SUMMARY.md`** - Technical architecture and implementation details
- **`DEPLOYMENT_GUIDE_MONTHLY_CREDITS.md`** - Comprehensive deployment guide

---

## 🚀 Quick Start

### For Staging:
1. Apply migrations: `supabase db push --project-ref npalbinvsvbyddagwvjx`
2. Deploy Edge Function: `supabase functions deploy award-monthly-credits --project-ref npalbinvsvbyddagwvjx`
3. Set env var: `CRON_SECRET_TOKEN` in Edge Function settings
4. Run `supabase/setup-cron-job.sql` in SQL Editor (with your service role key)

### For Production:
1. Apply migrations via Dashboard or CLI
2. Deploy Edge Function with production project ref
3. Set env var: `CRON_SECRET_TOKEN` in Edge Function settings
4. Run `supabase/setup-cron-job-production.sql` in SQL Editor (with your production service role key)

---

## 📖 Documentation by Use Case

### "I need to set this up"
→ See `STAGING_SETUP_CHECKLIST.md` or `PRODUCTION_DEPLOYMENT.md`

### "I need to manage the cron job"
→ See `CRON_JOB_MANAGEMENT.md`

### "I need to understand how it works"
→ See `IMPLEMENTATION_SUMMARY.md`

### "I need quick commands"
→ See `QUICK_REFERENCE.md`

### "I need to test locally"
→ See `LOCAL_TESTING_GUIDE.md`

---

## 🎯 System Overview

**Purpose:** Automatically award monthly credits to yearly subscription holders.

**Method:**
- **Cron Job:** Runs hourly via pg_cron
- **Edge Function:** Processes credit awards
- **Webhooks:** Handle monthly subscription renewals (already implemented)

**Key Features:**
- ✅ Hourly checks (max 1-hour delay)
- ✅ Calendar month arithmetic
- ✅ Multi-layer idempotency
- ✅ Dynamic credit lookup
- ✅ Audit logging
- ✅ Automatic catch-up for missed months

---

## 🔐 Security Notes

- **Service role keys** are required for cron setup (never commit to Git!)
- **Cron secret** (`f8e6a86f...`) is a validation token (safe to commit)
- Different service role keys for staging vs production
- All setup scripts are in `.gitignore` if they contain secrets

---

## 📞 Support

If you need help:
1. Check `QUICK_REFERENCE.md` for common commands
2. Check `CRON_JOB_MANAGEMENT.md` for troubleshooting
3. Review execution logs in Dashboard > Edge Functions
4. Check cron history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC`

---

**Last Updated:** 2025-11-08  
**System Status:** ✅ Deployed to Staging and Production

