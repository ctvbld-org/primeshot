import type { Style, Scene, Wardrobe, Color, StyleId } from '../../types/styles';
import type { SupabaseClient } from '@supabase/supabase-js';
export declare function createConfigApi(supabase: SupabaseClient<any>): {
    getAllStyleConfigs: () => Promise<Style[]>;
    getStyleConfigById: (id: StyleId) => Promise<Style | null>;
    getScenes: () => Promise<Scene[]>;
    getWardrobes: () => Promise<Wardrobe[]>;
    getColors: () => Promise<Color[]>;
    getSceneByValue: (value: string) => Promise<Scene | null>;
    getSceneById: (id: string) => Promise<Scene | null>;
    getWardrobeByValue: (value: string) => Promise<Wardrobe | null>;
    getWardrobeById: (id: string) => Promise<Wardrobe | null>;
    getColorByValue: (value: string) => Promise<Color | null>;
    getColorById: (id: string) => Promise<Color | null>;
    updateStyleConfig: (id: StyleId, style: Partial<Style>) => Promise<Style>;
    updateScene: (value: string, scene: Partial<Scene>) => Promise<Scene>;
    updateWardrobe: (value: string, wardrobe: Partial<Wardrobe>) => Promise<Wardrobe>;
    updateColor: (value: string, color: Partial<Color>) => Promise<Color>;
};
