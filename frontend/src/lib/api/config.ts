import { createClient } from '@/lib/supabase/client';
import type { Style, Option, StyleId, OptionCategory } from '@/types/styles';
import type { Database } from '@/types/supabase';

const supabase = createClient();

// Cache durations in seconds
const CACHE_DURATIONS = {
  STYLE_CONFIGS: 3600, // 1 hour
  OPTIONS: 3600, // 1 hour
  STALE_WHILE_REVALIDATE: 300, // 5 minutes
} as const;

// Cache tags for more granular invalidation
const CACHE_TAGS = {
  STYLE_CONFIGS: 'style-configs',
  STYLE_CONFIG: (id: StyleId) => `style-config-${id}`,
  OPTIONS: 'style-options',
  OPTION: (category: OptionCategory) => `style-option-${category}`,
} as const;

// Cache headers for better reuse and edge caching
const getCacheHeaders = (maxAge: number, tags: string[]) => ({
  'Cache-Control': `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${CACHE_DURATIONS.STALE_WHILE_REVALIDATE}`,
  'CDN-Cache-Control': `max-age=${maxAge}, stale-while-revalidate=${CACHE_DURATIONS.STALE_WHILE_REVALIDATE}`,
  'Surrogate-Control': `max-age=${maxAge}, stale-while-revalidate=${CACHE_DURATIONS.STALE_WHILE_REVALIDATE}`,
  'Vary': 'Accept, Authorization',
  'Cache-Tag': tags.join(',')
});

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'CDN-Cache-Control': 'no-cache, no-store, must-revalidate',
  'Surrogate-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// Cache keys for better type safety and consistency
const CACHE_KEYS = {
  STYLE_CONFIGS_LIST: 'style_configs_list',
  STYLE_CONFIG: (id: StyleId) => `style_config_${id}`,
  OPTIONS_LIST: 'style_options_list',
  OPTION: (category: OptionCategory) => `style_option_${category}`,
} as const;

export async function getAllStyleConfigs(): Promise<Style[]> {
  const { data, error } = await supabase
    .from('style_configs' as any)
    .select('*')
    .order('name')
    .setHeader('Cache-Control', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS])['Cache-Control'])
    .setHeader('Vary', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS])['Vary'])
    .setHeader('Cache-Tag', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS])['Cache-Tag']);

  if (error) throw error;
  return (data || []) as unknown as Style[];
}

export async function getStyleConfigById(id: StyleId): Promise<Style | null> {
  const { data, error } = await supabase
    .from('style_configs' as any)
    .select('*')
    .eq('id', id)
    .single()
    .setHeader('Cache-Control', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS, CACHE_TAGS.STYLE_CONFIG(id)])['Cache-Control'])
    .setHeader('Vary', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS, CACHE_TAGS.STYLE_CONFIG(id)])['Vary'])
    .setHeader('Cache-Tag', getCacheHeaders(CACHE_DURATIONS.STYLE_CONFIGS, [CACHE_TAGS.STYLE_CONFIGS, CACHE_TAGS.STYLE_CONFIG(id)])['Cache-Tag']);

  if (error) throw error;
  return data as unknown as Style | null;
}

export async function getAllOptions(): Promise<Option[]> {
  const { data, error } = await supabase
    .from('style_options' as any)
    .select('*')
    .order('category')
    .setHeader('Cache-Control', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS])['Cache-Control'])
    .setHeader('Vary', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS])['Vary'])
    .setHeader('Cache-Tag', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS])['Cache-Tag']);

  if (error) throw error;
  return (data || []) as unknown as Option[];
}

export async function getOptionByCategory(category: OptionCategory): Promise<Option | null> {
  const { data, error } = await supabase
    .from('style_options' as any)
    .select('*')
    .eq('category', category)
    .single()
    .setHeader('Cache-Control', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS, CACHE_TAGS.OPTION(category)])['Cache-Control'])
    .setHeader('Vary', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS, CACHE_TAGS.OPTION(category)])['Vary'])
    .setHeader('Cache-Tag', getCacheHeaders(CACHE_DURATIONS.OPTIONS, [CACHE_TAGS.OPTIONS, CACHE_TAGS.OPTION(category)])['Cache-Tag']);

  if (error) throw error;
  return data as unknown as Option | null;
}

// Admin-only functions - No caching for write operations
export async function updateStyleConfig(id: StyleId, style: Partial<Style>): Promise<Style> {
  const { data, error } = await supabase
    .from('style_configs' as any)
    .update(style)
    .eq('id', id)
    .select()
    .single()
    .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
    .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
    .setHeader('Expires', NO_CACHE_HEADERS['Expires']);

  if (error) throw error;
  
  try {
    await invalidateStyleConfigsCache();
  } catch (cacheError) {
    console.error('Failed to invalidate style configs cache:', cacheError);
    // Continue since the update was successful
  }
  
  return data as unknown as Style;
}

export async function updateOption(category: OptionCategory, option: Partial<Option>): Promise<Option> {
  const { data, error } = await supabase
    .from('style_options' as any)
    .update(option)
    .eq('category', category)
    .select()
    .single()
    .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
    .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
    .setHeader('Expires', NO_CACHE_HEADERS['Expires']);

  if (error) throw error;
  
  try {
    await invalidateOptionsCache();
  } catch (cacheError) {
    console.error('Failed to invalidate options cache:', cacheError);
    // Continue since the update was successful
  }
  
  return data as unknown as Option;
}

// Cache management - These will be called after admin updates
export async function invalidateStyleConfigsCache() {
  const errors: Error[] = [];

  try {
    // Purge the cache for style configs list
    await supabase
      .from('style_configs' as any)
      .select('*')
      .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
      .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
      .setHeader('Expires', NO_CACHE_HEADERS['Expires'])
      .setHeader('Cache-Tag', CACHE_TAGS.STYLE_CONFIGS);
  } catch (error) {
    errors.push(error as Error);
  }
  
  try {
    // Get all style IDs to purge individual caches
    const { data: styles, error } = await supabase.from('style_configs' as any).select('id');
    if (error) throw error;
    
    if (styles) {
      await Promise.allSettled(
        (styles as unknown as { id: string }[]).map(async (style) => {
          await supabase
            .from('style_configs' as any)
            .select('*')
            .eq('id', style.id)
            .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
            .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
            .setHeader('Expires', NO_CACHE_HEADERS['Expires'])
            .setHeader('Cache-Tag', CACHE_TAGS.STYLE_CONFIG(style.id));
        })
      );
    }
  } catch (error) {
    errors.push(error as Error);
  }

  if (errors.length > 0) {
    throw new Error(`Failed to invalidate some style config caches: ${errors.map(e => e.message).join(', ')}`);
  }
}

export async function invalidateOptionsCache() {
  const errors: Error[] = [];

  try {
    // Purge the cache for options list
    await supabase
      .from('style_options' as any)
      .select('*')
      .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
      .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
      .setHeader('Expires', NO_CACHE_HEADERS['Expires'])
      .setHeader('Cache-Tag', CACHE_TAGS.OPTIONS);
  } catch (error) {
    errors.push(error as Error);
  }
  
  try {
    // Get all categories to purge individual caches
    const { data: options, error } = await supabase.from('style_options' as any).select('category');
    if (error) throw error;
    
    if (options) {
      await Promise.allSettled(
        (options as unknown as { category: OptionCategory }[]).map(async (option) => {
          await supabase
            .from('style_options' as any)
            .select('*')
            .eq('category', option.category)
            .setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
            .setHeader('Pragma', NO_CACHE_HEADERS['Pragma'])
            .setHeader('Expires', NO_CACHE_HEADERS['Expires'])
            .setHeader('Cache-Tag', CACHE_TAGS.OPTION(option.category));
        })
      );
    }
  } catch (error) {
    errors.push(error as Error);
  }

  if (errors.length > 0) {
    throw new Error(`Failed to invalidate some options caches: ${errors.map(e => e.message).join(', ')}`);
  }
} 