import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

export interface TrainingJobInfo {
  id: string;
  character_id: string;
  user_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modal_job_id?: string;
  error_message?: string;
  credits_spent?: number;
}

export function useTrainingJobStatus(jobId: string | null) {
  const { isAuthenticated } = useAuth();
  const [jobStatus, setJobStatus] = useState<TrainingJobInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !jobId) {
      setJobStatus(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    
    // Initial fetch
    const fetchInitialStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('training_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching initial training job status:', error);
          setError(error);
          return;
        }

        setJobStatus(data as TrainingJobInfo);
        setError(null);
      } catch (err) {
        console.error('Error in initial fetch:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`training-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'training_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          console.log('Training job status updated:', payload.new);
          setJobStatus(payload.new as TrainingJobInfo);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to training job updates: ${jobId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Subscription error for training job: ${jobId}`);
        }
      });

    // Cleanup subscription
    return () => {
      console.log(`Unsubscribing from training job updates: ${jobId}`);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, jobId]);

  return {
    data: jobStatus,
    isLoading,
    error,
  };
}