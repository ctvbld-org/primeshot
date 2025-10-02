import { useQuery } from '@tanstack/react-query';
import type { Style, StyleId, Scene, Wardrobe, Color } from '@/types/styles';
import {
  getAllStyleConfigs,
  getStyleConfigById,
  getScenes,
  getWardrobes,
  getColors,
  getSceneByValue,
  getWardrobeByValue,
  getColorByValue,
  getSceneById,
  getWardrobeById,
  getColorById,
} from '@/lib/api/config';
import { useStyleData } from '@/contexts/style-data-context';

const CACHE_KEYS = {
  styles: 'styles',
  styleById: (id: StyleId) => ['style', id],
  scenes: 'scenes',
  wardrobes: 'wardrobes',
  colors: 'colors',
  sceneByValue: (value: string) => ['scene', value],
  wardrobeByValue: (value: string) => ['wardrobe', value],
  colorByValue: (value: string) => ['color', value],
} as const;

// Define constants for cache configuration
const ONE_WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

export function useStyles() {
  return useQuery({
    queryKey: [CACHE_KEYS.styles],
    queryFn: getAllStyleConfigs,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useStyle(id: StyleId | undefined) {
  const { findStyleById, styles, stylesLoading } = useStyleData();
  
  return useQuery({
    queryKey: id ? CACHE_KEYS.styleById(id) : ['style', 'none'],
    queryFn: () => {
      // First try to find in bulk data if available
      if (!stylesLoading && styles.length > 0) {
        const found = findStyleById(id as string);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getStyleConfigById(id as StyleId);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}

// Deprecated exports for backwards compatibility
/** @deprecated Use useStyles() instead */
export const useStyleConfigs = useStyles;
/** @deprecated Use useStyle() instead */
export const useStyleConfig = useStyle;

// New separate table hooks
export function useScenes() {
  return useQuery({
    queryKey: [CACHE_KEYS.scenes],
    queryFn: getScenes,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useWardrobes() {
  return useQuery({
    queryKey: [CACHE_KEYS.wardrobes],
    queryFn: getWardrobes,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useColors() {
  return useQuery({
    queryKey: [CACHE_KEYS.colors],
    queryFn: getColors,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useScene(value: string) {
  const { findSceneByValue, scenes, scenesLoading } = useStyleData();
  
  return useQuery({
    queryKey: CACHE_KEYS.sceneByValue(value),
    queryFn: () => {
      // First try to find in bulk data if available
      if (!scenesLoading && scenes.length > 0) {
        const found = findSceneByValue(value);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getSceneByValue(value);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

// Fetch by id (new)
export function useSceneById(id?: string) {
  const { findSceneById, scenes, scenesLoading } = useStyleData();
  
  return useQuery({
    queryKey: ['sceneById', id],
    queryFn: () => {
      // First try to find in bulk data if available
      if (!scenesLoading && scenes.length > 0 && id) {
        const found = findSceneById(id);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getSceneById(id as string);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}

export function useWardrobe(value: string) {
  const { findWardrobeByValue, wardrobes, wardrobesLoading } = useStyleData();
  
  return useQuery({
    queryKey: CACHE_KEYS.wardrobeByValue(value),
    queryFn: () => {
      // First try to find in bulk data if available
      if (!wardrobesLoading && wardrobes.length > 0) {
        const found = findWardrobeByValue(value);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getWardrobeByValue(value);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

export function useWardrobeById(id?: string) {
  const { findWardrobeById, wardrobes, wardrobesLoading } = useStyleData();
  
  return useQuery({
    queryKey: ['wardrobeById', id],
    queryFn: () => {
      // First try to find in bulk data if available
      if (!wardrobesLoading && wardrobes.length > 0 && id) {
        const found = findWardrobeById(id);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getWardrobeById(id as string);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}

export function useColor(value: string) {
  const { findColorByValue, colors, colorsLoading } = useStyleData();
  
  return useQuery({
    queryKey: CACHE_KEYS.colorByValue(value),
    queryFn: () => {
      // First try to find in bulk data if available
      if (!colorsLoading && colors.length > 0) {
        const found = findColorByValue(value);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getColorByValue(value);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

export function useColorById(id?: string) {
  const { findColorById, colors, colorsLoading } = useStyleData();
  
  return useQuery({
    queryKey: ['colorById', id],
    queryFn: () => {
      // First try to find in bulk data if available
      if (!colorsLoading && colors.length > 0 && id) {
        const found = findColorById(id);
        if (found) return Promise.resolve(found);
      }
      // Fallback to API call
      return getColorById(id as string);
    },
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}