# Welcome Email Setup Guide

This guide explains how to configure the automated welcome email system that sends emails to new users upon signup.

## System Overview

The welcome email system consists of:

1. **Database Trigger**: Fires when a new user is created in `auth.users`
2. **Configuration Table**: Stores project settings in `app.config`
3. **Edge Function**: `send-welcome-email` handles the actual email sending via Resend
4. **pg_net Extension**: Enables HTTP calls from PostgreSQL to Edge Functions

## Setup Steps

### Step 1: Generate a Secure Secret

Generate a random secret for authenticating webhook calls:

```bash
openssl rand -hex 32
```

Save this value - you'll need it in multiple places.

### Step 2: Get Your Project Reference

Find your Supabase project reference:

- From your project URL: `https://[PROJECT_REF].supabase.co`
- Or from: Settings → General → Reference ID

### Step 3: Configure Edge Function Environment Variables

Go to your Supabase dashboard:
`https://app.supabase.com/project/[PROJECT_REF]/functions/send-welcome-email/secrets`

Set these environment variables:

```
WELCOME_HOOK_SECRET=[the secret from Step 1]
RESEND_API_KEY=[your Resend API key]
RESEND_FROM=Primeshot <info@mail.primeshot.ai>
RESEND_REPLY_TO=[optional reply-to address]
```

### Step 4: Update Database Configuration

Run the SQL setup script via Supabase SQL Editor:

1. Open: `https://app.supabase.com/project/[PROJECT_REF]/sql/new`
2. Copy the contents of `supabase/setup-welcome-email.sql`
3. Replace `YOUR_PROJECT_REF` and `YOUR_SECURE_SECRET_HERE` with your actual values
4. Execute the script

### Step 5: Verify Configuration

Check that configuration is properly set:

```sql
SELECT * FROM app.welcome_email_status;
```

Should return:
```
is_configured | status       | last_updated
--------------+--------------+-------------
true          | Configured   | [timestamp]
```

### Step 6: Test with a New User

1. Create a test user account via your signup flow
2. Check Edge Function logs:
   - Go to: `https://app.supabase.com/project/[PROJECT_REF]/functions/send-welcome-email/logs`
   - You should see a successful POST request
3. Check your email inbox for the welcome email

## Troubleshooting

### No Email Received

**Check Database Configuration:**
```sql
SELECT * FROM app.config WHERE id = 1;
```
Ensure `project_ref` and `welcome_hook_secret` are not 'SET_ME'.

**Check Database Logs:**
1. Go to: `https://app.supabase.com/project/[PROJECT_REF]/logs/postgres-logs`
2. Filter for: `send_welcome_email_after_signup`
3. Look for NOTICE messages about missing config

**Check Edge Function Logs:**
1. Go to: `https://app.supabase.com/project/[PROJECT_REF]/functions/send-welcome-email/logs`
2. Look for:
   - Authentication errors (401) → Secret mismatch
   - Resend API errors (502) → Check RESEND_API_KEY
   - Missing email errors (400) → Check trigger payload

**Check pg_net Requests:**
```sql
SELECT * FROM net._http_response 
ORDER BY created DESC 
LIMIT 10;
```
This shows recent HTTP requests made from PostgreSQL.

### Authentication Errors (401)

The `WELCOME_HOOK_SECRET` in your Edge Function must exactly match the `welcome_hook_secret` in `app.config`:

```sql
-- Check database value
SELECT welcome_hook_secret FROM app.config WHERE id = 1;

-- Update if needed
SELECT app.update_welcome_email_config(
  'your-project-ref',
  'matching-secret-here'
);
```

### Resend API Errors

Verify your Resend API key:
1. Log in to [Resend](https://resend.com)
2. Go to API Keys
3. Ensure the key is active and has sending permissions
4. Update in Edge Function secrets if needed

### Test Edge Function Directly

You can test the Edge Function independently:

```bash
curl -X POST \
  https://[PROJECT_REF].functions.supabase.co/send-welcome-email \
  -H "Content-Type: application/json" \
  -H "x-hook-secret: YOUR_SECRET_HERE" \
  -d '{
    "id": "test-user-id",
    "email": "test@example.com",
    "full_name": "Test User",
    "locale": "en-GB"
  }'
```

## Architecture Details

### Trigger Function

Located in: `supabase/migrations/20250923130500_user_language_and_locale_in_welcome.sql`

The `send_welcome_email_after_signup()` function:
1. Reads config from `app.config` table
2. Exits silently if config is not set
3. Extracts user metadata (name, locale)
4. Makes HTTP POST to Edge Function via `pg_net`
5. Includes authentication secret in `x-hook-secret` header

### Edge Function

Located in: `supabase/functions/send-welcome-email/index.ts`

The Edge Function:
1. Validates the `x-hook-secret` header
2. Extracts user data from request body
3. Generates localized email content
4. Sends email via Resend API
5. Returns success/error response

### Configuration Table

```sql
CREATE TABLE app.config (
  id integer PRIMARY KEY DEFAULT 1,
  project_ref text NOT NULL,
  welcome_hook_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Single-row table (id=1) storing global configuration.

## Security Considerations

1. **Secret Management**: The `welcome_hook_secret` prevents unauthorized calls to the Edge Function
2. **Security Definer**: Trigger function runs with elevated permissions but validates all inputs
3. **Silent Failure**: Trigger exits gracefully if config is missing (doesn't break user signup)
4. **HTTPS Only**: All communication between database and Edge Function is encrypted
5. **No User Data Logging**: Email addresses and names are not logged in database

## Local Development

For local development, you'll need to:

1. Start Supabase locally: `supabase start`
2. Configure local `app.config`:
   ```sql
   SELECT app.update_welcome_email_config(
     '127.0.0.1:54321',  -- or your local project ref
     'local-dev-secret'
   );
   ```
3. Set local Edge Function secrets in `.env.local`
4. Deploy Edge Function locally: `supabase functions serve`

Note: Emails in local development will use your Resend account (consider using Resend's test mode).

## Monitoring

Consider setting up alerts for:

- Failed email sends (check Edge Function error logs)
- High email send volume (potential abuse)
- Authentication failures (potential security issue)

You can query `net._http_response` to track pg_net request success rates.

