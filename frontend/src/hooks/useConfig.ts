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

export function useStyleConfigs() {
  return useQuery({
    queryKey: [CACHE_KEYS.styles],
    queryFn: getAllStyleConfigs,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
}

export function useStyleConfig(id: StyleId) {
  return useQuery({
    queryKey: CACHE_KEYS.styleById(id),
    queryFn: () => getStyleConfigById(id),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
}

export function useOptions() {
  return useQuery({
    queryKey: [CACHE_KEYS.options],
    queryFn: getAllOptions,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
}

export function useOption(category: OptionCategory) {
  return useQuery({
    queryKey: CACHE_KEYS.optionByCategory(category),
    queryFn: () => getOptionByCategory(category),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
} 