import { createClient } from '@/lib/supabase/client'
import type { StyleSettings, StylePhotographyStyle } from '@/lib/types'

// Cache the valid options to avoid repeated database calls
let cachedValidOptions: {
  photographyStyles: string[]
  backgrounds: string[]
  clothing: string[]
} | null = null

/**
 * Fetches valid style options from the database
 */
export async function getValidStyleOptions() {
  if (cachedValidOptions) {
    return cachedValidOptions
  }

  const supabase = createClient()
  
  // Fetch all style configs to get available options
  const { data: styleConfigs, error } = await supabase
    .from('style_configs')
    .select('*')
  
  if (error) {
    console.error('Error fetching style options:', error)
    throw error
  }

  // Aggregate all unique values
  const options = {
    photographyStyles: Array.from(new Set(styleConfigs.map(config => config.id))),
    backgrounds: Array.from(new Set(styleConfigs.flatMap(config => config.available_backgrounds))),
    clothing: Array.from(new Set(styleConfigs.flatMap(config => config.available_clothing)))
  }

  // Cache the results
  cachedValidOptions = options
  return options
}

/**
 * Validates style settings against available options in the database
 */
export async function validateStyleSettings(settings: StyleSettings) {
  const validOptions = await getValidStyleOptions()
  const errors: string[] = []

  if (!validOptions.photographyStyles.includes(settings.photographyStyle)) {
    errors.push(`Invalid photography style: ${settings.photographyStyle}`)
  }

  if (!validOptions.backgrounds.includes(settings.background)) {
    errors.push(`Invalid background: ${settings.background}`)
  }

  if (!validOptions.clothing.includes(settings.clothing)) {
    errors.push(`Invalid clothing: ${settings.clothing}`)
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