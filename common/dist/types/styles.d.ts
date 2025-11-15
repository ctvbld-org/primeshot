import { z } from 'zod';
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
        };
    };
}
export interface Wardrobe {
    id: string;
    value: string;
    label: string;
    image?: string;
    category?: string;
    gender?: 'man' | 'woman' | 'unisex';
    created_at: string;
    updated_at: string;
    translations: {
        [lang: string]: {
            label: string;
        };
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
        };
    };
}
export declare const StyleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    preview_images: z.ZodArray<z.ZodString, "many">;
    available_scenes: z.ZodArray<z.ZodString, "many">;
    available_wardrobes: z.ZodArray<z.ZodString, "many">;
    available_colors: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    translations: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
    wardrobe_category_order: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wardrobe_order: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    color_mode: z.ZodOptional<z.ZodEnum<["color", "monochrome", "sepia"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}>;
export declare const StylesSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    preview_images: z.ZodArray<z.ZodString, "many">;
    available_scenes: z.ZodArray<z.ZodString, "many">;
    available_wardrobes: z.ZodArray<z.ZodString, "many">;
    available_colors: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    translations: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
    wardrobe_category_order: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wardrobe_order: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    color_mode: z.ZodOptional<z.ZodEnum<["color", "monochrome", "sepia"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}>, "many">;
export type Style = z.infer<typeof StyleSchema>;
export type Styles = z.infer<typeof StylesSchema>;
export interface StyleWithImages extends Style {
    genderSpecificImages: string[];
}
export interface StyleWithSettings extends Style {
    styleId: string;
    settings?: {
        scene?: string;
        wardrobe?: string;
        color?: string;
    };
}
export interface OptionItem {
    id: string;
    label: string;
    color?: string;
    image?: string;
    translations: {
        [lang: string]: {
            label: string;
        };
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
        };
    };
}
export type StyleId = Style['id'];
export type OptionCategory = Option['category'];
export declare const StyleConfigSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    preview_images: z.ZodArray<z.ZodString, "many">;
    available_scenes: z.ZodArray<z.ZodString, "many">;
    available_wardrobes: z.ZodArray<z.ZodString, "many">;
    available_colors: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    translations: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
    wardrobe_category_order: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wardrobe_order: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    color_mode: z.ZodOptional<z.ZodEnum<["color", "monochrome", "sepia"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}>;
export declare const StyleConfigsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    preview_images: z.ZodArray<z.ZodString, "many">;
    available_scenes: z.ZodArray<z.ZodString, "many">;
    available_wardrobes: z.ZodArray<z.ZodString, "many">;
    available_colors: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    translations: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
    wardrobe_category_order: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wardrobe_order: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    color_mode: z.ZodOptional<z.ZodEnum<["color", "monochrome", "sepia"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}, {
    id: string;
    name: string;
    preview_images: string[];
    available_scenes: string[];
    available_wardrobes: string[];
    available_colors: string[];
    translations: Record<string, {
        name: string;
    }>;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    wardrobe_category_order?: string[] | undefined;
    wardrobe_order?: Record<string, string[]> | undefined;
    color_mode?: "color" | "monochrome" | "sepia" | undefined;
}>, "many">;
