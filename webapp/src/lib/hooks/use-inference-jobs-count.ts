import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'

interface UseInferenceJobsCountResult {
  count: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useInferenceJobsCount(): UseInferenceJobsCountResult {
  const { isAuthenticated, user } = useAuth()
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const { count: c, error } = await supabase
        .from('inference_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) throw error
      setCount(c ?? 0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inference jobs count'))
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.id, supabase])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return { count, isLoading, error, refetch: fetchCount }
}


