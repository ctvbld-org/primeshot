import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { useFaceModelsApi } from '@/lib/api/face-models'

export function useFaceModelCount() {
  const { user } = useAuth()
  const { getUserFaceModels } = useFaceModelsApi()

  return useQuery({
    queryKey: ['faceModelCount', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0
      
      const models = await getUserFaceModels(user.id)
      // getUserFaceModels now only returns active models, so we can count all of them
      return models.length
    },
    enabled: !!user?.id, // Only run when user is authenticated
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 