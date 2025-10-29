import { z } from 'zod';

// Translation schema to avoid repetition
const TranslationSchema = z.object({
  name: z.string()
});

// New separate table interfaces
export interface Scene {
  id: string;
  value: string;
  label: string;
  image?: string;
  atmosphere?: string;
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

export interface Wardrobe {
  id: string;
  value: string;
  label: string;
  image?: string;
  // NEW
  category?: string;
  gender?: 'man' | 'woman' | 'unisex';
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

export interface Color {
  id: string;
  value: string;
  label: string;
  color?: string;
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

// Updated style schema with new column names
export const StyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  preview_images: z.array(z.string()),
  available_scenes: z.array(z.string()),
  available_wardrobes: z.array(z.string()),
  available_colors: z.array(z.string()),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  translations: z.record(TranslationSchema),
  // NEW (optional for back-compat)
  wardrobe_category_order: z.array(z.string()).optional(),
  wardrobe_order: z.record(z.array(z.string())).optional()
});

export const StylesSchema = z.array(StyleSchema);

// Derive the TypeScript types from the Zod schemas
export type Style = z.infer<typeof StyleSchema>;

export type Styles = z.infer<typeof StylesSchema>;

// Additional interface for when images are added
export interface StyleWithImages extends Style {
  genderSpecificImages: string[];
}

// Updated interface for settings with new naming
export interface StyleWithSettings extends Style {
  styleId: string;
  settings?: {
    scene?: string;
    wardrobe?: string;
    color?: string;
  };
}

// Deprecated: Old Option interface - kept for migration compatibility
// @deprecated Use Scene, Wardrobe, Color interfaces instead
export interface OptionItem {
  id: string;
  label: string;
  color?: string;
  image?: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

// @deprecated Use Scene, Wardrobe, Color interfaces instead
export interface Option {
  category: string;
  label: string;
  description: string | null;
  options: OptionItem[];
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      label: string;
      description: string;
    }
  };
}

export type StyleId = Style['id'];
// @deprecated Use specific scene/wardrobe/color values instead
export type OptionCategory = Option['category'];

// For backward compatibility and API validation
export const StyleConfigSchema = StyleSchema;
export const StyleConfigsSchema = StylesSchema;

