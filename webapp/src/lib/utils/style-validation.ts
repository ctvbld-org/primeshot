import { createClient } from '@/lib/supabase/client'
import type { StyleSettings, StylePhotographyStyle } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

// New interface with updated property names
export interface StyleSettingsNew {
  photographyStyle: StylePhotographyStyle
  scene?: string
  wardrobe?: string
  color?: string
  customSettings?: Record<string, unknown>
}

// MIGRATION NOTE:
// - Use the useValidStyleOptions hook to fetch valid options in React components.
// - Pass the result to validateStyleSettings(validOptions, settings).
// - Remove any usage of getValidStyleOptions() as a direct async function.

/**
 * React Query hook to fetch valid style options from the database
 */
export function useValidStyleOptions() {
  return useQuery({
    queryKey: ['valid-style-options'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: styleConfigs, error } = await supabase
        .from('styles')
        .select('*');
      if (error) {
        console.error('Error fetching style options:', error);
        throw error;
      }
      return {
        photographyStyles: Array.from(new Set(styleConfigs.map(config => config.id))),
        scenes: Array.from(new Set(styleConfigs.flatMap(config => config.available_scenes))),
        wardrobes: Array.from(new Set(styleConfigs.flatMap(config => config.available_wardrobes))),
        colors: Array.from(new Set(styleConfigs.flatMap(config => config.available_colors)))
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Legacy hook for backward compatibility during migration
// @deprecated Use useValidStyleOptions() instead
export function useValidStyleOptionsLegacy() {
  const { data, ...rest } = useValidStyleOptions();
  
  if (!data) return { data: null, ...rest };
  
  return {
    data: {
      photographyStyles: data.photographyStyles,
      backgrounds: data.scenes, // Map to legacy naming
      clothing: data.wardrobes
    },
    ...rest
  };
}

// Utility to escape HTML special characters
function escapeHtml(str: string): string {
  return str.replace(/[&<>'"`]/g, (char) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '`': '&#96;'
    };
    return escapeMap[char] || char;
  });
}

/**
 * Validates style settings against available options (supports both old and new formats)
 * @param validOptions - result from useValidStyleOptions().data
 * @param settings - style settings to validate (old or new format)
 */
export function validateStyleSettings(
  validOptions: { 
    photographyStyles: string[]; 
    scenes: string[]; 
    wardrobes: string[];
    colors: string[];
  }, 
  settings: StyleSettings | StyleSettingsNew
) {
  const errors: string[] = [];

  if (!validOptions.photographyStyles.includes(settings.photographyStyle)) {
    errors.push(`Invalid photography style: ${escapeHtml(settings.photographyStyle)}`)
  }

  // Handle both old and new property names
  const scene = 'scene' in settings ? settings.scene : ('background' in settings ? (settings as any).background : undefined);
  const wardrobe = 'wardrobe' in settings ? settings.wardrobe : ('clothing' in settings ? (settings as any).clothing : undefined);
  const color = 'color' in settings ? settings.color : ('clothingColor' in settings ? (settings as any).clothingColor : undefined);

  if (scene && !validOptions.scenes.includes(scene)) {
    errors.push(`Invalid scene: ${escapeHtml(scene)}`)
  }

  if (wardrobe && !validOptions.wardrobes.includes(wardrobe)) {
    errors.push(`Invalid wardrobe: ${escapeHtml(wardrobe)}`)
  }

  if (color && !validOptions.colors.includes(color)) {
    errors.push(`Invalid color: ${escapeHtml(color)}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Legacy validation function for backward compatibility during migration
// @deprecated Use validateStyleSettings() instead
export function validateStyleSettingsLegacy(
  validOptions: { photographyStyles: string[]; backgrounds: string[]; clothing: string[] }, 
  settings: any
) {
  const errors: string[] = [];

  if (!validOptions.photographyStyles.includes(settings.photographyStyle)) {
    errors.push(`Invalid photography style: ${escapeHtml(settings.photographyStyle)}`)
  }

  if (settings.background && !validOptions.backgrounds.includes(settings.background)) {
    errors.push(`Invalid background: ${escapeHtml(settings.background)}`)
  }

  if (settings.clothing && !validOptions.clothing.includes(settings.clothing)) {
    errors.push(`Invalid clothing: ${escapeHtml(settings.clothing)}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Returns all valid options for a specific photography style
 */
export async function getStyleOptions(photographyStyle: StylePhotographyStyle) {
  const supabase = createClient()
  const { data: styleConfig, error } = await supabase
    .from('styles')
    .select('*')
    .eq('id', photographyStyle)
    .single()
  if (error) {
    console.error('Error fetching style config:', error)
    throw error
  }
  return {
    scenes: styleConfig.available_scenes,
    wardrobes: styleConfig.available_wardrobes,
    colors: styleConfig.available_colors
  }
}

// Legacy function for backward compatibility during migration
// @deprecated Use getStyleOptions() instead
export async function getStyleOptionsLegacy(photographyStyle: StylePhotographyStyle) {
  const supabase = createClient()
  const { data: styleConfig, error } = await supabase
    .from('styles')
    .select('*')
    .eq('id', photographyStyle)
    .single()
  if (error) {
    console.error('Error fetching style config:', error)
    throw error
  }
  return {
    backgrounds: styleConfig.available_scenes,
    clothing: styleConfig.available_wardrobes,
    clothingColors: styleConfig.available_colors
  }
} 