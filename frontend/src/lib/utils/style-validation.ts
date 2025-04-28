import { createClient } from '@/lib/supabase/client'
import type { StyleSettings, StylePhotographyStyle } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

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
        .from('style_configs')
        .select('*');
      if (error) {
        console.error('Error fetching style options:', error);
        throw error;
      }
      return {
        photographyStyles: Array.from(new Set(styleConfigs.map(config => config.id))),
        backgrounds: Array.from(new Set(styleConfigs.flatMap(config => config.available_backgrounds))),
        clothing: Array.from(new Set(styleConfigs.flatMap(config => config.available_clothing)))
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
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
 * Validates style settings against available options
 * @param validOptions - result from useValidStyleOptions().data
 * @param settings - style settings to validate
 */
export function validateStyleSettings(validOptions: { photographyStyles: string[]; backgrounds: string[]; clothing: string[] }, settings: StyleSettings) {
  const errors: string[] = [];

  if (!validOptions.photographyStyles.includes(settings.photographyStyle)) {
    errors.push(`Invalid photography style: ${escapeHtml(settings.photographyStyle)}`)
  }

  if (!validOptions.backgrounds.includes(settings.background)) {
    errors.push(`Invalid background: ${escapeHtml(settings.background)}`)
  }

  if (!validOptions.clothing.includes(settings.clothing)) {
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
    .from('style_configs')
    .select('*')
    .eq('id', photographyStyle)
    .single()
  if (error) {
    console.error('Error fetching style config:', error)
    throw error
  }
  return {
    backgrounds: styleConfig.available_backgrounds,
    clothing: styleConfig.available_clothing,
    clothingColors: styleConfig.available_clothing_colors
  }
} 