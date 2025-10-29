import { ReactNode } from 'react';
import type { Style, Scene, Wardrobe, Color } from '../types/styles';
import type { SupabaseClient } from '@supabase/supabase-js';
interface StyleDataContextValue {
    styles: Style[];
    scenes: Scene[];
    wardrobes: Wardrobe[];
    colors: Color[];
    stylesLoading: boolean;
    scenesLoading: boolean;
    wardrobesLoading: boolean;
    colorsLoading: boolean;
    isLoading: boolean;
    stylesError: Error | null;
    scenesError: Error | null;
    wardrobesError: Error | null;
    colorsError: Error | null;
    findStyleById: (id: string) => Style | undefined;
    findSceneById: (id: string) => Scene | undefined;
    findSceneByValue: (value: string) => Scene | undefined;
    findWardrobeById: (id: string) => Wardrobe | undefined;
    findWardrobeByValue: (value: string) => Wardrobe | undefined;
    findColorById: (id: string) => Color | undefined;
    findColorByValue: (value: string) => Color | undefined;
}
interface StyleDataProviderProps {
    children: ReactNode;
    supabaseClient: SupabaseClient<any>;
}
export declare function StyleDataProvider({ children, supabaseClient }: StyleDataProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useStyleData(): StyleDataContextValue;
export declare function useStylesFromContext(): {
    data: {
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
    }[];
    isLoading: boolean;
    error: Error | null;
};
export declare function useScenesFromContext(): {
    data: Scene[];
    isLoading: boolean;
    error: Error | null;
};
export declare function useWardrobesFromContext(): {
    data: Wardrobe[];
    isLoading: boolean;
    error: Error | null;
};
export declare function useColorsFromContext(): {
    data: Color[];
    isLoading: boolean;
    error: Error | null;
};
export {};
