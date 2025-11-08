# Local Testing Guide - Monthly Credit Allocation System

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed (`npm install -g supabase`)
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe` or from https://stripe.com/docs/stripe-cli)
- Node.js and npm/yarn installed

---

## Step 1: Start Local Supabase

```bash
cd /Users/ledave/Documents/Primeshot/App

# Start Supabase local stack
supabase start

# This will output:
# - API URL: http://127.0.0.1:54321
# - GraphQL URL: http://127.0.0.1:54321/graphql/v1
# - DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Studio URL: http://127.0.0.1:54323
# - Inbucket URL: http://127.0.0.1:54324
# - JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these credentials** - you'll need them for testing!

---

## Step 2: Apply Migrations Locally

```bash
# Check migration status
supabase migration list

# Apply all migrations (including our new ones)
supabase db reset

# Or apply just the new migrations
supabase migration up

# Verify migrations applied
supabase db diff
```

**Expected output:**
```
Applying migration 20251108110254_add_subscription_month_tracking_and_idempotency.sql...
Applying migration 20251108110255_retroactive_credit_awards.sql...
✓ All migrations applied successfully
```

---

## Step 3: Verify Database Schema

```bash
# Open Supabase Studio
open http://127.0.0.1:54323

# Or use psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**In Studio or psql, verify:**

```sql
-- 1. Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND column_name IN ('last_awarded_month');

-- 2. Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('webhook_events', 'credit_award_audit')
  AND table_schema = 'public';

-- 3. Check RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%subscription_credits%'
  AND routine_schema = 'public';

-- Expected results:
-- - last_awarded_month column (integer)
-- - webhook_events table
-- - credit_award_audit table
-- - award_subscription_credits_idempotent function
-- - award_monthly_subscription_credits function
-- - get_subscriptions_needing_monthly_credits function
```

---

## Step 4: Create Test Data

```sql
-- Create a test user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'test-yearly@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
);

-- Create a test yearly subscription (started 3 months ago)
INSERT INTO user_subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  plan_name,
  status,
  current_period_start,
  current_period_end,
  created_at,
  last_awarded_month
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'sub_test_yearly_123',
  'cus_test_123',
  'price_test_yearly',
  'pro',
  'active',
  NOW() - INTERVAL '3 months',
  NOW() + INTERVAL '9 months',
  NOW() - INTERVAL '3 months',
  0  -- Only initial credits awarded
);

-- Create another test user with monthly subscription
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'test-monthly@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
);

INSERT INTO user_subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  plan_name,
  status,
  current_period_start,
  current_period_end,
  created_at,
  last_awarded_month
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'sub_test_monthly_456',
  'cus_test_456',
  'price_test_monthly',
  'standard',
  'active',
  NOW() - INTERVAL '1 month',
  NOW(),
  NOW() - INTERVAL '1 month',
  1  -- Up to date
);

-- Verify test data
SELECT 
  stripe_subscription_id,
  plan_name,
  last_awarded_month,
  (EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER * 12 + 
   EXTRACT(MONTH FROM AGE(NOW(), created_at))::INTEGER) AS months_elapsed
FROM user_subscriptions;

-- Expected: sub_test_yearly_123 should have months_elapsed = 3, last_awarded = 0
```

---

## Step 5: Test RPC Functions Directly

```sql
-- Test 1: Check which subscriptions need credits
SELECT * FROM get_subscriptions_needing_monthly_credits();

-- Expected: Should return sub_test_yearly_123 with months_due = 3

-- Test 2: Award credits for month 1
SELECT award_monthly_subscription_credits(
  p_user_id := 'a0000000-0000-0000-0000-000000000001'::uuid,
  p_subscription_id := 'sub_test_yearly_123',
  p_month_number := 1,
  p_credits := 150,
  p_plan_name := 'pro'
);

-- Expected: { "status": "awarded", "credits": 150, "month_number": 1 }

-- Test 3: Try to award same month again (idempotency test)
SELECT award_monthly_subscription_credits(
  p_user_id := 'a0000000-0000-0000-0000-000000000001'::uuid,
  p_subscription_id := 'sub_test_yearly_123',
  p_month_number := 1,
  p_credits := 150,
  p_plan_name := 'pro'
);

-- Expected: { "status": "already_awarded", "message": "..." }

-- Test 4: Check credits were awarded
SELECT * FROM user_credits
WHERE user_id = 'a0000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC;

-- Test 5: Check subscription was updated
SELECT stripe_subscription_id, last_awarded_month
FROM user_subscriptions
WHERE stripe_subscription_id = 'sub_test_yearly_123';

-- Expected: last_awarded_month = 1
```

---

## Step 6: Test Edge Function Locally

```bash
# Terminal 1: Start Edge Function
cd /Users/ledave/Documents/Primeshot/App
supabase functions serve award-monthly-credits

# Output:
# Serving functions on http://127.0.0.1:54321/functions/v1/award-monthly-credits
```

```bash
# Terminal 2: Set environment variables for testing
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # From supabase start
export CRON_SECRET_TOKEN="test-secret-token"

# Trigger the function
curl -X POST http://127.0.0.1:54321/functions/v1/award-monthly-credits \
  -H "Authorization: Bearer test-secret-token" \
  -H "Content-Type: application/json" \
  -v

# Expected output:
# {
#   "success": true,
#   "message": "Monthly credit allocation completed",
#   "results": {
#     "total": 1,
#     "successful": 2,  // Month 2 and Month 3
#     "failed": 0,
#     "skipped": 0,
#     "credits_awarded": 300
#   }
# }
```

---

## Step 7: Test Webhook Handler Locally

### 7.1 Start Your Next.js App

```bash
# Terminal 3: Start webapp in dev mode
cd /Users/ledave/Documents/Primeshot/App/webapp
npm run dev
# or
yarn dev

# App should start on http://localhost:3000
```

### 7.2 Update Local Environment Variables

Create/update `webapp/.env.local`:

```bash
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # From supabase start
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # From supabase start

# Stripe (test mode keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...  # You'll get this from Stripe CLI

# Node env
NODE_ENV=development
```

### 7.3 Forward Stripe Webhooks to Local

```bash
# Terminal 4: Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/payment/webhook

# Output will show:
# Ready! Your webhook signing secret is whsec_... (copy this!)
# 
# Update your .env.local with:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### 7.4 Trigger Test Webhook

```bash
# Terminal 5: Trigger a test invoice payment
stripe trigger invoice.payment_succeeded

# Expected output:
# invoice.payment_succeeded [evt_test_...]
# 
# Check Terminal 4 for forwarding confirmation:
# --> invoice.payment_succeeded [evt_test_...]
# <-- [200] POST http://localhost:3000/api/payment/webhook [evt_test_...]
```

### 7.5 Verify Webhook Processing

```bash
# Open Studio: http://127.0.0.1:54323

# Check webhook_events table
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 5;

# Check user_credits table
SELECT * FROM user_credits ORDER BY created_at DESC LIMIT 5;

# Check audit trail
SELECT * FROM credit_award_audit ORDER BY awarded_at DESC LIMIT 5;
```

---

## Step 8: Test Idempotency Protection

```bash
# Trigger the SAME event multiple times
stripe events resend evt_test_...
stripe events resend evt_test_...
stripe events resend evt_test_...

# Check database - should only have ONE credit entry
SELECT 
  stripe_event_id,
  COUNT(*) AS process_count
FROM webhook_events
WHERE stripe_event_id = 'evt_test_...'
GROUP BY stripe_event_id;

# Should show: process_count = 1 (only processed once)

# Check credits - should only have ONE award
SELECT 
  source_id,
  invoice_id,
  COUNT(*) AS credit_count
FROM user_credits
WHERE invoice_id LIKE 'in_test_%'
GROUP BY source_id, invoice_id;

# Should show: credit_count = 1 (only awarded once)
```

---

## Step 9: Test Complete Flow

### Scenario: New Yearly Subscription

```bash
# 1. Create subscription via Stripe CLI
stripe trigger checkout.session.completed

# 2. This triggers invoice.payment_succeeded
# Wait a few seconds...

# 3. Check database
SELECT 
  us.stripe_subscription_id,
  us.last_awarded_month,
  COUNT(uc.id) AS credit_entries,
  SUM(uc.credits) AS total_credits
FROM user_subscriptions us
LEFT JOIN user_credits uc ON us.stripe_subscription_id = uc.source_id
WHERE us.stripe_subscription_id LIKE 'sub_%'
GROUP BY us.stripe_subscription_id, us.last_awarded_month;

# Expected:
# - last_awarded_month = 0
# - credit_entries = 1
# - total_credits = (plan credits, e.g., 150)
```

---

## Step 10: Integration Test Script

Create a test script to automate testing:

```bash
# Create test script
cat > test-local-credits.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Local Credit System Integration Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Check RPC functions
echo "Test 1: Checking RPC functions..."
FUNCTIONS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) 
  FROM information_schema.routines 
  WHERE routine_name LIKE '%subscription_credits%'
")
if [ "$FUNCTIONS" -ge 3 ]; then
  echo -e "${GREEN}✓ RPC functions exist${NC}"
else
  echo -e "${RED}✗ Missing RPC functions${NC}"
  exit 1
fi

# Test 2: Check tables
echo "Test 2: Checking new tables..."
TABLES=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_name IN ('webhook_events', 'credit_award_audit')
")
if [ "$TABLES" -eq 2 ]; then
  echo -e "${GREEN}✓ New tables exist${NC}"
else
  echo -e "${RED}✗ Missing tables${NC}"
  exit 1
fi

# Test 3: Test Edge Function
echo "Test 3: Testing Edge Function..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:54321/functions/v1/award-monthly-credits \
  -H "Authorization: Bearer test-secret-token" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Edge Function working${NC}"
else
  echo -e "${RED}✗ Edge Function failed${NC}"
  echo "$RESPONSE"
  exit 1
fi

# Test 4: Check subscriptions needing credits
echo "Test 4: Checking subscriptions needing credits..."
NEEDS_CREDITS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) FROM get_subscriptions_needing_monthly_credits()
")
echo "  Subscriptions needing credits: $NEEDS_CREDITS"

echo ""
echo -e "${GREEN}=== All tests passed! ===${NC}"
EOF

chmod +x test-local-credits.sh
./test-local-credits.sh
```

---

## Step 11: Clean Up Test Data

```sql
-- Remove test data
DELETE FROM user_credits WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000002'::uuid
);

DELETE FROM user_subscriptions WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000002'::uuid
);

DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000002'::uuid
);

-- Clear webhook events
TRUNCATE webhook_events;

-- Clear audit trail
TRUNCATE credit_award_audit;
```

---

## Checklist Before Deploying to Staging

- [ ] All migrations applied successfully locally
- [ ] RPC functions tested and working
- [ ] Edge Function runs without errors
- [ ] Webhook handler processes events correctly
- [ ] Idempotency protection working (no duplicates)
- [ ] Calendar month arithmetic verified
- [ ] Test data cleaned up
- [ ] Integration test script passes

---

## Deploy to Staging

Once local testing is complete:

```bash
# 1. Link to staging project
supabase link --project-ref your-staging-ref

# 2. Push migrations to staging
supabase db push --db-url postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# 3. Deploy Edge Function to staging
supabase functions deploy award-monthly-credits --project-ref your-staging-ref

# 4. Set staging secrets
supabase secrets set CRON_SECRET_TOKEN="$(openssl rand -hex 32)" --project-ref your-staging-ref

# 5. Run retroactive migration (ONE TIME ONLY)
# Be careful with this in staging if you have real subscriptions!
```

---

## Troubleshooting Local Testing

### Issue: Migrations fail

```bash
# Check current state
supabase migration list

# Reset database completely
supabase db reset

# Or rollback last migration
supabase migration down
```

### Issue: Edge Function not starting

```bash
# Check Deno is installed
deno --version

# Check function syntax
cd supabase/functions/award-monthly-credits
deno check index.ts

# View detailed logs
supabase functions serve award-monthly-credits --debug
```

### Issue: Webhook not receiving events

```bash
# Check Stripe CLI is authenticated
stripe login

# Check webhook is forwarding
stripe listen --forward-to localhost:3000/api/payment/webhook --print-secret

# Test directly
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

**Next Step**: Run through this guide to test everything locally before deploying to staging!

