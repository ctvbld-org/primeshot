import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

export interface ActiveTrainingJob {
  id: string;
  character_id: string;
  user_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'running';
  created_at: string;
  updated_at: string;
  modal_job_id?: string | null;
  retry_after?: string | null;
  retry_count?: number;
}

export function useActiveTrainingJob(characterId: string | null) {
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState<ActiveTrainingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !characterId) {
      setJob(null);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchLatest = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('training_jobs')
          .select('id, character_id, user_id, status, created_at, updated_at, modal_job_id, retry_after, retry_count')
          .eq('user_id', user.id)
          .eq('character_id', characterId)
          .in('status', ['initializing', 'queued', 'pending', 'running'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setJob((data as ActiveTrainingJob) || null);
        setError(null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();

    // Subscribe to updates for this character's latest job
    channel = supabase
      .channel(`training-jobs-active-${characterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'training_jobs', filter: `character_id=eq.${characterId}` },
        (payload) => {
          const row = payload.new as ActiveTrainingJob;
          if (row.user_id !== user.id) return;
          if (!['initializing', 'queued', 'pending', 'running'].includes(row.status)) return;
          // Keep the most recent by created_at via refetch when IDs differ
          if (!job || row.id === job.id) {
            setJob(row);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, characterId]);

  return { job, loading, error };
}


