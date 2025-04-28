import { useQuery } from '@tanstack/react-query';
import type { Style, Option, StyleId, OptionCategory } from '@/types/styles';
import {
  getAllStyleConfigs,
  getStyleConfigById,
  getAllOptions,
  getOptionByCategory,
} from '@/lib/api/config';

const CACHE_KEYS = {
  styles: 'style-configs',
  styleById: (id: StyleId) => ['style-config', id],
  options: 'options',
  optionByCategory: (category: OptionCategory) => ['option', category],
} as const;

// Define constants for cache configuration
const ONE_WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

export function useStyleConfigs() {
  return useQuery({
    queryKey: [CACHE_KEYS.styles],
    queryFn: getAllStyleConfigs,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useStyleConfig(id: StyleId) {
  return useQuery({
    queryKey: CACHE_KEYS.styleById(id),
    queryFn: () => getStyleConfigById(id),
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useOptions() {
  return useQuery({
    queryKey: [CACHE_KEYS.options],
    queryFn: getAllOptions,
    staleTime: ONE_WEEK_IN_MS,
  });
}

export function useOption(category: OptionCategory) {
  return useQuery({
    queryKey: CACHE_KEYS.optionByCategory(category),
    queryFn: () => getOptionByCategory(category),
    staleTime: ONE_WEEK_IN_MS,
  });
}