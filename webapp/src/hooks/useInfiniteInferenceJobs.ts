'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { useAuth } from '@/contexts/auth-context';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { getApiUrl } from '@/lib/api/client';

interface UseInfiniteInferenceJobsReturn {
  jobs: InferenceJob[];
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addJob: (jobId: string, nbTakes: number, meta?: { styleId?: string; sceneId?: string; wardrobeId?: string; colorId?: string; aspectRatio?: string; quality?: string }) => void;
  updateJobWithRealId: (placeholderId: string, realJobId: string) => void;
  updateJobStatus: (jobId: string, status: string) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  updateJobMessage: (jobId: string, message?: string) => void;
  updateThumbnail: (jobId: string, thumbnailIndex: number, updates: Partial<InferenceThumbnail>) => void;
  removeJob: (jobId: string) => void;
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
      const { charactersApi } = await import('@/lib/api/characters');
      
      // Fetch total count and initial jobs in parallel
      const [totalCountResult, initialJobs] = await Promise.all([
        getTotalInferenceJobsCount(user.id),
        fetchInferenceJobsPaginated(user.id, JOBS_PER_PAGE, 0)
      ]);

      setTotalCount(totalCountResult);
      
      const allJobs: InferenceJob[] = [];

      // Helper to parse zero-based index from IMG-XX naming in path
      const parseIndexFromPath = (p?: string | null): number | null => {
        if (!p) return null;
        const m = p.match(/IMG-(\d+)/i);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        return isNaN(n) ? null : Math.max(0, n - 1);
      };

      // Prepare character map for initial page
      const initialCharacterIds = Array.from(new Set(initialJobs.map((j: any) => j.character_id).filter(Boolean)));
      let initialCharMap: Record<string, { name?: string; thumbnail_url?: string }> = {};
      try {
        const chars = await charactersApi.getCharactersByIds(initialCharacterIds);
        initialCharMap = (chars || []).reduce((acc: any, c: any) => {
          acc[c.id] = { name: c.name, thumbnail_url: c.thumbnail_url };
          return acc;
        }, {} as Record<string, { name?: string; thumbnail_url?: string }>);
      } catch {}

      // Convert all initial jobs to UI format
      initialJobs.forEach(dbJob => {
        const nbTakes = dbJob.nb_takes || 1;
        
        // Check if this is an active job (queued, pending, running)
        const isActive = ['queued', 'pending', 'running'].includes(dbJob.status);
        
        if (isActive) {
          // Active job - create placeholder thumbnails
          const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
            id: uuidv4(),
            jobId: dbJob.id,
            // Only show running overlay for true running. Pending/queued remain queued and use jobStatus to show initializing overlay.
            status: dbJob.status === 'running' ? 'running' : 'queued',
            index,
            progress: dbJob.status === 'running' ? 50 : 0
          }));

          // Preserve DB job-level status so the UI can distinguish pending vs queued
          const uiJobStatus = ((): 'queued' | 'pending' | 'running' => {
            if (dbJob.status === 'running') return 'running';
            if (dbJob.status === 'pending') return 'pending';
            return 'queued';
          })();

          allJobs.push({
            id: dbJob.id,
            status: uiJobStatus,
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            styleId: (dbJob as any).style_id,
            sceneId: (dbJob as any).scene_id,
            wardrobeId: (dbJob as any).wardrobe_id,
            colorId: (dbJob as any).color_id,
            quality: (dbJob as any).quality || undefined,
            aspectRatio: (dbJob as any).aspect_ratio || undefined,
            characterId: (dbJob as any).character_id || undefined,
            characterName: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.name : undefined,
            characterThumbnailUrl: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.thumbnail_url as any : undefined,
          });

          activeJobIds.current.add(dbJob.id);
        } else if (dbJob.status === 'failed') {
          // Failed job - but try to surface any images that were actually generated
          const nbTakes = dbJob.nb_takes || ((dbJob as any).generated_images?.length ?? 0) || 1;
          const thumbnailsTemp: (InferenceThumbnail | undefined)[] = new Array(nbTakes).fill(undefined);
          const imgs: any[] = (dbJob as any).generated_images || [];
          imgs.forEach((image: any, _i: number) => {
            const derivedIndex = ((): number => {
              const m = (image.web_path || '').match(/IMG-(\d+)/i) || (image.original_path || '').match(/IMG-(\d+)/i);
              if (m) { const n = parseInt(m[1], 10); if (!isNaN(n)) return Math.max(0, n - 1); }
              return _i;
            })();
            if (derivedIndex < 0 || derivedIndex >= nbTakes) return;
            thumbnailsTemp[derivedIndex] = {
              id: uuidv4(),
              jobId: dbJob.id,
              status: 'completed',
              index: derivedIndex,
              progress: 100,
              imageUrl: getInferenceImageUrl(image.original_path),
              webImageUrl: getInferenceImageUrl(image.web_path),
              imageId: image.id,
            } as InferenceThumbnail;
          });
          for (let i = 0; i < nbTakes; i++) {
            if (!thumbnailsTemp[i]) {
              thumbnailsTemp[i] = {
                id: uuidv4(),
                jobId: dbJob.id,
                status: 'failed',
                index: i,
                progress: 0,
                errorMessage: (dbJob as any).error_message || 'Generation failed'
              } as InferenceThumbnail;
            }
          }
          const thumbnails = thumbnailsTemp as InferenceThumbnail[];

          allJobs.push({
            id: dbJob.id,
            status: 'failed',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            message: (dbJob as any).error_message || 'Generation failed',
            styleId: (dbJob as any).style_id,
            sceneId: (dbJob as any).scene_id,
            wardrobeId: (dbJob as any).wardrobe_id,
            colorId: (dbJob as any).color_id,
            quality: (dbJob as any).quality || undefined,
            aspectRatio: (dbJob as any).aspect_ratio || undefined,
            characterId: (dbJob as any).character_id || undefined,
            characterName: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.name : undefined,
            characterThumbnailUrl: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.thumbnail_url as any : undefined,
          });
        } else {
          // Completed job - create thumbnails with images
          const nbTakes = dbJob.nb_takes || (dbJob.generated_images?.length ?? 0) || 1;
          const thumbnailsTemp: (InferenceThumbnail | undefined)[] = new Array(nbTakes).fill(undefined);
          dbJob.generated_images.forEach((image: any, _i: number) => {
            const derivedIndex = parseIndexFromPath(image.web_path) ?? parseIndexFromPath(image.original_path) ?? _i;
            if (derivedIndex < 0 || derivedIndex >= nbTakes) return; // guard
            thumbnailsTemp[derivedIndex] = {
              id: uuidv4(),
              jobId: dbJob.id,
              status: 'completed',
              index: derivedIndex,
              progress: 100,
              imageUrl: getInferenceImageUrl(image.original_path),
              webImageUrl: getInferenceImageUrl(image.web_path),
              imageId: image.id,
              favourite: (image as any).favourite === true
            } as InferenceThumbnail;
          });

          // Fill any empty slots deterministically (0..nbTakes-1)
          for (let i = 0; i < nbTakes; i++) {
            if (!thumbnailsTemp[i]) {
              thumbnailsTemp[i] = {
                id: uuidv4(),
                jobId: dbJob.id,
                status: 'completed',
                index: i,
                progress: 100
              } as InferenceThumbnail;
            }
          }
          const thumbnails = thumbnailsTemp as InferenceThumbnail[];

          allJobs.push({
            id: dbJob.id,
            status: 'completed',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            styleId: (dbJob as any).style_id,
            sceneId: (dbJob as any).scene_id,
            wardrobeId: (dbJob as any).wardrobe_id,
            colorId: (dbJob as any).color_id,
            quality: (dbJob as any).quality || undefined,
            aspectRatio: (dbJob as any).aspect_ratio || undefined,
            characterId: (dbJob as any).character_id || undefined,
            characterName: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.name : undefined,
            characterThumbnailUrl: (dbJob as any).character_id ? initialCharMap[(dbJob as any).character_id]?.thumbnail_url as any : undefined,
          });
        }
      });

      // Sort by creation date (newest first)
      allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setJobs(allJobs);
      // Offset should be the total number of jobs we've loaded from the paginated API
      // Since fetchInferenceJobsPaginated gets ALL jobs, we need to account for both active and completed
      setOffset(allJobs.length);
      // hasMore should be true if there are more jobs in the database than we've loaded
      const hasMoreJobs = allJobs.length < totalCountResult;
      setHasMore(hasMoreJobs);
      
      // Hydrate any already-generated images for ACTIVE jobs on initial load
      // This fixes the refresh case where some images are done but WS hasn't replayed yet
      try {
        const { fetchInferenceJob, getInferenceImageUrl: giu } = await import('@/lib/api/inference-job-management');
        const activeDbJobs = initialJobs.filter((j: any) => ['queued', 'pending', 'running'].includes(j.status));
        await Promise.all(activeDbJobs.map(async (j: any) => {
          try {
            const full = await fetchInferenceJob(j.id);
            const images = full?.generated_images || [];
            if (!images || images.length === 0) return;
            setJobs(prev => prev.map(job => {
              if (job.id !== j.id) return job;
              const updated = [...job.thumbnails];
              images.forEach((img: any, _i: number) => {
                const derivedIndex = ((): number => {
                  const m = (img.web_path || '').match(/IMG-(\d+)/i) || (img.original_path || '').match(/IMG-(\d+)/i);
                  if (m) {
                    const n = parseInt(m[1], 10);
                    if (!isNaN(n)) return Math.max(0, n - 1);
                  }
                  return _i;
                })();
                if (derivedIndex < 0 || derivedIndex >= updated.length) return;
                updated[derivedIndex] = {
                  ...updated[derivedIndex],
                  status: 'completed',
                  progress: 100,
                  webImageUrl: giu(img.web_path),
                  imageUrl: giu(img.original_path),
                  imageId: img.id,
                  favourite: (img as any).favourite === true
                } as any;
              });
              return { ...job, thumbnails: updated };
            }));
          } catch (e) {
            console.warn('Initial hydration failed for job', j.id, e);
          }
        }));
      } catch (e) {
        console.warn('Initial hydration step failed:', e);
      }


    } catch (err) {
      console.error('❌ Failed to load initial inference jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load more jobs for infinite scrolling
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);

      const { fetchInferenceJobsPaginated, getInferenceImageUrl } = await import('@/lib/api/inference-job-management');
      const { charactersApi } = await import('@/lib/api/characters');
      
      const moreJobs = await fetchInferenceJobsPaginated(user.id, JOBS_PER_PAGE, offset);
      
      if (moreJobs.length === 0) {
        setHasMore(false);
        return;
      }

      const newJobs: InferenceJob[] = [];

      // Build character map for this page
      const pageCharacterIds = Array.from(new Set(moreJobs.map((j: any) => j.character_id).filter(Boolean)));
      let pageCharMap: Record<string, { name?: string; thumbnail_url?: string }> = {};
      try {
        const chars = await charactersApi.getCharactersByIds(pageCharacterIds);
        pageCharMap = (chars || []).reduce((acc: any, c: any) => {
          acc[c.id] = { name: c.name, thumbnail_url: c.thumbnail_url };
          return acc;
        }, {} as Record<string, { name?: string; thumbnail_url?: string }>);
      } catch {}

      moreJobs.forEach(dbJob => {
        // Skip if already exists (shouldn't happen but safety check)
        if (jobs.some(j => j.id === dbJob.id)) return;

        if (dbJob.status === 'failed') {
          const nbTakes = dbJob.nb_takes || 1;
          const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
            id: uuidv4(),
            jobId: dbJob.id,
            status: 'failed',
            index,
            progress: 0,
            errorMessage: (dbJob as any).error_message || 'Generation failed'
          }));
          newJobs.push({
            id: dbJob.id,
            status: 'failed',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            message: (dbJob as any).error_message || 'Generation failed',
            quality: (dbJob as any).quality || undefined,
            aspectRatio: (dbJob as any).aspect_ratio || undefined,
            characterId: (dbJob as any).character_id || undefined,
            characterName: (dbJob as any).character_id ? pageCharMap[(dbJob as any).character_id]?.name : undefined,
            characterThumbnailUrl: (dbJob as any).character_id ? pageCharMap[(dbJob as any).character_id]?.thumbnail_url as any : undefined,
          });
        } else {
          const nbTakes = dbJob.nb_takes || (dbJob.generated_images?.length ?? 0) || 1;
          const thumbnailsTemp: (InferenceThumbnail | undefined)[] = new Array(nbTakes).fill(undefined);
          dbJob.generated_images.forEach((image: any, _i: number) => {
            const derivedIndex = ((): number => {
              const m = (image.web_path || '').match(/IMG-(\d+)/i) || (image.original_path || '').match(/IMG-(\d+)/i);
              if (m) {
                const n = parseInt(m[1], 10);
                if (!isNaN(n)) return Math.max(0, n - 1);
              }
              return _i;
            })();
            if (derivedIndex < 0 || derivedIndex >= nbTakes) return; // guard
            thumbnailsTemp[derivedIndex] = {
              id: uuidv4(),
              jobId: dbJob.id,
              status: 'completed',
              index: derivedIndex,
              progress: 100,
              imageUrl: getInferenceImageUrl(image.original_path),
              webImageUrl: getInferenceImageUrl(image.web_path)
            } as InferenceThumbnail;
          });
          for (let i = 0; i < nbTakes; i++) {
            if (!thumbnailsTemp[i]) {
              thumbnailsTemp[i] = {
                id: uuidv4(),
                jobId: dbJob.id,
                status: 'completed',
                index: i,
                progress: 100
              } as InferenceThumbnail;
            }
          }
          const thumbnails = thumbnailsTemp as InferenceThumbnail[];

          newJobs.push({
            id: dbJob.id,
            status: 'completed',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            quality: (dbJob as any).quality || undefined,
            aspectRatio: (dbJob as any).aspect_ratio || undefined,
            characterId: (dbJob as any).character_id || undefined,
            characterName: (dbJob as any).character_id ? pageCharMap[(dbJob as any).character_id]?.name : undefined,
            characterThumbnailUrl: (dbJob as any).character_id ? pageCharMap[(dbJob as any).character_id]?.thumbnail_url as any : undefined,
          });
        }
      });

      setJobs(prev => [...prev, ...newJobs]);
      setOffset(prev => prev + moreJobs.length);
      setHasMore(moreJobs.length === JOBS_PER_PAGE);

    } catch (err) {
      console.error('❌ Failed to load more inference jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more jobs');
    } finally {
      setIsLoadingMore(false);
    }
  }, [user?.id, isLoadingMore, hasMore, offset, jobs, totalCount]);

  // Refresh all jobs
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    setJobs([]);
    activeJobIds.current.clear();
    await loadInitialJobs();
  }, [loadInitialJobs]);

  // Add new job (for real-time updates)
  const addJob = useCallback((jobId: string, nbTakes: number, meta?: { styleId?: string; sceneId?: string; wardrobeId?: string; colorId?: string; aspectRatio?: string; quality?: string }) => {
    const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
      id: uuidv4(),
      jobId,
      status: 'queued' as const,
      index,
    }));

    const newJob: InferenceJob = {
      id: jobId,
      status: 'initializing',
      thumbnails,
      createdAt: new Date(),
      nbTakes,
      message: 'Initializing',
      styleId: meta?.styleId,
      sceneId: meta?.sceneId,
      wardrobeId: meta?.wardrobeId,
      colorId: meta?.colorId,
      // carry UI settings for sidebar immediately on active jobs
      aspectRatio: meta?.aspectRatio,
      quality: meta?.quality,
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
  const updateJobStatus = useCallback((jobId: string, status: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));

    if (status === 'completed' || status === 'failed') {
      activeJobIds.current.delete(jobId);
    }
  }, []);

  // Update job message (e.g., "Starting up")
  const updateJobMessage = useCallback((jobId: string, message?: string) => {
    if (message == null) return;
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, message } : job
    ));
  }, []);

  // Update job-level progress (used for global/initializing phase)
  const updateJobProgress = useCallback((jobId: string, progress: number) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, progress: Math.round(Math.min(100, Math.max(0, progress))) } : job
    ));
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

  // Remove job locally (after soft delete)
  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setTotalCount(prev => Math.max(0, prev - 1));
    activeJobIds.current.delete(jobId);
  }, []);

  // Load initial jobs on mount and when user changes
  useEffect(() => {
    loadInitialJobs();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    updateJobProgress,
    updateJobMessage,
    updateThumbnail,
    removeJob,
  };
}
