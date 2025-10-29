// Webapp-specific config API that uses the webapp's Supabase client
import { createClient } from '@/lib/supabase/client';
import { createConfigApi } from '@primeshot/common/lib/api/config';
import type { Style, Scene, Wardrobe, Color, StyleId } from '@primeshot/common';

const supabase = createClient();
const api = createConfigApi(supabase);

// Export all functions
export const {
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
} = api;

// Export types for convenience
export type { Style, Scene, Wardrobe, Color, StyleId };
