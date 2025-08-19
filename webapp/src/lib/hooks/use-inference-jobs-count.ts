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
  const { jobs } = useInferenceQueue()
  
  // Count all jobs (active and completed)
  const count = jobs.length
  
  // For backwards compatibility, provide empty implementations
  const refetch = async () => {
    // No-op since the queue handles its own updates
  }

  return { 
    count, 
    isLoading: false, // Queue handles its own loading state
    error: null, 
    refetch 
  }
}


