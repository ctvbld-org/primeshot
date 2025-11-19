# Social Sharing Feature Implementation

## Overview
Implemented social media sharing functionality for generated images with URL shortener system, allowing users to share their creations with a clean short link.

## Features Implemented

### 1. Database Migration
- **File**: `supabase/migrations/20251110000001_create_share_links_table.sql`
- Created `share_links` table to store shortened URLs
- Fields: short_code, style parameters (styleId, sceneId, wardrobeId, colorId, quality, aspectRatio), click tracking
- RLS policies: Public read access, authenticated users can create links
- Expires after 1 year by default

### 2. Short Code Generator
- **File**: `webapp/src/lib/utils/short-code.ts`
- Generates 6-character base62 codes (0-9, a-z, A-Z)
- Cryptographically secure using `crypto.getRandomValues()`
- Validation helper included

### 3. API Routes

#### Create Short Link
- **File**: `webapp/src/app/api/share/create/route.ts`
- POST endpoint to create shortened URLs
- Accepts optional pre-generated `shortCode` (created on client after successful share)
- Validates short code format and uniqueness
- Stores style metadata for recreation
- Handles duplicate code generation with retry logic (if code not provided)
- Uses `NEXT_PUBLIC_APP_URL` environment variable (not hardcoded)
- **Key Improvement**: Only called AFTER user successfully shares (no DB bloat from cancelled shares)

#### Redirect Route
- **File**: `website/src/app/s/[code]/route.ts` ⚠️ **Important: Lives in website, not webapp**
- GET endpoint for short code redirect
- Increments click counter
- Redirects to `/create` with style parameters
- Handles expired links and errors gracefully
- **Architecture Note**: The redirect route must be in the website project (not webapp) to ensure clean URLs like `primeshot.ai/s/abc123` instead of `primeshot.ai/create/s/abc123`. The website serves as the entry point and rewrites `/create` to the webapp.

#### Website Middleware
- **File**: `website/src/middleware.ts`
- Updated to bypass locale prefixing for `/s/*` routes
- Ensures share links work without language prefixes
- Allows direct access to `primeshot.ai/s/abc123` without redirecting to `primeshot.ai/us/s/abc123`

### 4. Share Utility Function
- **File**: `webapp/src/lib/utils/share.ts`
- Creates short link via API
- Uses Web Share API when available (mobile native sharing)
- Falls back to clipboard copy on unsupported browsers
- Shares both image file and promotional text with link

### 5. UI Components

#### Share Icon
- **File**: `common/web/Icon.tsx`
- Added new `share` icon variant
- Standard share symbol with arrow design

#### InferenceThumbnail Update
- **File**: `webapp/src/components/inference/InferenceThumbnail.tsx`
- Added share button to actions overlay
- Positioned between favorite/star group and delete/download group
- Shows loading state during sharing
- Toast notifications for success/error feedback

### 6. Translations
- **Files**: `common/locales/*/inference.json` (all 10 languages)
- Added translations for:
  - Share button label and aria-label
  - Share text template: "My new AI shot! 🤩 Made with @primeshotai from a few selfies.\n\nCopy my shoot setup/style here: {{url}} - it's free to try!"
  - Success/error/clipboard messages
- Languages: US, GB, FR, DE, ES, IT, PT, NL, CN, JP
- **Copy Improvements**:
  - ✅ More personal and engaging tone ("My new AI shot!")
  - ✅ Includes Twitter handle (@primeshotai) for social attribution
  - ✅ Emphasizes the "from a few selfies" simplicity
  - ✅ Clear CTA to copy the setup/style
  - ✅ Highlights "free to try" value proposition

## Share Flow

1. User clicks share button on generated image
2. **Generate short code locally** (client-side, no DB call yet)
3. Build short URL: `https://primeshot.ai/s/abc123`
4. Create share text:
   ```
   My new AI shot! 🤩 Made with @primeshotai from a few selfies.

   Copy my shoot setup/style here: https://primeshot.ai/s/abc123 - it's free to try!
   ```
5. **Attempt to share** via Web Share API or clipboard
6. **Only if share succeeds**: Create DB entry with the short code
7. When recipient clicks link:
   - Redirected to `/create?style=X&scene=Y&wardrobe=Z&color=W`
   - StyleSelectionContext automatically applies settings
   - User can generate same style immediately

### Benefits of Deferred DB Creation

✅ **No DB bloat** - Cancelled shares don't create entries  
✅ **Simpler code** - No need for cleanup/delete endpoints  
✅ **Better performance** - Fewer database writes  
✅ **Accurate analytics** - Only tracks actually shared links  

## URL Examples

**Before (long):**
```
https://primeshot.ai/create?style=professional&scene=office&wardrobe=suit&color=navy
```

**After (short):**
```
https://primeshot.ai/s/Ab3xY9
```

## Environment Variables

Uses `NEXT_PUBLIC_APP_URL` for domain:
- Production: `https://primeshot.ai`
- Staging: `https://staging.primeshot.ai`
- Development: `http://localhost:3000`

## Benefits

✅ Clean, shareable URLs  
✅ Native mobile sharing support  
✅ Trackable (click counts stored)  
✅ Viral marketing potential  
✅ Easy recreation of styles  
✅ Multi-language support  
✅ Graceful fallbacks  

## Next Steps (Optional Enhancements)

1. **Analytics Dashboard** - Show users their share statistics
2. **QR Code Generation** - Generate QR codes for share links
3. **Custom Slugs** - Allow users to customize short codes
4. **Social Media Previews** - Add og:image meta tags for share links
5. **UTM Parameters** - Add tracking parameters for marketing analytics

## Testing

To test the feature:
1. Generate an image in the app
2. Click the new share button
3. On mobile: Native share dialog should appear
4. On desktop: Link copied to clipboard notification
5. Share the link and verify recipient is redirected to `/create` with correct style parameters

## Migration Required

Run the database migration:
```bash
cd supabase
supabase db push
```

Or in production:
```bash
supabase db push --linked
```

