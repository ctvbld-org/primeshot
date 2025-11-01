# Explore Images Not Showing in Sync - Troubleshooting

## Issue
When trying to deploy from Local to Production, the sync comparison shows 7 changes (Photography Styles and Color Options) but `explore_images` is not appearing, even though:
- Production `explore_images` table is empty (0 records)
- Local `explore_images` table has 8 records
- The table should show 8 "created" changes

## Investigation

### 1. Configuration Check
Production Supabase URL in admin `.env`:
```
PRODUCTION_SUPABASE_URL=https://api.primeshot.ai
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Potential Issues

#### Issue A: Custom Domain vs Database URL
**Problem**: The `PRODUCTION_SUPABASE_URL` is set to `https://api.primeshot.ai` which is your custom domain/API gateway. The Supabase client needs the actual Supabase project URL.

**Fix**: Check if `https://api.primeshot.ai` is:
- A reverse proxy to your actual Supabase project
- OR you need to use the direct Supabase URL like `https://[project-ref].supabase.co`

To find your production Supabase URL:
1. Go to https://supabase.com/dashboard
2. Select your production project (uwwmpfyhbakrxmlmkqut)
3. Go to Settings → API
4. Copy the "Project URL" (should be `https://uwwmpfyhbakrxmlmkqut.supabase.co`)

#### Issue B: Wrong Project in Supabase Dashboard
**Problem**: The screenshot shows "Default Project" at the top of the Supabase dashboard, but your production project ref is `uwwmpfyhbakrxmlmkqut`.

**Fix**: Make sure you're viewing the correct project:
1. In Supabase dashboard, check the project selector
2. Ensure you're viewing project `uwwmpfyhbakrxmlmkqut` (production)
3. Verify the `explore_images` table in the CORRECT project

#### Issue C: Table Doesn't Exist in Production
**Problem**: The `explore_images` table might not exist in production database yet.

**Fix**: Run the migration to create it:
```bash
# From project root
cd /Users/ledave/Documents/Primeshot/App
supabase db push --linked
```

Or manually run the migration SQL in production.

## Quick Tests

### Test 1: Verify Production Connection
Open browser dev console on the admin sync page and look for these logs:
```
===== SYNC COMPARISON START =====
Source: local
Target: production
...
[explore_images] Fetching data...
[explore_images] Source records: 8, Target records: 0
[explore_images] Changes detected: 8
```

If you see an error for `explore_images`, that's the issue.

### Test 2: Direct Query Test
Try querying production directly:
```bash
curl -X GET 'https://api.primeshot.ai/rest/v1/explore_images' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test 3: Check Migration Status
```bash
# From project root
supabase migration list --linked
```

## Recommended Solution

**Step 1**: Verify the correct Supabase URL
```bash
# Check your production Supabase project URL
# It should be https://uwwmpfyhbakrxmlmkqut.supabase.co
# NOT https://api.primeshot.ai
```

**Step 2**: Update admin `.env` if needed
```env
# Should be the direct Supabase URL, not custom domain
PRODUCTION_SUPABASE_URL=https://uwwmpfyhbakrxmlmkqut.supabase.co
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Step 3**: Restart admin dev server
```bash
cd admin
npm run dev
```

**Step 4**: Try sync again and check browser console for detailed logs

## Files Modified
- `admin/src/lib/sync/detector.ts` - Added enhanced logging and display names for explore tables
- `admin/src/lib/sync/engine.ts` - Added foreign key sanitization for explore_images

## Next Steps
1. Check browser dev console for sync comparison logs
2. Verify you're using correct production Supabase URL
3. Confirm `explore_images` table exists in production
4. If table doesn't exist, run migrations
5. Try sync again with enhanced logging

The enhanced logging will help us see exactly what's happening during the sync comparison.

