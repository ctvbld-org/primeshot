import { z } from 'zod';
import { Gender } from '@/lib/types';

// Zod Schemas for Runtime Validation
export const GenderEnum = z.enum(['male', 'female'] as const) satisfies z.ZodType<Gender>;

// Translation schema to avoid repetition
const TranslationSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string()
});

// Base style schema - single source of truth
export const StyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  preview_images: z.array(z.string()),
  available_genders: z.array(GenderEnum).optional(),
  available_backgrounds: z.array(z.string()),
  available_clothing: z.array(z.string()),
  available_clothing_colors: z.array(z.string()),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  translations: z.record(TranslationSchema)
});

export const StylesSchema = z.array(StyleSchema);

// Derive the TypeScript types from the Zod schemas
export type Style = z.infer<typeof StyleSchema> & {
  // Transform snake_case to camelCase for frontend use
  availableGenders?: Gender[];
};

export type Styles = z.infer<typeof StylesSchema>;

// Additional interface for when images are added
export interface StyleWithImages extends Style {
  genderSpecificImages: string[];
}

// Additional interface for when settings are added
export interface StyleWithSettings extends Style {
  styleId: string;
  settings?: {
    background?: string;
    clothing?: string;
    clothingColor?: string;
  };
}

// Option types remain the same as they're separate concerns
export interface OptionItem {
  id: string;
  label: string;
  imageUrl?: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

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
export type OptionCategory = Option['category'];

// For backward compatibility and API validation
export const StyleConfigSchema = StyleSchema;
export const StyleConfigsSchema = StylesSchema; 