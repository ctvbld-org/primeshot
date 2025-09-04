import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

export interface ActiveTrainingJob {
  id: string;
  character_id: string;
  user_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  modal_job_id?: string | null;
  retry_after?: string | null;
  retry_count?: number;
}

// Simple in-memory cache (module scoped) so it's shared across hook instances
// and persists while the page stays loaded.
const CACHE_TTL_MS = 60_000;
type CacheEntry = { job: ActiveTrainingJob | null; ts: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = globalThis as any;
const cacheMap: Map<string, CacheEntry> = globalAny.__activeTrainingJobCache || new Map();
globalAny.__activeTrainingJobCache = cacheMap;

export function useActiveTrainingJob(characterId: string | null) {
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState<ActiveTrainingJob | null>(() => {
    if (!characterId) return null;
    const cached = cacheMap.get(characterId);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      return cached.job;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !characterId) {
      setJob(null);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Seed from cache to avoid initial flash
    try {
      const cached = cacheMap.get(characterId);
      if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        setJob(cached.job);
      }
    } catch {}

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
        const nextJob = (data as ActiveTrainingJob) || null;
        setJob(nextJob);
        // Update cache
        cacheMap.set(characterId, { job: nextJob, ts: Date.now() });
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
          const isActiveStatus = ['initializing', 'queued', 'pending', 'running'].includes(row.status as any);
          if (isActiveStatus) {
            // Keep the most recent by created_at via refetch when IDs differ
            if (!job || row.id === job.id) {
              setJob(row);
              cacheMap.set(characterId, { job: row, ts: Date.now() });
            }
          } else {
            // Job finished (completed/failed) -> clear active job so UI hides progress
            setJob(null);
            cacheMap.set(characterId, { job: null, ts: Date.now() });
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


