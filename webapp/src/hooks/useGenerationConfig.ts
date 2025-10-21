import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@primeshot/common'
import { CreditCosts } from './usePricingConfig'

export interface InferenceSettings {
  qualities: string[]
  quality_labels: Record<string, string>
  nb_takes_options: number[]
  aspect_ratios: string[]
  defaults: { quality: string; nb_takes: number; aspect_ratio: string }
}

export interface GenerationConfig {
  inferenceSettings: InferenceSettings
  creditCosts: CreditCosts
}

// New batched hook for generation configuration
export function useGenerationConfig() {
  return useQuery<GenerationConfig>({
    queryKey: ['generationConfig'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('api/inference/config'))
      if (!res.ok) throw new Error('Failed to fetch generation config')
      const raw = await res.json()
      
      // Normalize inference settings
      const inferenceSettings: InferenceSettings = {
        qualities: raw.inferenceSettings?.qualities || [],
        quality_labels: raw.inferenceSettings?.quality_labels || {},
        nb_takes_options: raw.inferenceSettings?.nb_takes_options || [],
        aspect_ratios: raw.inferenceSettings?.aspect_ratios || [],
        defaults: raw.inferenceSettings?.defaults || { quality: '', nb_takes: 0, aspect_ratio: '' },
      }
      
      return {
        inferenceSettings,
        creditCosts: raw.creditCosts || {}
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  })
}

// Individual hooks that use the batched data
export function useInferenceSettings() {
  const { data, ...rest } = useGenerationConfig()
  return {
    data: data?.inferenceSettings,
    ...rest
  }
}

export function useGenerationCreditCosts() {
  const { data, ...rest } = useGenerationConfig()
  return {
    data: data?.creditCosts,
    ...rest
  }
}
