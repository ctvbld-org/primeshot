import { z } from 'zod';
// Translation schema to avoid repetition
const TranslationSchema = z.object({
    name: z.string()
});
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
    wardrobe_order: z.record(z.array(z.string())).optional(),
    color_mode: z.enum(['color', 'monochrome', 'sepia']).optional()
});
export const StylesSchema = z.array(StyleSchema);
// For backward compatibility and API validation
export const StyleConfigSchema = StyleSchema;
export const StyleConfigsSchema = StylesSchema;
