# Resend Audience Integration - Signup Flow

## Overview

New users are automatically added to a Resend Audience when they sign up. This enables:
- Centralized contact management
- Easy broadcasting of product updates
- Better email analytics and engagement tracking
- Audience segmentation for targeted campaigns

## How It Works

### Flow
1. User signs up → `auth.users` trigger fires
2. Database trigger `send_welcome_email_after_signup()` calls edge function
3. Edge function `send-welcome-email`:
   - Adds contact to Resend Audience (if configured)
   - Sends welcome email
   - Returns success response

### Implementation

Located in: `/supabase/functions/send-welcome-email/index.ts`

```typescript
// Add contact to Resend Audience (if configured)
const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");

if (audienceId) {
  await fetch("https://api.resend.com/audiences/" + audienceId + "/contacts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
}
```

## Configuration

### Required Environment Variables

Set in Supabase Edge Functions secrets:

```bash
# Required - already configured
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional - for audience sync
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx
```

### Setting Up Audience

1. **Create Audience in Resend:**
   - Go to [Resend Dashboard](https://resend.com/audiences)
   - Click "Create Audience"
   - Name it (e.g., "All Users" or "Signups")
   - Copy the Audience ID (starts with `aud_`)

2. **Add to Supabase Secrets:**
   ```bash
   # Via CLI
   supabase secrets set RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx --project-ref <your-project-ref>
   
   # Or via Dashboard
   # Settings → Edge Functions → Secrets → Add new secret
   ```

3. **Deploy Function:**
   ```bash
   cd /Users/ledave/Documents/Primeshot/App
   supabase functions deploy send-welcome-email
   ```

## Features

### ✅ Graceful Error Handling
- Signup succeeds even if audience addition fails
- Non-blocking - doesn't delay welcome email
- Logs errors for monitoring

### ✅ Duplicate Detection
- Handles contacts that already exist
- No errors for duplicate additions
- Idempotent operation

### ✅ Optional Configuration
- Works without `RESEND_AUDIENCE_ID` set
- Logs warning if not configured
- Easy to enable/disable

## Monitoring

### Success Logs
```
Contact user@example.com added to Resend Audience aud_xxxxxxxxxxxxx
```

### Already Exists (OK)
```
Contact user@example.com already exists in Resend Audience
```

### Not Configured (Warning)
```
RESEND_AUDIENCE_ID not configured - skipping audience addition
```

### Error (Non-Critical)
```
Failed to add contact to Resend Audience: [error details]
```

## Testing

### Test New Signup
1. Sign up a new user in production/staging
2. Check edge function logs:
   ```bash
   supabase functions logs send-welcome-email --limit 50
   ```
3. Verify contact appears in Resend Dashboard
4. Confirm welcome email was sent

### Test Duplicate
1. Sign up with same email again (after deletion)
2. Should see "already exists" log
3. Email should still be sent successfully

## Troubleshooting

### Audience addition fails
- **Check API Key:** Verify `RESEND_API_KEY` has audience permissions
- **Check Audience ID:** Ensure `RESEND_AUDIENCE_ID` is correct format (`aud_xxx`)
- **Check Logs:** Look for error details in function logs
- **Non-Critical:** Signup and email still succeed

### Contact not appearing
1. Check if `RESEND_AUDIENCE_ID` is set
2. Verify audience exists in Resend Dashboard
3. Check function logs for errors
4. Confirm email is valid format

## Benefits

### For Marketing
- 📊 All signups automatically in Resend
- 📧 Easy to broadcast product updates
- 📈 Track engagement and open rates
- 🎯 Segment users for campaigns

### For Development
- 🔄 Automatic sync on signup
- 🛡️ Graceful error handling
- 📝 Comprehensive logging
- ⚡ No impact on signup performance

## Related Documentation

- [Welcome Email Setup](./welcome-email-setup.md)
- [Resend Audiences API](https://resend.com/docs/api-reference/audiences)
- [Resend Contacts API](https://resend.com/docs/api-reference/contacts)

## Notes

- Same pattern as waitlist integration (`website/src/app/api/waitlist/route.ts`)
- Audience addition happens before email send for proper unsubscribe link handling
- Contact email is the only field stored (no metadata yet)
- Future: Could add contact metadata (signup source, user preferences, etc.)

