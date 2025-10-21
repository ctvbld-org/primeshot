import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@primeshot/common'

export interface InferenceSettings {
  qualities: string[]
  quality_labels: Record<string, string>
  nb_takes_options: number[]
  aspect_ratios: string[]
  defaults: { quality: string; nb_takes: number; aspect_ratio: string }
}

export function useInferenceSettings() {
  return useQuery<InferenceSettings>({
    queryKey: ['inferenceSettings'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('api/inference/settings'))
      if (!res.ok) throw new Error('Failed to fetch inference settings')
      const raw = await res.json()
      // Do minimal normalization; assume DB has full config
      return {
        qualities: raw.qualities || [],
        quality_labels: raw.quality_labels || {},
        nb_takes_options: raw.nb_takes_options || [],
        aspect_ratios: raw.aspect_ratios || [],
        defaults: raw.defaults || { quality: '', nb_takes: 0, aspect_ratio: '' },
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  })
}


