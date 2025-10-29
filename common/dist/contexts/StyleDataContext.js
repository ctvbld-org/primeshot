'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createConfigApi } from '../lib/api/config';
const StyleDataContext = createContext(null);
const CACHE_KEYS = {
    styles: 'styles',
    scenes: 'scenes',
    wardrobes: 'wardrobes',
    colors: 'colors',
};
// Cache for 1 week since this data changes infrequently
const ONE_WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;
export function StyleDataProvider({ children, supabaseClient }) {
    // Create API instance with the provided supabase client
    const api = React.useMemo(() => createConfigApi(supabaseClient), [supabaseClient]);
    // Fetch all bulk data in parallel
    const { data: styles = [], isLoading: stylesLoading, error: stylesError, } = useQuery({
        queryKey: [CACHE_KEYS.styles],
        queryFn: api.getAllStyleConfigs,
        staleTime: ONE_WEEK_IN_MS,
    });
    const { data: scenes = [], isLoading: scenesLoading, error: scenesError, } = useQuery({
        queryKey: [CACHE_KEYS.scenes],
        queryFn: api.getScenes,
        staleTime: ONE_WEEK_IN_MS,
    });
    const { data: wardrobes = [], isLoading: wardrobesLoading, error: wardrobesError, } = useQuery({
        queryKey: [CACHE_KEYS.wardrobes],
        queryFn: api.getWardrobes,
        staleTime: ONE_WEEK_IN_MS,
    });
    const { data: colors = [], isLoading: colorsLoading, error: colorsError, } = useQuery({
        queryKey: [CACHE_KEYS.colors],
        queryFn: api.getColors,
        staleTime: ONE_WEEK_IN_MS,
    });
    // Overall loading state
    const isLoading = stylesLoading || scenesLoading || wardrobesLoading || colorsLoading;
    // Helper functions to find items from bulk data
    const findStyleById = (id) => styles.find(style => style.id === id);
    const findSceneById = (id) => scenes.find(scene => scene.id === id);
    const findSceneByValue = (value) => scenes.find(scene => scene.value === value);
    const findWardrobeById = (id) => wardrobes.find(wardrobe => wardrobe.id === id);
    const findWardrobeByValue = (value) => wardrobes.find(wardrobe => wardrobe.value === value);
    const findColorById = (id) => colors.find(color => color.id === id);
    const findColorByValue = (value) => colors.find(color => color.value === value);
    const contextValue = {
        // Bulk data
        styles,
        scenes,
        wardrobes,
        colors,
        // Loading states
        stylesLoading,
        scenesLoading,
        wardrobesLoading,
        colorsLoading,
        isLoading,
        // Error states
        stylesError: stylesError,
        scenesError: scenesError,
        wardrobesError: wardrobesError,
        colorsError: colorsError,
        // Helper functions
        findStyleById,
        findSceneById,
        findSceneByValue,
        findWardrobeById,
        findWardrobeByValue,
        findColorById,
        findColorByValue,
    };
    return (_jsx(StyleDataContext.Provider, { value: contextValue, children: children }));
}
export function useStyleData() {
    const context = useContext(StyleDataContext);
    if (!context) {
        throw new Error('useStyleData must be used within a StyleDataProvider');
    }
    return context;
}
// Convenience hooks for backwards compatibility
export function useStylesFromContext() {
    const { styles, stylesLoading, stylesError } = useStyleData();
    return { data: styles, isLoading: stylesLoading, error: stylesError };
}
export function useScenesFromContext() {
    const { scenes, scenesLoading, scenesError } = useStyleData();
    return { data: scenes, isLoading: scenesLoading, error: scenesError };
}
export function useWardrobesFromContext() {
    const { wardrobes, wardrobesLoading, wardrobesError } = useStyleData();
    return { data: wardrobes, isLoading: wardrobesLoading, error: wardrobesError };
}
export function useColorsFromContext() {
    const { colors, colorsLoading, colorsError } = useStyleData();
    return { data: colors, isLoading: colorsLoading, error: colorsError };
}
