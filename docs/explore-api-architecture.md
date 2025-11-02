# Explore Feature API Architecture

## Overview
The explore feature is split across three separate Next.js projects, each with its own API endpoints.

## Project Structure

### 1. webapp (Port 3000)
**Purpose**: Main web application where users generate and save images to explore

**API Endpoints**:
- `POST /api/admin/explore/save` - Save generated image to explore
  - Copies image to S3
  - Creates explore_images record
  - Updates styles.preview_images array
  
- `DELETE /api/admin/explore/remove` - Remove image from explore
  - Deletes S3 file
  - Deletes explore_images record
  - Updates styles.preview_images array
  
- `GET /api/admin/explore/check` - Check if image is in explore
  - Query param: `generatedImageId`
  - Returns: `{ isInExplore: boolean, exploreImageId?: string }`

**Used by**: `webapp/src/components/inference/InferenceThumbnail.tsx`

---

### 2. admin (Port 3001)
**Purpose**: Admin panel for managing explore content

**API Endpoints**:
- `GET /api/explore/list` - List all explore images
  - Query params: `styleId`, `categoryId` (optional filters)
  - Returns: `{ images: ExploreImageWithRelations[], groupedByStyle: Record<string, ExploreImageWithRelations[]> }`
  
- `GET /api/explore/categories` - Get all categories
  - Returns: `{ categories: ExploreCategory[] }`
  
- `POST /api/explore/categories` - Create new category
  - Body: `{ name, title, description, ctaLink }`
  
- `PATCH /api/explore/categories` - Update category
  - Body: `{ id, name, title, description, ctaLink }`
  
- `DELETE /api/explore/categories` - Delete category
  - Query param: `id`
  
- `PATCH /api/explore/update` - Update single image
  - Body: `{ id, categoryId }`
  
- `PATCH /api/explore/bulk-update-category` - Bulk update images
  - Body: `{ imageIds: string[], categoryId: string }`

**Used by**: 
- `admin/src/components/explore/ImagesTab.tsx`
- `admin/src/components/explore/CategoriesTab.tsx`

**Special Note**: Delete operations call `webapp/api/admin/explore/remove` because S3 operations are handled in webapp.

---

### 3. website (Port 4000)
**Purpose**: Public marketing/showcase website

**API Endpoints**:
- `GET /api/explore` - Get explore data for public display
  - Query param: `category` (optional filter)
  - Returns: `{ images: ExploreItem[], categories: Record<string, StyleFilter> }`

**Used by**: `website/src/app/[locale]/explore/page.tsx`

---

## Database Schema

### Tables
- `explore_categories` - Category definitions
- `explore_images` - Saved explore images with metadata
- Foreign keys to: `styles`, `style_wardrobes`, `style_scenes`, `style_colors`

### Image Filename Format
- Format: `{style}__{scene}__{wardrobe}__{color}__{aspectRatio}__{resolution}__{uuid}.webp`
- Example: `studio-throne__neon-pink__black-blouse__default__1-1__2K__a1b2c3d4.webp`
- UUID suffix (8 chars) ensures uniqueness when saving multiple images from the same batch
- Parsers support both old format (6 parts, no UUID) and new format (7 parts, with UUID) for backward compatibility

### RLS Policies
- All tables: Public read access
- All tables: Admin-only write access (checks `users.admin = true`)

---

## Cross-Project Communication

- **Admin → Webapp**: Admin panel calls webapp API for delete operations (S3 cleanup)
- **All projects**: Direct database queries via Supabase client
- **No shared API dependencies**: Each project has its own complete set of endpoints

