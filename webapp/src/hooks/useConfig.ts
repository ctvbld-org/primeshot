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
  return useQuery({
    queryKey: id ? CACHE_KEYS.styleById(id) : ['style', 'none'],
    queryFn: () => getStyleConfigById(id as StyleId),
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
  return useQuery({
    queryKey: CACHE_KEYS.sceneByValue(value),
    queryFn: () => getSceneByValue(value),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

// Fetch by id (new)
export function useSceneById(id?: string) {
  return useQuery({
    queryKey: ['sceneById', id],
    queryFn: () => getSceneById(id as string),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}

export function useWardrobe(value: string) {
  return useQuery({
    queryKey: CACHE_KEYS.wardrobeByValue(value),
    queryFn: () => getWardrobeByValue(value),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

export function useWardrobeById(id?: string) {
  return useQuery({
    queryKey: ['wardrobeById', id],
    queryFn: () => getWardrobeById(id as string),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}

export function useColor(value: string) {
  return useQuery({
    queryKey: CACHE_KEYS.colorByValue(value),
    queryFn: () => getColorByValue(value),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!value,
  });
}

export function useColorById(id?: string) {
  return useQuery({
    queryKey: ['colorById', id],
    queryFn: () => getColorById(id as string),
    staleTime: ONE_WEEK_IN_MS,
    enabled: !!id,
  });
}