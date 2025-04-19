import { validStyleIds, validBackgrounds, validOutfits } from '@/lib/generated-validation';
import type { StylePhotographyStyle, StyleBackground, StyleOutfit } from '@/lib/generated-types';
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };

/**
 * Validates that style.json configuration contains valid values according to type definitions
 * This function should be called during development to ensure configuration is valid
 */
export function validateStylesConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if all style IDs are valid StylePhotographyStyle types
  const configStyleIds = stylesConfig.map(style => style.id);

  // Find styles in config that aren't in type definition
  const invalidStyleIds = configStyleIds.filter(id => !validStyleIds.includes(id as StylePhotographyStyle));
  if (invalidStyleIds.length > 0) {
    errors.push(`Found style IDs in config that aren't in StylePhotographyStyle type: ${invalidStyleIds.join(', ')}`);
  }

  // Find styles in type definition that aren't in config
  const missingStyleIds = validStyleIds.filter(id => !configStyleIds.includes(id));
  if (missingStyleIds.length > 0) {
    warnings.push(`StylePhotographyStyle types without config: ${missingStyleIds.join(', ')}`);
  }

  // Validate background options
  stylesConfig.forEach(style => {
    const invalidBackgrounds = style.availableBackgrounds.filter(
      bg => !validBackgrounds.includes(bg as StyleBackground)
    );
    if (invalidBackgrounds.length > 0) {
      errors.push(`Style ${style.id} has invalid backgrounds: ${invalidBackgrounds.join(', ')}`);
    }
  });

  // Validate outfit options
  stylesConfig.forEach(style => {
    const invalidOutfits = style.availableOutfits.filter(
      outfit => !validOutfits.includes(outfit as StyleOutfit)
    );
    if (invalidOutfits.length > 0) {
      errors.push(`Style ${style.id} has invalid outfits: ${invalidOutfits.join(', ')}`);
    }
  });

  // Print errors and warnings to console during development
  if (process.env.NODE_ENV === 'development') {
    if (errors.length > 0) {
      console.error('Style configuration validation errors:');
      errors.forEach(err => console.error(`- ${err}`));
    }
    
    if (warnings.length > 0) {
      console.warn('Style configuration validation warnings:');
      warnings.forEach(warn => console.warn(`- ${warn}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.info('Style configuration is valid!');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Returns the validated configuration with type safety
 * This is the recommended way to access the configuration
 */
export function getStylesConfig() {
  // In development, validate the configuration
  if (process.env.NODE_ENV === 'development') {
    validateStylesConfig();
  }
  
  return {
    styles: stylesConfig,
    options: optionsConfig
  };
}

export default getStylesConfig; 