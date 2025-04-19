# Style Configuration Guide

## Overview

This application uses a single source of truth for all photography styles, outfits, backgrounds, and color options. The configuration files in `src/lib/config/` define all available options, and the TypeScript types are generated from these configurations.

## Key Files

- **`src/lib/config/styles.json`**: The primary source of truth for photography styles and their available options
- **`src/lib/config/options.json`**: Contains the full set of options for backgrounds, outfits, and colors
- **`src/lib/generated-types.ts`**: Auto-generated TypeScript types based on the configuration files
- **`src/scripts/generate-types.ts`**: Script that generates the types
- **`src/lib/utils/get-styles-images.ts`**: Utility to handle gender-specific image paths
- **`src/lib/hooks/use-gender-filter.ts`**: Hook for filtering styles based on user gender

## How It Works

### Configuration Structure

The `styles.json` file defines photography styles with this structure:

```json
[
  {
    "id": "studio",
    "name": "Studio",
    "description": "Dramatic lighting, soft directional shadows...",
    "previewImages": [
      "studio-1.jpg",
      "studio-2.jpg",
      "studio-3.jpg"
    ],
    "availableGenders": ["male", "female"],
    "availableBackgrounds": ["plain", "studio", "gradient", "brick"],
    "availableOutfits": ["professional", "business-casual"],
    "availableOutfitColors": ["#000000", "#FFFFFF", "#6B7280", "#3B82F6"]
  },
  ...
]
```

The `options.json` file defines all available options:

```json
{
  "backgrounds": [
    { "id": "plain", "label": "Plain", "imageUrl": "..." },
    ...
  ],
  "outfits": [
    { "id": "professional", "label": "Professional Suit", "imageUrl": "..." },
    ...
  ],
  "outfitColors": [
    { "id": "#000000", "label": "Black" },
    ...
  ]
}
```

### Gender-Specific Images and Styles

The application supports gender-specific styles and images:

1. Each style has an `availableGenders` array that specifies which genders can use it:
   ```json
   "availableGenders": ["male", "female"]
   ```

2. Styles can be restricted to specific genders:
   ```json
   "availableGenders": ["female"]  // Only female users can select this style
   ```

3. Images are stored in S3 with the following folder structure:
   - `app-images/default/` - Default images
   - `app-images/male/` - Male-specific images (same filenames as default)
   - `app-images/female/` - Female-specific images (same filenames as default)

4. In the `styles.json` file, only the image filenames are specified (without paths)

5. The `getStyleImages` utility automatically constructs the correct proxy URL to access S3 images:
   ```typescript
   // For a user with gender = 'male'
   getStyleImages(["studio-1.jpg", "studio-2.jpg"], 'male')
   // Returns proxy URLs:
   // ['/api/image-proxy?path=app-images%2Fmale%2Fstudio-1.jpg', 
   //  '/api/image-proxy?path=app-images%2Fmale%2Fstudio-2.jpg']
   ```

6. This approach requires that you maintain identical filenames across gender folders, but simplifies the configuration significantly.

### Using Gender Filtering in Components

The application provides utilities and hooks to simplify gender-based filtering:

1. The `filterStylesByGender` utility function:
   ```typescript
   import { filterStylesByGender } from '@/lib/utils/get-styles-images';
   import stylesConfig from '@/lib/config/styles.json';
   
   // Filter styles manually
   const maleStyles = filterStylesByGender(stylesConfig, 'male');
   ```

2. The `useGenderFilter` hook automatically filters styles based on the logged-in user:
   ```typescript
   import { useGenderFilter } from '@/lib/hooks/use-gender-filter';
   import stylesConfig from '@/lib/config/styles.json';
   
   function StyleSelector() {
     // This will automatically use the current user's gender
     const availableStyles = useGenderFilter(stylesConfig);
     
     // Or you can override with a specific gender
     const femaleStyles = useGenderFilter(stylesConfig, 'female');
     
     return (
       // Render your component with the filtered styles
     );
   }
   ```

3. Example component usage (see `PhotographyStyleGrid.tsx`):
   ```tsx
   import { useGenderFilter } from '@/lib/hooks/use-gender-filter';
   import { getStyleThumbnail } from '@/lib/utils/get-styles-images';
   
   function StyleGrid() {
     const filteredStyles = useGenderFilter(stylesConfig);
     
     return (
       <div className="grid">
         {filteredStyles.map(style => (
           <div key={style.id}>
             <img 
               src={getStyleThumbnail(style.previewImages)}
               alt={style.name}
             />
             <h3>{style.name}</h3>
           </div>
         ))}
       </div>
     );
   }
   ```

### Type Generation

When you run `npm run generate-types` or start the development server with `npm run dev`, the script automatically generates TypeScript types based on the configuration files.

The generated types ensure type safety across the application while allowing the configuration to be the single source of truth.

## Making Changes

### Adding a New Photography Style

1. Add a new entry to `styles.json`:
   ```json
   {
     "id": "new-style-id",
     "name": "New Style Name",
     "description": "Description of the new style",
     "previewImages": ["image1.jpg", "image2.jpg"],
     "availableGenders": ["male", "female"],
     "availableBackgrounds": ["background1", "background2"],
     "availableOutfits": ["outfit1", "outfit2"],
     "availableOutfitColors": ["#color1", "#color2"]
   }
   ```

2. Add the corresponding image files to all three S3 folders (using the same filenames):
   - `app-images/default/` (default)
   - `app-images/male/` (male versions)
   - `app-images/female/` (female versions)

3. Run `npm run generate-types` to update the TypeScript types

### Adding a New Background, Outfit, or Color

1. Add a new entry to the appropriate array in `options.json`
2. Add the ID to the relevant style's available options in `styles.json`
3. Run `npm run generate-types` to update the TypeScript types

## Validation

The application validates the configuration at runtime during development to ensure:

1. All style IDs in `styles.json` match the generated TypeScript types
2. All background, outfit, and color options referenced in styles exist in `options.json`
3. No invalid options are used
4. Styles are filtered based on user's gender to only show applicable options

Validation warnings and errors appear in the browser console during development.

## Components

The following components use the configuration:

- `PhotographyStyleModal`: Displays style selection in a grid layout
- `BackgroundImageSelector`: Shows available backgrounds for the selected style
- `OutfitImageSelector`: Shows available outfits for the selected style
- `OutfitColorSelector`: Shows available colors for the selected style

These components automatically filter options based on the selected photography style and user gender.

## State Management

The application uses Zustand for state management through the `useStyleStore` hook, which:

- Maintains the current style selections
- Uses the first style from the configuration as the default
- Provides methods for updating individual style settings
- Includes gender information for image selection
- Filters available styles based on user gender

## Best Practices

1. **Always edit the configuration files**, not the generated types
2. Run `npm run generate-types` after making changes
3. Use the validation utilities to check for errors
4. When adding a new option, ensure it's properly referenced in both files
5. Test changes in the UI to ensure they appear correctly
6. When adding new images, make sure to provide versions for all genders with identical filenames
7. When specifying `availableGenders`, ensure you're not unnecessarily limiting access to styles unless intended

## S3 Storage Information

Style images are stored in Amazon S3 rather than in the public folder. This improves loading performance and reduces the size of the application deployment.

- **S3 Bucket**: Configured via environment variable `NEXT_PUBLIC_AWS_S3_BUCKET` (default: `primeshot-uploads-01`)
- **Region**: Configured via environment variable `NEXT_PUBLIC_AWS_REGION` (default: `us-east-1`)
- **Base Path**: `app-images/`
- **Gender Folders**: `default/`, `male/`, `female/`
- **Access Method**: Images are accessed via a server-side proxy API route that generates signed URLs

### Image Proxy

To handle S3 permissions properly, images are served through a Next.js API route that:
1. Receives requests to `/api/image-proxy?path=app-images/gender/filename.webp`
2. Validates the requested path for security
3. Generates a signed S3 URL with temporary access
4. Redirects the client to the signed URL

This approach provides several advantages:
- S3 bucket can remain private while still serving images
- No need to make objects public or configure complex bucket policies
- Uses server-side AWS credentials for proper authentication
- Allows for caching and other optimizations if needed

### Environment Variables

The application uses the following environment variables for S3 configuration:

```
# Server-side S3 access (for uploading and image proxy)
AWS_REGION=us-east-1
AWS_S3_BUCKET=primeshot-uploads-01
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Client-side configuration values
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_S3_BUCKET=primeshot-uploads-01
NEXT_PUBLIC_APP_URL=https://your-app-url.com  # Used for proxy URLs
```

Make sure these variables are set in your `.env.local` file or in your deployment environment.

### Adding New Style Images

To upload new style images:
1. Prepare the image files with appropriate sizes and formats (WebP recommended)
2. Upload them to the corresponding gender folders in the S3 bucket
3. Ensure the same filenames are used across all gender folders
4. Reference only the filename (without path) in the `styles.json` file 