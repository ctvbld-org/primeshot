import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { useCharactersApi } from '@/lib/api/characters'

export function useCharacterCount() {
  const { user } = useAuth()
  const { getActiveCharacterCount } = useCharactersApi()

  return useQuery({
    queryKey: ['characterCount', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0
      
      // Count all active characters (queued, training, ready) for limit validation
      return await getActiveCharacterCount(user.id)
    },
    enabled: !!user?.id, // Only run when user is authenticated
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
}