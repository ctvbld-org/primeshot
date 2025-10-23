'use client'

// Re-export from common with website's Supabase client wrapper
// This is already provided via StyleProviders but we need the file for imports
export {
  useStyleData,
  useStylesFromContext,
  useScenesFromContext,
  useWardrobesFromContext,
  useColorsFromContext,
} from '@primeshot/common'

