# Ngrok Development Setup

This script (`dev-ngrok.cjs`) helps create a tunnel to your local Supabase instance for development with Modal containers.

## Quick Setup for Fixed URL

### Option 1: Static Subdomain (Free Account)

If you have a static subdomain from ngrok:

1. **Create `.env` file in project root:**
   ```bash
   NGROK_URL=amazed-doberman-worthy.ngrok-free.app
   ```

2. **Run the script:**
   ```bash
   node scripts/dev-ngrok.cjs
   ```

### Option 2: Reserved Domain (Paid Account)

If you have an ngrok paid account and want a custom domain:

1. **Create `.env` file in project root:**
   ```bash
   NGROK_AUTHTOKEN=your_authtoken_from_ngrok_dashboard
   NGROK_DOMAIN=your-project.ngrok.io
   ```

2. **Reserve domain in ngrok dashboard:**
   - Go to https://dashboard.ngrok.com/domains
   - Click "Create Domain"
   - Use the domain in your `.env` file

3. **Run the script:**
   ```bash
   node scripts/dev-ngrok.cjs
   ```

## Basic Usage (Dynamic URL)

```bash
node scripts/dev-ngrok.cjs
```

This will create a random ngrok URL each time you run it.

## Fixed URL Setup

To use a consistent URL that doesn't change between runs, you have several options:

### Static Subdomains (Free/Paid Accounts)
Some ngrok accounts provide static subdomains like `amazed-doberman-worthy.ngrok-free.app` that remain consistent.

#### Using Static Subdomain:
1. **Find your static subdomain**: Check your ngrok dashboard or previous tunnel URLs
2. **Set environment variable**:
   ```bash
   NGROK_URL=your-subdomain.ngrok-free.app
   ```
3. **Run the script**: `node scripts/dev-ngrok.cjs`

### Reserved Domains (Paid Account Required)

#### Step 1: Get an ngrok Paid Account
- Sign up at https://ngrok.com/pricing
- Choose a plan that includes "Reserved Domains" or "Custom Domains"

### Step 2: Reserve a Domain
1. Go to your ngrok dashboard
2. Navigate to "Domains" section
3. Click "Create Domain" or "Reserve Domain"
4. Choose a subdomain like `myproject.ngrok.io`

### Step 3: Get Your Auth Token
1. In your ngrok dashboard, go to "Your Authtoken"
2. Copy your authtoken

### Step 4: Set Environment Variables

Create a `.env` file in your project root (or add to existing):

```bash
# ngrok Configuration
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
NGROK_DOMAIN=myproject.ngrok.io
```

**Or** if using a custom domain:
```bash
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
NGROK_HOSTNAME=myproject.yourdomain.com
```

### Step 5: Run the Script
```bash
node scripts/dev-ngrok.cjs
```

Now you'll get the same URL every time: `https://myproject.ngrok.io`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NGROK_URL` | Static subdomain (e.g., `amazed-doberman-worthy.ngrok-free.app`) | Optional |
| `NGROK_DOMAIN` | Reserved domain from ngrok (e.g., `myapp.ngrok.io`) | Optional |
| `NGROK_HOSTNAME` | Custom domain you own | Optional |
| `NGROK_AUTHTOKEN` | Your ngrok authentication token | For paid features |

## Benefits of Fixed URLs

- **No configuration changes**: Your Modal containers can always use the same SUPABASE_URL_DEV
- **Easier testing**: Webhooks and integrations don't need URL updates
- **Team development**: Share the same development URL across your team
- **Persistent configs**: No need to update environment variables each time

## Troubleshooting

### Domain not available
```
Error: Domain is already taken
```
- Try a different subdomain name
- Make sure you've reserved the domain in your ngrok dashboard

### Authentication errors
```
Error: authentication failed
```
- Check your `NGROK_AUTHTOKEN` is correct
- Make sure your ngrok account has the required plan

### Domain not reserved
```
Error: Domain not found
```
- Make sure you've reserved the domain in your ngrok dashboard
- Check the domain name spelling in your environment variable

## Alternative: Using ngrok CLI

You can also set up the fixed URL using ngrok CLI directly:

```bash
# For static subdomain (free/paid accounts)
ngrok http --url=amazed-doberman-worthy.ngrok-free.app 54321

# For reserved domain (paid accounts)
ngrok config add-authtoken your_token_here
ngrok http 54321 --domain=myproject.ngrok.io
``` 