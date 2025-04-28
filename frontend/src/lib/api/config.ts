import { createClient } from '@/lib/supabase/client';
import type { Style, Option, StyleId, OptionCategory } from '@/types/styles';
import type { Database } from '@/types/supabase';

const supabase = createClient();

// Get all style configs
export async function getAllStyleConfigs(): Promise<Style[]> {
  const { data, error } = await supabase
    .from('style_configs')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Style[];
}

// Get a style config by ID
export async function getStyleConfigById(id: StyleId): Promise<Style | null> {
  const { data, error } = await supabase
    .from('style_configs')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Style;
}

// Get all options
export async function getAllOptions(): Promise<Option[]> {
  const { data, error } = await supabase
    .from('style_options')
    .select('*')
    .order('category');
  if (error) throw error;
  return data as Option[];
}

// Get an option by category
export async function getOptionByCategory(category: OptionCategory): Promise<Option | null> {
  const { data, error } = await supabase
    .from('style_options')
    .select('*')
    .eq('category', category)
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Option;
}

// Admin-only functions
export async function updateStyleConfig(id: StyleId, style: Partial<Style>): Promise<Style> {
  const { data, error } = await supabase
    .from('style_configs')
    .update(style)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // Optionally: trigger cache invalidation logic elsewhere if needed
  return data as Style;
}

export async function updateOption(category: OptionCategory, option: Partial<Option>): Promise<Option> {
  const { data, error } = await supabase
    .from('style_options')
    .update(option)
    .eq('category', category)
    .select()
    .single();
  if (error) throw error;
  // Optionally: trigger cache invalidation logic elsewhere if needed
  return data as Option;
}

// Cache management - No-ops or handled elsewhere
export async function invalidateStyleConfigsCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
}

export async function invalidateOptionsCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
} 