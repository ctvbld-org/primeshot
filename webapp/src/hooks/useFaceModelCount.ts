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
      // Count only the relevant face models (exclude deleted/failed)
      const relevantModels = models.filter(model => 
        ['queued', 'training', 'ready', 'failed'].includes(model.status)
      )
      
      return relevantModels.length
    },
    enabled: !!user?.id, // Only run when user is authenticated
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 