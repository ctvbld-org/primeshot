# Vercel Environment Variables Setup

Complete guide for configuring Resend environment variables in Vercel.

## Required Environment Variables

### Core (Required)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```
**Source:** Get from [Resend Dashboard → API Keys](https://resend.com/api-keys)  
**Required for:** Sending emails via Resend

### Optional (Recommended)
```bash
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Primeshot <team@mail.primeshot.ai>"
```

**`RESEND_AUDIENCE_ID`:**
- Source: Get from [Resend Dashboard → Audiences](https://resend.com/audiences)
- Purpose: Automatically add waitlist signups to Resend contact list
- Default: No audience addition if not set

**`RESEND_FROM_EMAIL`:**
- Format: `"Name <email@domain.com>"` or `"email@domain.com"`
- Purpose: Customize the sender email address
- Default: `team@mail.primeshot.ai` if not set
- **Important:** Must be a verified domain in Resend

## Setup Methods

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your project:**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add each variable:**
   
   **For RESEND_API_KEY:**
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx` (from Resend)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **For RESEND_AUDIENCE_ID:**
   - Key: `RESEND_AUDIENCE_ID`
   - Value: `aud_xxxxxxxxxxxxx` (from Resend)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **For RESEND_FROM_EMAIL:**
   - Key: `RESEND_FROM_EMAIL`
   - Value: `Primeshot <team@mail.primeshot.ai>`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger deployment

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add RESEND_API_KEY
# Paste: re_xxxxxxxxxxxxx
# Select: Production, Preview, Development (all)

vercel env add RESEND_AUDIENCE_ID
# Paste: aud_xxxxxxxxxxxxx
# Select: Production, Preview, Development (all)

vercel env add RESEND_FROM_EMAIL
# Paste: Primeshot <team@mail.primeshot.ai>
# Select: Production, Preview, Development (all)

# Pull environment variables to local
vercel env pull .env.local

# Redeploy
vercel --prod
```

### Method 3: Import from .env file

1. **Create a temporary env file:**
```bash
cat > vercel-env.txt << 'EOF'
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Primeshot <team@mail.primeshot.ai>"
EOF
```

2. **Use Vercel CLI to import:**
```bash
# Note: This requires the file to be properly formatted
# Safer to add one by one as shown in Method 2
```

## Environment Scopes

### Production
- Used for: https://yoursite.com (main production URL)
- When: Deployments from main/master branch
- Critical: Must be set for production emails to work

### Preview
- Used for: Preview deployments (PR deployments)
- When: Deployments from feature branches
- Recommendation: Use same values as production, or test values

### Development
- Used for: `vercel dev` local development
- When: Running local dev server through Vercel
- Note: Also need in `.env.local` for `next dev`

## Verifying Setup

### Check Variables are Set

**Via Vercel Dashboard:**
1. Settings → Environment Variables
2. Should see all three variables listed
3. Each should show which environments it's applied to

**Via Vercel CLI:**
```bash
vercel env ls

# Output should show:
# RESEND_API_KEY         Production, Preview, Development
# RESEND_AUDIENCE_ID     Production, Preview, Development  
# RESEND_FROM_EMAIL      Production, Preview, Development
```

### Test After Deployment

1. **Check deployment logs:**
   - Go to Deployments tab
   - Click on latest deployment
   - Check build logs for any env var issues

2. **Test the waitlist form:**
   - Visit your production/preview URL
   - Submit a test email
   - Check Vercel Function Logs for success messages

3. **View Function Logs:**
   - Deployments → Select deployment → Functions
   - Look for logs from `/api/waitlist`
   - Should see: `Contact added to Resend Audience`

## Security Best Practices

### ✅ Do's
- ✅ Store all API keys in environment variables
- ✅ Use separate Resend API keys for dev/staging/prod
- ✅ Rotate API keys periodically
- ✅ Use restricted API keys with minimum required permissions
- ✅ Add all team members who need access via Vercel team permissions

### ❌ Don'ts
- ❌ Never commit `.env.local` to git
- ❌ Never hardcode API keys in code
- ❌ Never share API keys via Slack/email
- ❌ Never use production keys in development
- ❌ Never expose env vars in client-side code

## Updating Environment Variables

### To Update a Value:

**Via Dashboard:**
1. Settings → Environment Variables
2. Find the variable
3. Click **Edit**
4. Update value
5. Select which environments to update
6. Click **Save**
7. **Redeploy** to apply changes

**Via CLI:**
```bash
# Remove old value
vercel env rm RESEND_FROM_EMAIL production

# Add new value
vercel env add RESEND_FROM_EMAIL
# Enter new value when prompted

# Redeploy
vercel --prod
```

### Important: Redeployment Required
Environment variable changes only take effect after redeployment:
```bash
# Trigger redeploy
vercel --prod

# Or push a new commit
git commit --allow-empty -m "Redeploy for env var changes"
git push
```

## Troubleshooting

### Variables Not Working After Adding

**Problem:** Added env vars but emails still failing

**Solution:**
1. Verify variable names are exact (case-sensitive)
2. Check no extra spaces in values
3. Ensure you redeployed after adding variables
4. Check Function Logs for actual error messages

### Can't See Variables in Vercel Dashboard

**Problem:** Environment Variables section empty

**Solution:**
1. Verify you're in the correct project
2. Check you have appropriate permissions (Owner/Admin)
3. Try refreshing the page
4. Check team settings if using Vercel Teams

### API Key Invalid Errors

**Problem:** "Invalid API key" errors in logs

**Solution:**
1. Verify API key copied correctly (no spaces/newlines)
2. Check API key hasn't been revoked in Resend
3. Ensure using correct key format: `re_xxxxx`
4. Try creating a new API key in Resend

### Email From Address Rejected

**Problem:** Emails failing with "from address not verified"

**Solution:**
1. Verify domain in Resend Dashboard
2. Update DNS records for domain verification
3. Wait for DNS propagation (can take up to 48 hours)
4. Or use a verified domain you already own
5. Check `RESEND_FROM_EMAIL` format is correct

## Different Environments Strategy

### Option 1: Same Configuration (Recommended for Small Teams)
```bash
# All environments use same Resend account
Production:  RESEND_API_KEY=re_prod_xxxxx
Preview:     RESEND_API_KEY=re_prod_xxxxx  
Development: RESEND_API_KEY=re_prod_xxxxx
```

### Option 2: Separate Audiences (Recommended for Large Teams)
```bash
# Different audiences per environment
Production:  RESEND_AUDIENCE_ID=aud_prod_xxxxx
Preview:     RESEND_AUDIENCE_ID=aud_preview_xxxxx
Development: RESEND_AUDIENCE_ID=aud_dev_xxxxx
```

### Option 3: Separate Accounts (Enterprise)
```bash
# Completely separate Resend accounts
Production:  
  RESEND_API_KEY=re_prod_xxxxx
  RESEND_AUDIENCE_ID=aud_prod_xxxxx
  
Staging:     
  RESEND_API_KEY=re_staging_xxxxx
  RESEND_AUDIENCE_ID=aud_staging_xxxxx
  
Development: 
  RESEND_API_KEY=re_dev_xxxxx
  RESEND_AUDIENCE_ID=aud_dev_xxxxx
```

## Monitoring

### Check Usage
- [Resend Dashboard → Usage](https://resend.com/overview)
- Monitor email sends
- Check API request counts
- Watch for rate limit warnings

### Set Up Alerts
- Resend Dashboard → Settings → Webhooks
- Configure webhooks for:
  - Delivery failures
  - Bounces
  - Spam complaints

## Related Documentation

- [QUICK_START_RESEND.md](./QUICK_START_RESEND.md) - Quick setup guide
- [RESEND_SETUP.md](./RESEND_SETUP.md) - Detailed Resend configuration
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Resend API Keys Documentation](https://resend.com/docs/dashboard/api-keys/introduction)

## Quick Reference

### Minimum Required Setup (Production)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Recommended Setup (Production)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Primeshot <team@mail.primeshot.ai>"
```

### After Adding Variables
```bash
# Always redeploy
vercel --prod
```

---

**Questions?** Check [RESEND_SETUP.md](./RESEND_SETUP.md) for more help.

