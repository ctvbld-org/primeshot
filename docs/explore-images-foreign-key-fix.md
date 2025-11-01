# Explore Images Foreign Key Fix

## Problem
When deploying explore images from local admin to staging/production, the sync would fail with a foreign key constraint violation error:

```
Error: Failed to create record 75bf89a9-f836-4213-b93e-a17cc21f88eb: 
insert or update on table "explore_images" violates foreign key constraint 
"explore_images_generated_image_id_fkey"
```

This occurred because the `explore_images` table has foreign key constraints referencing:
- `users.id`
- `generated_images.id`
- `inference_jobs.id`
- `styles.id`
- `style_wardrobes.id`
- `style_scenes.id`
- `style_colors.id`
- `explore_categories.id`

When syncing from local to staging/production, these referenced records typically don't exist in the target environment since they're user-generated data.

## Solution

Modified the admin sync engine (`admin/src/lib/sync/engine.ts`) to add special handling for `explore_images` that sanitizes foreign key references before deployment.

### Key Changes

1. **New `sanitizeExploreImageRecord` function**:
   - Checks each foreign key field in the explore_images record
   - Validates if the referenced record exists in the target environment
   - Nulls out foreign keys that don't exist
   - Returns warnings for each nulled reference

2. **Integration in `executSync` function**:
   - Applied sanitization for both CREATE and UPDATE operations
   - Warnings are logged to console and added to sync results
   - Users are informed which foreign key references were removed

3. **Integration in `syncSingleTable` function**:
   - Applied same sanitization for consistency
   - Ensures all sync paths handle explore_images correctly

## How It Works

When syncing an explore_images record:

1. **Before Insert/Update**: The sync engine calls `sanitizeExploreImageRecord()`
2. **Validation**: For each foreign key field (if not null):
   - Queries the target database to check if referenced record exists
   - If not found or error occurs, sets the field to `null`
3. **Warning**: Each nulled field generates a warning message like:
   ```
   Generated Image reference (75bf89a9-...) not found in target environment - nulled out
   ```
4. **Sync Proceeds**: The sanitized record (with nulled foreign keys) is inserted/updated

## Benefits

- ✅ **Independent Deployment**: Explore images can be deployed without requiring all related data
- ✅ **No Data Loss**: Only metadata references are removed, not the actual image or essential data
- ✅ **Transparency**: Users see warnings about what was removed
- ✅ **Flexibility**: Allows curating showcase content independently from production user data
- ✅ **Backward Compatible**: Doesn't affect other table syncs or existing functionality

## Foreign Keys That Can Be Safely Nulled

These foreign keys in `explore_images` are primarily for tracking origin and metadata:

- `user_id` - Who created the image (not needed for public showcase)
- `generated_image_id` - Original generated image reference (local only)
- `inference_id` - Inference job that created it (local only)
- `wardrobe_id`, `scene_id`, `color_id` - Style options used (tracked separately)

These fields are essential and should exist:
- `style_id` - The style should be synced first or already exist
- `category_id` - Categories should be synced first
- `s3_path` - The actual image path (not a foreign key)
- `aspect_ratio`, `resolution` - Metadata (not foreign keys)

## Usage

No changes needed to usage - simply sync explore_images as before:

1. Go to Admin panel → Explore → Sync tab
2. Select explore_images to sync
3. Review changes
4. Click "Deploy to Staging/Production"

The system will automatically:
- Sanitize foreign keys
- Show warnings for nulled references
- Complete the sync successfully

## Testing

To verify the fix works:

1. Create an explore image in local admin
2. Sync it to staging (where the referenced data doesn't exist)
3. Verify:
   - Sync completes successfully
   - Warnings shown for nulled foreign keys
   - Image appears in staging explore page
   - Essential fields (`s3_path`, `style_id`, `category_id`) are preserved

## Migration Path

### For Existing Data
No migration needed - existing explore_images with null foreign keys work fine.

### For Future Enhancements
If foreign key integrity becomes critical:
1. Consider syncing dependent data first (styles, categories, etc.)
2. Or modify schema to make foreign keys optional with application-level validation
3. Or implement a "resolve references" feature in admin panel

## Related Files
- `admin/src/lib/sync/engine.ts` - Main sync logic with sanitization
- `supabase/migrations/20251030000000_create_explore_system.sql` - Table schema
- `admin/src/components/explore/ImagesTab.tsx` - Admin UI for explore images
- `website/src/app/[locale]/explore/page.tsx` - Public explore page

## Notes
- Foreign keys are nullable in the database schema, so nulling them is safe
- The public explore page doesn't rely on these foreign key relationships
- This pattern could be applied to other showcase/public content tables if needed

