# Explore Image Filename Collision Fix

## Problem
When saving multiple images from the same batch (identical style, scene, wardrobe, color, aspect ratio, and resolution) to explore, they would generate identical filenames. This caused:
1. **S3 Overwrite**: Second image would overwrite the first in S3 storage
2. **Display Issues**: Only the last saved image would be visible
3. **Data Loss**: Earlier images from the batch would be lost

## Example Collision
```
Image 1: studio-throne__neon-pink__black-blouse__default__1-1__2K.webp
Image 2: studio-throne__neon-pink__black-blouse__default__1-1__2K.webp  ← COLLISION!
```

## Solution
Add a unique 8-character UUID suffix to each filename to guarantee uniqueness.

### New Filename Format
```
{style}__{scene}__{wardrobe}__{color}__{aspectRatio}__{resolution}__{uuid}.webp
```

### Example
```
Image 1: studio-throne__neon-pink__black-blouse__default__1-1__2K__a1b2c3d4.webp
Image 2: studio-throne__neon-pink__black-blouse__default__1-1__2K__5e6f7g8h.webp
```

## Implementation

### Files Modified

1. **`webapp/src/lib/admin/explore-utils.ts`**
   - Updated `generateExploreFilename()` to append 8-char UUID
   - UUID generated using `crypto.randomUUID().slice(0, 8)`

2. **`admin/src/lib/utils/parse-explore-image-metadata.ts`**
   - Updated parser to handle 6 parts (old format) or 7 parts (new format)
   - UUID suffix is ignored during parsing - only metadata is extracted

3. **`website/src/lib/utils/parse-explore-image-metadata.ts`**
   - Same parser updates as admin version for consistency

4. **`docs/explore-api-architecture.md`**
   - Updated documentation to reflect new filename format

## Backward Compatibility

The parsers support both formats:
- **Old format**: 6 parts without UUID (for existing images)
- **New format**: 7 parts with UUID (for all new images)

This ensures existing explore images continue to work while new images are protected from collisions.

## Testing

To verify the fix:
1. Generate multiple images with identical settings (same style, scene, wardrobe, color, AR, quality)
2. Save 2+ images from the same batch to explore
3. Verify both images are saved with unique filenames
4. Check that both images display correctly in explore page
5. Confirm metadata is parsed correctly for both images

## Impact

- ✅ Prevents filename collisions when saving multiple batch images
- ✅ Maintains backward compatibility with existing explore images
- ✅ No changes needed to database schema
- ✅ Minimal performance impact (UUID generation is fast)
- ✅ Filenames remain human-readable with metadata preserved

