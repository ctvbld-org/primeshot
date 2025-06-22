import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJobsApi, createJobProgressPoller } from '@/lib/api/jobs';
import type { TrainingProgressResponse, InferenceProgressResponse } from '@/types/jobs';
import { useAuth } from '@/contexts/auth-context';

type JobProgressData = TrainingProgressResponse | InferenceProgressResponse;

interface UseJobProgressOptions {
  jobId: string;
  userId: string;
  jobType: 'training' | 'inference';
  enableRealtime?: boolean;
  pollingInterval?: number;
  onComplete?: (data: JobProgressData) => void;
  onError?: (error: Error) => void;
}

interface UseJobProgressReturn {
  data: JobProgressData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isComplete: boolean;
  progress: number;
}

export function useJobProgress({
  jobId,
  userId,
  jobType,
  enableRealtime = true,
  pollingInterval = 2000,
  onComplete,
  onError
}: UseJobProgressOptions): UseJobProgressReturn {
  const [data, setData] = useState<JobProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const jobsApi = useJobsApi();
  const supabase = createClient();

  const fetchProgress = useCallback(async (): Promise<JobProgressData> => {
    if (jobType === 'training') {
      return jobsApi.getTrainingProgress(jobId, userId);
    } else {
      return jobsApi.getInferenceProgress(jobId, userId);
    }
  }, [jobsApi, jobId, userId, jobType]);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await fetchProgress();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch job progress');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProgress, onError]);

  // Setup realtime subscription for live updates
  useEffect(() => {
    if (!enableRealtime || !jobId) return;

    const tableName = jobType === 'training' ? 'training_jobs' : 'inference_jobs';
    
    const subscription = supabase
      .channel(`job-progress-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `id=eq.${jobId}`
        },
        async (payload) => {
          console.log('Realtime job update:', payload);
          
          // Refetch complete data when we get a realtime update
          try {
            const updatedData = await fetchProgress();
            setData(updatedData);
            
            if (updatedData.is_complete) {
              onComplete?.(updatedData);
            }
          } catch (err) {
            console.error('Error fetching updated job data:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, jobId, jobType, enableRealtime, fetchProgress, onComplete]);

  // Setup polling fallback for when realtime is disabled or as backup
  useEffect(() => {
    if (!jobId || !userId) return;

    // Initial fetch
    refetch();

    // If realtime is disabled, use polling
    if (!enableRealtime) {
      const cleanup = createJobProgressPoller(
        fetchProgress,
        (progressData) => {
          setData(progressData);
          setIsLoading(false);
        },
        {
          interval: pollingInterval,
          onComplete: () => {
            setIsLoading(false);
            if (data) onComplete?.(data);
          },
          onError: (err) => {
            setError(err);
            setIsLoading(false);
            onError?.(err);
          }
        }
      );

      return cleanup;
    }
  }, [jobId, userId, enableRealtime, pollingInterval, refetch, fetchProgress, onComplete, onError]);

  const isComplete = data?.is_complete ?? false;
  const progress = data?.progress ?? 0;

  return {
    data,
    isLoading,
    error,
    refetch,
    isComplete,
    progress
  };
}

// Specialized hooks for each job type

export function useInferenceProgress(
  jobId: string,
  userId: string,
  options?: Omit<UseJobProgressOptions, 'jobId' | 'userId' | 'jobType'>
) {
  return useJobProgress({
    jobId,
    userId,
    jobType: 'inference',
    ...options
  });
}

// Hook for managing multiple jobs
export function useJobQueue(userId: string, jobType: 'training' | 'inference') {
  const [jobs, setJobs] = useState<JobProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetchJobs = async () => {
      try {
        const tableName = jobType === 'training' ? 'training_jobs' : 'inference_jobs';
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setJobs(data || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();

    // Subscribe to job updates
    const subscription = supabase
      .channel(`user-jobs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: jobType === 'training' ? 'training_jobs' : 'inference_jobs',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchJobs(); // Refetch when any job changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, userId, jobType]);

  return {
    jobs,
    isLoading,
    activeJobs: jobs.filter(job => !job.is_complete),
    completedJobs: jobs.filter(job => job.is_complete),
    queuedJobs: jobs.filter(job => job.status === 'queued'),
    processingJobs: jobs.filter(job => job.status === 'processing')
  };
}



// Export additional hook for face model status tracking
export function useFaceModelStatus(faceModelId: string, userId: string) {
  const [status, setStatus] = useState<'pending' | 'training' | 'completed' | 'failed'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!faceModelId || !user) return;

    const fetchStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('face_models')
          .select('status')
          .eq('id', faceModelId)
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch face model status'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Set up real-time subscription for face model status
    const channel = supabase
      .channel(`face-model-${faceModelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'face_models',
          filter: `id=eq.${faceModelId}`
        },
        (payload) => {
          const updatedModel = payload.new;
          setStatus(updatedModel.status);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [faceModelId, userId, user, supabase]);

  return { status, isLoading, error };
} 