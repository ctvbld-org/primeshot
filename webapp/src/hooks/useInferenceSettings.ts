import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'

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
      return res.json()
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  })
}


