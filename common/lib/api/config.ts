import type { Style, Scene, Wardrobe, Color, StyleId } from '../../types/styles';
import type { SupabaseClient } from '@supabase/supabase-js';

// Factory function that accepts a supabase client
// This allows both webapp and website to use their own clients
export function createConfigApi(supabase: SupabaseClient<any>) {
  // Get all style configs
  async function getAllStyleConfigs(): Promise<Style[]> {
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Style[];
  }

  // Get a style config by ID
  async function getStyleConfigById(id: StyleId): Promise<Style | null> {
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
  async function getScenes(): Promise<Scene[]> {
    const { data, error } = await supabase
      .from('style_scenes')
      .select('*')
      .order('value');
    if (error) throw error;
    return data as Scene[];
  }

  async function getWardrobes(): Promise<Wardrobe[]> {
    const { data, error } = await supabase
      .from('style_wardrobes')
      .select('*')
      .order('value');
    if (error) throw error;
    return data as Wardrobe[];
  }

  async function getColors(): Promise<Color[]> {
    const { data, error } = await supabase
      .from('style_colors')
      .select('*')
      .order('value');
    if (error) throw error;
    return data as Color[];
  }

  // Get a specific scene by value
  async function getSceneByValue(value: string): Promise<Scene | null> {
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
  async function getSceneById(id: string): Promise<Scene | null> {
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
  async function getWardrobeByValue(value: string): Promise<Wardrobe | null> {
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
  async function getWardrobeById(id: string): Promise<Wardrobe | null> {
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
  async function getColorByValue(value: string): Promise<Color | null> {
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
  async function getColorById(id: string): Promise<Color | null> {
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

  // Admin-only functions
  async function updateStyleConfig(id: StyleId, style: Partial<Style>): Promise<Style> {
    const { data, error } = await supabase
      .from('styles')
      .update(style)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Style;
  }

  // Admin-only functions for separate tables
  async function updateScene(value: string, scene: Partial<Scene>): Promise<Scene> {
    const { data, error } = await supabase
      .from('style_scenes')
      .update(scene)
      .eq('value', value)
      .select()
      .single();
    if (error) throw error;
    return data as Scene;
  }

  async function updateWardrobe(value: string, wardrobe: Partial<Wardrobe>): Promise<Wardrobe> {
    const { data, error } = await supabase
      .from('style_wardrobes')
      .update(wardrobe)
      .eq('value', value)
      .select()
      .single();
    if (error) throw error;
    return data as Wardrobe;
  }

  async function updateColor(value: string, color: Partial<Color>): Promise<Color> {
    const { data, error } = await supabase
      .from('style_colors')
      .update(color)
      .eq('value', value)
      .select()
      .single();
    if (error) throw error;
    return data as Color;
  }

  return {
    getAllStyleConfigs,
    getStyleConfigById,
    getScenes,
    getWardrobes,
    getColors,
    getSceneByValue,
    getSceneById,
    getWardrobeByValue,
    getWardrobeById,
    getColorByValue,
    getColorById,
    updateStyleConfig,
    updateScene,
    updateWardrobe,
    updateColor,
  };
}

