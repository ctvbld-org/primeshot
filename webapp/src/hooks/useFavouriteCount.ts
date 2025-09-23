import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

export function useFavouriteCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favouriteCount', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { count, error } = await supabase
        .from('generated_images')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('favourite', true)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!user?.id,
    staleTime: 30000,
    gcTime: 300000,
  })
}


