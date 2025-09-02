import { createClient } from '@/lib/supabase/client';
import type { Style, Option, StyleId, OptionCategory, Scene, Wardrobe, Color } from '@/types/styles';
import type { Database } from '@/types/supabase';

const supabase = createClient();

// Get all style configs
export async function getAllStyleConfigs(): Promise<Style[]> {
  const { data, error } = await supabase
    .from('styles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Style[];
}

// Get a style config by ID
export async function getStyleConfigById(id: StyleId): Promise<Style | null> {
  const { data, error } = await supabase
    .from('styles')
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

// New separate table functions
export async function getScenes(): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('style_scenes')
    .select('*')
    .order('value');
  if (error) throw error;
  return data as Scene[];
}

export async function getWardrobes(): Promise<Wardrobe[]> {
  const { data, error } = await supabase
    .from('style_wardrobes')
    .select('*')
    .order('value');
  if (error) throw error;
  return data as Wardrobe[];
}

export async function getColors(): Promise<Color[]> {
  const { data, error } = await supabase
    .from('style_colors')
    .select('*')
    .order('value');
  if (error) throw error;
  return data as Color[];
}

// Get a specific scene by value
export async function getSceneByValue(value: string): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('style_scenes')
    .select('*')
    .eq('value', value)
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Scene;
}

// Get a specific scene by id
export async function getSceneById(id: string): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('style_scenes')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null; // Not found or multiple
    throw error;
  }
  return data as Scene;
}

// Get a specific wardrobe by value
export async function getWardrobeByValue(value: string): Promise<Wardrobe | null> {
  const { data, error } = await supabase
    .from('style_wardrobes')
    .select('*')
    .eq('value', value)
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Wardrobe;
}

// Get a specific wardrobe by id
export async function getWardrobeById(id: string): Promise<Wardrobe | null> {
  const { data, error } = await supabase
    .from('style_wardrobes')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null; // Not found or multiple
    throw error;
  }
  return data as Wardrobe;
}

// Get a specific color by value
export async function getColorByValue(value: string): Promise<Color | null> {
  const { data, error } = await supabase
    .from('style_colors')
    .select('*')
    .eq('value', value)
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Color;
}

// Get a specific color by id
export async function getColorById(id: string): Promise<Color | null> {
  const { data, error } = await supabase
    .from('style_colors')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null; // Not found or multiple
    throw error;
  }
  return data as Color;
}

// Deprecated functions - kept for migration compatibility
// @deprecated Use getScenes(), getWardrobes(), getColors() instead
export async function getAllOptions(): Promise<Option[]> {
  // This function is deprecated as the style_options table no longer exists
  throw new Error('getAllOptions() is deprecated. Use getScenes(), getWardrobes(), getColors() instead.');
}

// @deprecated Use getSceneByValue(), getWardrobeByValue(), getColorByValue() instead
export async function getOptionByCategory(category: OptionCategory): Promise<Option | null> {
  // This function is deprecated as the style_options table no longer exists
  throw new Error('getOptionByCategory() is deprecated. Use getSceneByValue(), getWardrobeByValue(), getColorByValue() instead.');
}

// Admin-only functions
export async function updateStyleConfig(id: StyleId, style: Partial<Style>): Promise<Style> {
  const { data, error } = await supabase
    .from('styles')
    .update(style)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // Optionally: trigger cache invalidation logic elsewhere if needed
  return data as Style;
}

// @deprecated Use updateScene(), updateWardrobe(), updateColor() instead
export async function updateOption(category: OptionCategory, option: Partial<Option>): Promise<Option> {
  // This function is deprecated as the style_options table no longer exists
  throw new Error('updateOption() is deprecated. Use updateScene(), updateWardrobe(), updateColor() instead.');
}

// Admin-only functions for separate tables
export async function updateScene(value: string, scene: Partial<Scene>): Promise<Scene> {
  const { data, error } = await supabase
    .from('style_scenes')
    .update(scene)
    .eq('value', value)
    .select()
    .single();
  if (error) throw error;
  return data as Scene;
}

export async function updateWardrobe(value: string, wardrobe: Partial<Wardrobe>): Promise<Wardrobe> {
  const { data, error } = await supabase
    .from('style_wardrobes')
    .update(wardrobe)
    .eq('value', value)
    .select()
    .single();
  if (error) throw error;
  return data as Wardrobe;
}

export async function updateColor(value: string, color: Partial<Color>): Promise<Color> {
  const { data, error } = await supabase
    .from('style_colors')
    .update(color)
    .eq('value', value)
    .select()
    .single();
  if (error) throw error;
  return data as Color;
}

// Cache management - No-ops or handled elsewhere
export async function invalidateStyleConfigsCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
}

// @deprecated Use invalidateScenesCache(), invalidateWardrobesCache(), invalidateColorsCache() instead
export async function invalidateOptionsCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
}

export async function invalidateScenesCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
}

export async function invalidateWardrobesCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
}

export async function invalidateColorsCache() {
  // No-op: cache invalidation should be handled at the API or CDN layer if needed
  return;
} 