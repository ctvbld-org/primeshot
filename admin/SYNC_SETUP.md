# Database Synchronization Setup

This document explains how to set up the database synchronization feature for the admin portal.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Current Database (Local/Development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Staging Database
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
STAGING_SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Production Database
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your-production-anon-key
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Environment Detection
# Values: local (default), staging, production
VERCEL_TARGET_ENV=local
```

## How It Works

### Environment Detection
- The system uses `VERCEL_TARGET_ENV` to determine the current environment
- **Local** (`VERCEL_TARGET_ENV=local`): Can push to staging OR production
- **Staging** (`VERCEL_TARGET_ENV=staging`): Can push to production only  
- **Production** (`VERCEL_TARGET_ENV=production`): Can push to staging only

### Supported Tables
The sync feature works with these database tables:
- `styles` - Photography styles
- `style_scenes` - Scene options
- `style_wardrobes` - Wardrobe options  
- `style_colors` - Color options
- `subscriptions` - Subscription tiers
- `credit_packs` - Credit packs
- `credit_costs` - Credit costs

### Change Detection
- Compares `created_at` and `updated_at` timestamps between databases
- Detects created, updated, and deleted records
- Shows meaningful display names for each change

### Asset Handling
- **No S3 synchronization needed** - all environments use production S3
- Only database records are synchronized
- Image URLs remain unchanged during sync

## Usage

1. **Access**: Click the "Deploy Changes" button in the admin navigation
2. **Select Target**: Choose the target environment (staging or production)
3. **Review Changes**: The system automatically compares databases and shows differences
4. **Select Changes**: Choose which specific changes to synchronize
5. **Execute**: Click "Deploy Changes" to start the synchronization
6. **Monitor**: Watch the progress and review any errors

## Features

### Safety Features
- **Selective Sync**: Choose specific tables and records to synchronize
- **Change Preview**: See exactly what will be changed before executing
- **Progress Tracking**: Real-time progress updates during sync
- **Error Handling**: Detailed error reporting and graceful failure handling
- **Validation**: Prevents syncing to invalid targets or with no changes selected

### User Interface
- Full-width dialog with environment selection
- Expandable table sections showing changes by category
- Checkbox selection for individual changes or entire tables
- Progress bars and status indicators during sync
- Success/error summaries with detailed logs

## API Endpoints

- `GET /api/sync/compare` - Get environment info and available targets
- `POST /api/sync/compare` - Compare databases and detect changes
- `POST /api/sync/execute` - Execute synchronization with selected changes

## Security

- Uses service role keys for cross-database operations
- Validates environment targets before allowing sync
- Requires explicit selection of changes (no automatic sync)
- Logs all sync operations for audit purposes

## Troubleshooting

### Common Issues
1. **Environment variables not set**: Ensure all required variables are configured
2. **Service role permissions**: Verify service role keys have proper database access
3. **Network connectivity**: Check that admin can reach target databases
4. **Table schema differences**: Ensure target database has same table structure

### Error Handling
- Individual record errors don't stop the entire sync
- Detailed error messages help identify specific issues
- Failed syncs can be retried with corrected data
- Progress is tracked per table for easier debugging 