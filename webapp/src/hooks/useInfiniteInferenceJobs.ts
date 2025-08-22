'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { useAuth } from '@/contexts/auth-context';
import { InferenceJob } from '@/hooks/useInferenceQueue';

interface UseInfiniteInferenceJobsReturn {
  jobs: InferenceJob[];
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addJob: (jobId: string, nbTakes: number) => void;
  updateJobWithRealId: (placeholderId: string, realJobId: string) => void;
  updateJobStatus: (jobId: string, status: InferenceJob['status']) => void;
  updateThumbnail: (jobId: string, thumbnailIndex: number, updates: Partial<InferenceThumbnail>) => void;
}

const JOBS_PER_PAGE = 10;

export function useInfiniteInferenceJobs(): UseInfiniteInferenceJobsReturn {
  const [jobs, setJobs] = useState<InferenceJob[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  
  const { user } = useAuth();
  const activeJobIds = useRef<Set<string>>(new Set());

  // Load initial jobs and total count
  const loadInitialJobs = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { 
        fetchActiveInferenceJobs, 
        fetchInferenceJobsPaginated, 
        getTotalInferenceJobsCount,
        getInferenceImageUrl 
      } = await import('@/lib/api/inference-job-management');
      
      // Fetch total count and initial jobs in parallel
      const [totalCountResult, activeJobs, initialJobs] = await Promise.all([
        getTotalInferenceJobsCount(user.id),
        fetchActiveInferenceJobs(user.id),
        fetchInferenceJobsPaginated(user.id, JOBS_PER_PAGE, 0)
      ]);

      console.log(`📊 Total inference jobs: ${totalCountResult}, Active: ${activeJobs.length}, Initial batch: ${initialJobs.length}`);

      setTotalCount(totalCountResult);
      
      const allJobs: InferenceJob[] = [];

      // Convert active database jobs to UI format
      activeJobs.forEach(dbJob => {
        const nbTakes = dbJob.nb_takes || 1;
        const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
          id: uuidv4(),
          jobId: dbJob.id,
          status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'running' : 'queued',
          index,
          progress: dbJob.status === 'running' ? 50 : 0
        }));

        allJobs.push({
          id: dbJob.id,
          status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'running' : 'queued',
          thumbnails,
          createdAt: new Date(dbJob.created_at),
          nbTakes
        });

        activeJobIds.current.add(dbJob.id);
      });

      // Convert initial jobs to UI format
      initialJobs.forEach(dbJob => {
        // Skip if already added as active job
        if (activeJobIds.current.has(dbJob.id)) return;

        const thumbnails: InferenceThumbnail[] = dbJob.generated_images.map((image, index) => ({
          id: uuidv4(),
          jobId: dbJob.id,
          status: 'completed',
          index,
          progress: 100,
          imageUrl: getInferenceImageUrl(image.original_path),
          webImageUrl: getInferenceImageUrl(image.web_path)
        }));

        // Fill remaining slots if there are fewer images than expected takes
        const nbTakes = dbJob.nb_takes || thumbnails.length;
        while (thumbnails.length < nbTakes) {
          thumbnails.push({
            id: uuidv4(),
            jobId: dbJob.id,
            status: 'completed',
            index: thumbnails.length,
            progress: 100
          });
        }

        allJobs.push({
          id: dbJob.id,
          status: 'completed',
          thumbnails,
          createdAt: new Date(dbJob.created_at),
          nbTakes
        });
      });

      // Sort by creation date (newest first)
      allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setJobs(allJobs);
      setOffset(initialJobs.length);
      setHasMore(initialJobs.length === JOBS_PER_PAGE && allJobs.length < totalCountResult);
      
      console.log(`🚀 Loaded ${allJobs.length} initial jobs, hasMore: ${allJobs.length < totalCountResult}`);

    } catch (err) {
      console.error('❌ Failed to load initial inference jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load more jobs for infinite scrolling
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const { fetchInferenceJobsPaginated, getInferenceImageUrl } = await import('@/lib/api/inference-job-management');
      
      const moreJobs = await fetchInferenceJobsPaginated(user.id, JOBS_PER_PAGE, offset);
      
      console.log(`📄 Loading more jobs: offset=${offset}, fetched=${moreJobs.length}`);

      if (moreJobs.length === 0) {
        setHasMore(false);
        return;
      }

      const newJobs: InferenceJob[] = [];

      moreJobs.forEach(dbJob => {
        // Skip if already exists (shouldn't happen but safety check)
        if (jobs.some(j => j.id === dbJob.id)) return;

        const thumbnails: InferenceThumbnail[] = dbJob.generated_images.map((image, index) => ({
          id: uuidv4(),
          jobId: dbJob.id,
          status: 'completed',
          index,
          progress: 100,
          imageUrl: getInferenceImageUrl(image.original_path),
          webImageUrl: getInferenceImageUrl(image.web_path)
        }));

        // Fill remaining slots if there are fewer images than expected takes
        const nbTakes = dbJob.nb_takes || thumbnails.length;
        while (thumbnails.length < nbTakes) {
          thumbnails.push({
            id: uuidv4(),
            jobId: dbJob.id,
            status: 'completed',
            index: thumbnails.length,
            progress: 100
          });
        }

        newJobs.push({
          id: dbJob.id,
          status: 'completed',
          thumbnails,
          createdAt: new Date(dbJob.created_at),
          nbTakes
        });
      });

      setJobs(prev => [...prev, ...newJobs]);
      setOffset(prev => prev + moreJobs.length);
      setHasMore(moreJobs.length === JOBS_PER_PAGE);

      console.log(`📄 Loaded ${newJobs.length} more jobs, total: ${jobs.length + newJobs.length}, hasMore: ${moreJobs.length === JOBS_PER_PAGE}`);

    } catch (err) {
      console.error('❌ Failed to load more inference jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more jobs');
    } finally {
      setIsLoadingMore(false);
    }
  }, [user?.id, isLoadingMore, hasMore, offset, jobs]);

  // Refresh all jobs
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    setJobs([]);
    activeJobIds.current.clear();
    await loadInitialJobs();
  }, [loadInitialJobs]);

  // Add new job (for real-time updates)
  const addJob = useCallback((jobId: string, nbTakes: number) => {
    const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
      id: uuidv4(),
      jobId,
      status: 'queued' as const,
      index,
    }));

    const newJob: InferenceJob = {
      id: jobId,
      status: 'queued',
      thumbnails,
      createdAt: new Date(),
      nbTakes,
    };

    setJobs(prev => [newJob, ...prev]);
    setTotalCount(prev => prev + 1);
    activeJobIds.current.add(jobId);
    
    console.log(`➕ Added job ${jobId} with ${nbTakes} thumbnails`);
  }, []);

  // Update job with real ID (replace placeholder)
  const updateJobWithRealId = useCallback((placeholderId: string, realJobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === placeholderId) {
        const updatedThumbnails = job.thumbnails.map(thumbnail => ({
          ...thumbnail,
          jobId: realJobId
        }));
        
        const updatedJob = {
          ...job,
          id: realJobId,
          thumbnails: updatedThumbnails
        };
        
        console.log(`🔄 Updated placeholder ${placeholderId} to real job ID ${realJobId}`);
        activeJobIds.current.add(realJobId);
        
        return updatedJob;
      }
      return job;
    }));
  }, []);

  // Update job status
  const updateJobStatus = useCallback((jobId: string, status: InferenceJob['status']) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));

    if (status === 'completed' || status === 'failed') {
      activeJobIds.current.delete(jobId);
    }
  }, []);

  // Update thumbnail
  const updateThumbnail = useCallback((
    jobId: string, 
    thumbnailIndex: number, 
    updates: Partial<InferenceThumbnail>
  ) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const newThumbnails = job.thumbnails.map((thumbnail, index) => 
          index === thumbnailIndex ? { ...thumbnail, ...updates } : thumbnail
        );
        return { ...job, thumbnails: newThumbnails };
      }
      return job;
    }));
  }, []);

  // Load initial jobs on mount
  useEffect(() => {
    loadInitialJobs();
  }, [loadInitialJobs]);

  return {
    jobs,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    addJob,
    updateJobWithRealId,
    updateJobStatus,
    updateThumbnail,
  };
}
