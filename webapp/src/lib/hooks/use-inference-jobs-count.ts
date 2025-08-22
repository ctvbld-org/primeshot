import { useInferenceQueue } from '@/contexts/inference-queue-context'

interface UseInferenceJobsCountResult {
  count: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to get inference jobs count from the centralized queue
 * This replaces the old database-based count with queue-based count
 */
export function useInferenceJobsCount(): UseInferenceJobsCountResult {
  const { totalCount, isLoading, error, refresh } = useInferenceQueue()
  
  // Use the total count from the database, not just loaded jobs
  const count = totalCount
  
  return { 
    count, 
    isLoading,
    error: error ? new Error(error) : null, 
    refetch: refresh
  }
}


