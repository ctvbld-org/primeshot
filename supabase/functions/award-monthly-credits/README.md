# Award Monthly Credits Edge Function

This Supabase Edge Function handles monthly credit allocation for yearly subscriptions.

## Purpose

Yearly subscriptions are billed once per year by Stripe, but users should receive their monthly credits allocation every month. This function runs on a schedule to award monthly credits to active yearly subscriptions.

## How It Works

1. Queries all active subscriptions that need credit awards
2. For each subscription, calculates how many months of credits are due
3. Awards credits for each missing month using the `award_monthly_subscription_credits` RPC function
4. Uses idempotency protection to prevent duplicate awards

## Setup

### 1. Deploy the Function

```bash
cd /path/to/project
supabase functions deploy award-monthly-credits
```

### 2. Set Environment Variables

The function requires these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `CRON_SECRET_TOKEN` - Secret token for authenticating cron requests

Set the cron secret token:

```bash
supabase secrets set CRON_SECRET_TOKEN="your-secure-random-token-here"
```

### 3. Configure Cron Job

#### Option A: Supabase Cron (Native)

Add to `supabase/migrations/[timestamp]_setup_cron_jobs.sql`:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily credit allocation at 2 AM UTC
SELECT cron.schedule(
  'award-monthly-credits',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://[your-project-ref].supabase.co/functions/v1/award-monthly-credits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

#### Option B: External Cron (e.g., Vercel Cron, GitHub Actions)

**Vercel Cron:**

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/award-monthly-credits",
    "schedule": "0 2 * * *"
  }]
}
```

Then create API route that calls the Edge Function.

**GitHub Actions:**

Create `.github/workflows/award-monthly-credits.yml`:

```yaml
name: Award Monthly Credits
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual triggering

jobs:
  award-credits:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://[your-project-ref].supabase.co/functions/v1/award-monthly-credits \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"
```

### 4. Test the Function

Test locally:

```bash
supabase functions serve award-monthly-credits
```

Then in another terminal:

```bash
curl -X POST http://localhost:54321/functions/v1/award-monthly-credits \
  -H "Authorization: Bearer your-test-token" \
  -H "Content-Type: application/json"
```

## Monitoring

### View Logs

```bash
supabase functions logs award-monthly-credits
```

### Check Audit Trail

Query the `credit_award_audit` table:

```sql
SELECT * FROM credit_award_audit
WHERE award_type = 'cron_job'
ORDER BY awarded_at DESC
LIMIT 100;
```

### Monitor Webhook Events

Check for any failed webhook processing:

```sql
SELECT * FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Troubleshooting

### No Credits Being Awarded

1. Check if subscriptions are active:
```sql
SELECT * FROM user_subscriptions WHERE status = 'active';
```

2. Check which subscriptions need credits:
```sql
SELECT * FROM get_subscriptions_needing_monthly_credits();
```

3. Check function logs:
```bash
supabase functions logs award-monthly-credits --tail
```

### Duplicate Credits

The system has multiple layers of idempotency protection:
- Database unique constraints on `(source_id, invoice_id)`
- RPC function checks before inserting
- Month number tracking prevents re-awarding same month

### Manual Award

If you need to manually award credits:

```sql
SELECT award_monthly_subscription_credits(
  p_user_id := '[user-uuid]',
  p_subscription_id := 'sub_xxx',
  p_month_number := 5, -- Which month to award
  p_credits := 150,
  p_plan_name := 'pro'
);
```

## Security

- Function requires `Authorization` header with correct token
- Uses service role for database access (bypasses RLS)
- All operations logged to audit table
- Idempotency protection prevents abuse

## Performance

- Processes subscriptions sequentially to avoid database overload
- Small delay (100ms) between each month award
- Typical runtime: ~1 second per subscription with multiple months due
- Should complete within seconds for most workloads




