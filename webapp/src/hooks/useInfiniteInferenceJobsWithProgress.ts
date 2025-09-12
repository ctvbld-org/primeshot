'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useInfiniteInferenceJobs } from './useInfiniteInferenceJobs';
import { useAuth } from '@/contexts/auth-context';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { webSocketManager } from '@/lib/websocket/connection-manager';
import { getInferenceImage } from '@/lib/utils/get-inference-image';
import { getInferenceImageUrl } from '@/lib/utils/get-inference-image';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Enhanced infinite inference jobs hook with WebSocket progress tracking
 * Combines infinite scrolling with real-time progress updates
 */
export function useInfiniteInferenceJobsWithProgress() {
  const infiniteJobs = useInfiniteInferenceJobs();
  const { user } = useAuth();
  const activeConnections = useRef<Map<string, string>>(new Map()); // jobId -> subscriptionId
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map()); // jobId -> interval
  // Note: Preview tracking is no longer needed since we use image_index from sequential generation

  // ===== Pending->Running DB watch with 30s hold =====
  type DbWatcher = {
    channel: any;
    timerId: ReturnType<typeof setTimeout>;
    holdUntil: number;
    sawRunning: boolean;
  };
  const dbWatchers = useRef<Map<string, DbWatcher>>(new Map());
  const messageHold = useRef<Set<string>>(new Set()); // while held, keep message as "Initializing…"

  const holdKey = (jobId: string) => `inf_hold_until_${jobId}`;
  const holdDoneKey = (jobId: string) => `inf_hold_done_${jobId}`;

  const setHoldDone = (jobId: string) => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(holdDoneKey(jobId), '1'); } catch {}
  };
  const clearHoldDone = (jobId: string) => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(holdDoneKey(jobId)); } catch {}
  };
  const hasHoldDone = (jobId: string) => {
    if (typeof window === 'undefined') return false;
    try { return !!window.localStorage.getItem(holdDoneKey(jobId)); } catch { return false; }
  };

  const cleanupHold = useCallback((jobId: string) => {
    const existing = dbWatchers.current.get(jobId);
    if (existing) {
      try { clearTimeout(existing.timerId); } catch {}
      try { existing.channel?.unsubscribe?.(); } catch {}
      dbWatchers.current.delete(jobId);
    }
    messageHold.current.delete(jobId);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(holdKey(jobId)); } catch {}
    }
  }, []);

  const startHoldAndWatchDb = useCallback(async (jobId: string, holdMs: number = 30000) => {
    if (dbWatchers.current.has(jobId)) return; // already watching
    // Do not start another hold after it has completed once for this job
    if (hasHoldDone(jobId)) return;

    // Initialize message hold and UI
    messageHold.current.add(jobId);
    infiniteJobs.updateJobMessage(jobId, 'Initializing');
    infiniteJobs.updateJobStatus(jobId, 'initializing');

    const holdUntil = Date.now() + Math.max(0, holdMs);
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(holdKey(jobId), String(holdUntil)); } catch {}
    }

    const supabase = createSupabaseBrowserClient();

    // Immediate status check to avoid missing a fast flip to 'running'
    try {
      const { data: immediate, error: immediateErr } = await supabase
        .from('inference_jobs')
        .select('status, error_message')
        .eq('id', jobId)
        .single();
      if (!immediateErr && immediate?.status) {
        if (immediate.status === 'running') {
          // Release hold immediately
          messageHold.current.delete(jobId);
          infiniteJobs.updateJobStatus(jobId, 'generating');
          infiniteJobs.updateJobMessage(jobId, 'Generating');
          if (typeof window !== 'undefined') {
            try { window.localStorage.removeItem(holdKey(jobId)); } catch {}
          }
          clearHoldDone(jobId);
          return; // No watcher needed
        }
        if (immediate.status === 'completed' || immediate.status === 'failed') {
          // Update UI immediately for terminal states
          const uiStatus = immediate.status === 'completed' ? 'completed' : 'failed';
          infiniteJobs.updateJobStatus(jobId, uiStatus as any);
          if (uiStatus === 'failed') {
            const msg = (immediate as any)?.error_message || 'Generation failed';
            infiniteJobs.updateJobMessage(jobId, msg);
            const job = infiniteJobs.jobs.find(j => j.id === jobId);
            if (job) {
              job.thumbnails.forEach((_, index) => {
                infiniteJobs.updateThumbnail(jobId, index, {
                  status: 'failed',
                  errorMessage: msg
                });
              });
            }
          }
          cleanupHold(jobId);
          clearHoldDone(jobId);
          return;
        }
      }
    } catch {}

    const channel = supabase
      .channel(`inference_job_${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'inference_jobs',
        filter: `id=eq.${jobId}`,
      }, (payload: any) => {
        const newRow = payload?.new as any;
        const newStatus = newRow?.status as string | undefined;
        if (!newStatus) return;

        if (newStatus === 'running') {
          const watcher = dbWatchers.current.get(jobId);
          if (watcher) watcher.sawRunning = true;
          // Map DB running -> UI generating and end hold immediately
          infiniteJobs.updateJobStatus(jobId, 'generating');
          infiniteJobs.updateJobMessage(jobId, 'Generating');
          // End hold now so messages are no longer pinned
          messageHold.current.delete(jobId);
          try { if (watcher) clearTimeout(watcher.timerId); } catch {}
          if (typeof window !== 'undefined') {
            try { window.localStorage.removeItem(holdKey(jobId)); } catch {}
          }
          try { channel?.unsubscribe?.(); } catch {}
          dbWatchers.current.delete(jobId);
          clearHoldDone(jobId);
        }
        if (newStatus === 'completed' || newStatus === 'failed') {
          // Terminal: update UI and stop hold immediately
          const uiStatus = newStatus === 'completed' ? 'completed' : 'failed';
          infiniteJobs.updateJobStatus(jobId, uiStatus as any);
          if (uiStatus === 'failed') {
            const msg = (newRow as any)?.error_message || 'Generation failed';
            infiniteJobs.updateJobMessage(jobId, msg);
            const job = infiniteJobs.jobs.find(j => j.id === jobId);
            if (job) {
              job.thumbnails.forEach((_, index) => {
                infiniteJobs.updateThumbnail(jobId, index, {
                  status: 'failed',
                  errorMessage: msg
                });
              });
            }
          }
          cleanupHold(jobId);
          clearHoldDone(jobId);
        }
      })
      .subscribe();

    const timerId = setTimeout(() => {
      const watcher = dbWatchers.current.get(jobId);
      const sawRunning = watcher?.sawRunning === true;
      // End message hold
      messageHold.current.delete(jobId);
      if (!sawRunning) {
        // If never saw running -> fall back to pending
        infiniteJobs.updateJobStatus(jobId, 'pending');
      }
      // Clear persistence and unsubscribe
      cleanupHold(jobId);
      // Mark that we finished the one-time hold for this job
      setHoldDone(jobId);
    }, Math.max(0, holdMs));

    dbWatchers.current.set(jobId, { channel, timerId, holdUntil, sawRunning: false });
  }, [cleanupHold, infiniteJobs]);

  const resumeHoldIfAny = useCallback((jobId: string) => {
    if (dbWatchers.current.has(jobId)) return;
    if (typeof window === 'undefined') return;
    // If we've already completed an earlier hold for this job, do not resume
    if (hasHoldDone(jobId)) return;
    let stored: number | null = null;
    try {
      const raw = window.localStorage.getItem(holdKey(jobId));
      if (raw) stored = parseInt(raw, 10);
    } catch {}
    if (!stored || Number.isNaN(stored)) return;
    const remaining = stored - Date.now();
    if (remaining > 50) {
      startHoldAndWatchDb(jobId, remaining);
    } else {
      try { window.localStorage.removeItem(holdKey(jobId)); } catch {}
    }
  }, [startHoldAndWatchDb]);

  // ===== Helper utilities (DRY) =====

  const clampProgress = (p?: number) => p === undefined ? undefined : Math.round(Math.min(100, Math.max(0, p)));

  const updateGlobalProgressIfNeeded = (jobId: string, data: any) => {
    if ((data.status === 'initializing' || data.image_index === undefined) && typeof data.progress === 'number') {
      infiniteJobs.updateJobProgress(jobId, data.progress);
    }
  };

  const applyPreviewIfAny = (jobId: string, data: any, uiStatus: 'queued' | 'running' | 'completed' | 'failed') => {

    if (!(data.preview_images && Array.isArray(data.preview_images) && data.preview_images.length > 0)) return;
    if (typeof data.image_index !== 'number') return; // never map preview without a target index

    const previewPath = data.preview_images[0];
    const previewIndex = data.image_index;
    if (!previewPath || previewIndex < 0) return;

    const job = infiniteJobs.jobs.find(j => j.id === jobId);
    const existing = job?.thumbnails[previewIndex];
    if (existing?.status === 'completed') return; // never override completed

    const previewUrl = getInferenceImage(previewPath);
    const isBase64 = previewPath.startsWith('data:image/');
    if (isBase64) {
      try {
        const [header, dataStr] = previewPath.split(',');
        if (!header.includes('data:image/') || !dataStr || dataStr.length < 100) return;
      } catch {
        return;
      }
    }
    infiniteJobs.updateThumbnail(jobId, previewIndex, {
      status: uiStatus,
      progress: clampProgress(data.progress),
      webImageUrl: previewUrl,
      imageUrl: previewUrl,
    });
  };

  const applyTargetedProgress = (jobId: string, data: any, uiStatus: 'queued' | 'running' | 'completed' | 'failed') => {
    const job = infiniteJobs.jobs.find(j => j.id === jobId);
    if (!job) return;

    if (typeof data.image_index === 'number') {
      const index = data.image_index;
      const target = job.thumbnails[index];
      if (target && target.status !== 'completed') {
        const updates: Partial<InferenceThumbnail> = { status: uiStatus };
        const p = clampProgress(data.progress);
        if (typeof p === 'number') updates.progress = p;
        if (uiStatus === 'completed') updates.progress = 100;
        if (uiStatus === 'failed') updates.errorMessage = data.error_message || 'Generation failed';
        infiniteJobs.updateThumbnail(jobId, index, updates);
      }
    }
  };

  const applyCompletedImages = (jobId: string, data: any) => {
    if (!(data.completed_images && Array.isArray(data.completed_images))) return;
    data.completed_images.forEach((img: any) => {
      if (!img || typeof img.index !== 'number') return;
      const webUrl = img.web_path ? getInferenceImageUrl(img.web_path, true) : (img.base64 || img.web_base64);
      const originalUrl = img.original_path ? getInferenceImageUrl(img.original_path, false) : (img.base64 || img.original_base64 || webUrl);
      infiniteJobs.updateThumbnail(jobId, img.index, {
        status: 'completed',
        progress: 100,
        webImageUrl: webUrl,
        imageUrl: originalUrl
      });
    });
  };

  // Apply a single completed image using provided web/original paths from WS
  const applyFinalImageUrl = (jobId: string, index: number, webPath: string, originalPath?: string) => {
    if (!webPath || typeof index !== 'number' || index < 0) return;
    const origPath = originalPath || webPath.replace('/web/', '/orig/').replace(/\.webp$/i, '.png');
    const webUrl = getInferenceImageUrl(webPath, true);
    const originalUrl = getInferenceImageUrl(origPath, false);
    infiniteJobs.updateThumbnail(jobId, index, {
      status: 'completed',
      progress: 100,
      webImageUrl: webUrl,
      imageUrl: originalUrl
    });
  };

  const fetchAndApplyResults = async (jobId: string, logPrefix: string, expectedCount?: number) => {
    try {
      const { fetchInferenceJobResult, getInferenceImageUrl } = await import('@/lib/api/inference-results');
      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await fetchInferenceJobResult(jobId);
        const images = result?.generated_images ?? [];
        if (images.length > 0) {
          images.forEach((image, _i) => {
            // Derive 0-based index from IMG-XX in path to avoid DB order issues
            let derivedIndex: number | null = null;
            const src = image.web_path || image.original_path || '';
            const m = src.match(/IMG-(\d+)/i);
            if (m) {
              const n = parseInt(m[1], 10);
              if (!isNaN(n)) derivedIndex = Math.max(0, n - 1);
            }
            const targetIndex = derivedIndex ?? _i;
            const webImageUrl = getInferenceImageUrl(image.web_path, true);
            const originalImageUrl = getInferenceImageUrl(image.original_path, false);
            infiniteJobs.updateThumbnail(jobId, targetIndex, {
              status: 'completed',
              imageUrl: originalImageUrl,
              webImageUrl: webImageUrl,
              progress: 100
            });
          });
        }
        if (!expectedCount || images.length >= expectedCount) {
          if (images.length === 0) {
            console.warn(`${logPrefix} No generated images found for completed job ${jobId}`);
          }
          break;
        }
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.error(`${logPrefix} Failed to fetch images for completed job ${jobId}:`, e);
    }
  };

  const handleProgress = (jobId: string, data: any) => {
    // Strong guard: ignore packets that declare a different job_id
    if (data && typeof data.job_id === 'string' && data.job_id !== jobId) {
      console.warn(`🔒 Ignoring progress for mismatched job_id ${data.job_id} (expected ${jobId})`);
      return;
    }
    
    console.log(`📊 Progress update for job ${jobId}: ${data.status} - ${data.message || 'No message'}`);
    
    // Normalize status: treat 'running' and 'image_completed' as 'generating' for UI
    const jobStatus = (data.status === 'running' || data.status === 'image_completed') ? 'generating' : data.status;
    // While on hold, keep message pinned to Initializing…
    const message = messageHold.current.has(jobId) ? 'Initializing' : data.message;
    
    // Update job status and message directly from Modal
    infiniteJobs.updateJobStatus(jobId, jobStatus);
    if (message) {
      infiniteJobs.updateJobMessage(jobId, message);
    }
    
    // Update global progress if provided
    if (typeof data.progress === 'number') {
      updateGlobalProgressIfNeeded(jobId, data);
    }
    
    // Handle per-image updates
    const generationPhase = typeof data.image_index === 'number' || data.status === 'image_completed';
    
    // Determine UI status for thumbnails (simplified)
    let uiStatus: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
    if (data.status === 'completed') uiStatus = 'completed';
    else if (data.status === 'failed') uiStatus = 'failed';
    else if (generationPhase || data.status === 'running' || data.status === 'generating' || data.status === 'image_completed') {
      uiStatus = 'running';
      // WS indicates generation started: release any hold immediately
      if (messageHold.current.has(jobId)) {
        messageHold.current.delete(jobId);
        try {
          const watcher = dbWatchers.current.get(jobId);
          if (watcher) clearTimeout(watcher.timerId);
        } catch {}
        if (typeof window !== 'undefined') {
          try { window.localStorage.removeItem(holdKey(jobId)); } catch {}
        }
        const existing = dbWatchers.current.get(jobId);
        try { existing?.channel?.unsubscribe?.(); } catch {}
        dbWatchers.current.delete(jobId);
      }
    }
    
    // live preview (only when image_index is provided and not completed)
    applyPreviewIfAny(jobId, data, uiStatus);

    // targeted progress for a specific thumbnail (never override completed)
    applyTargetedProgress(jobId, data, uiStatus);

    // mark individual images as completed when provided
    applyCompletedImages(jobId, data);

    // Handle per-image completion packets (from Modal)
    if (data.status === 'image_completed') {
      const idx = typeof data.image_index === 'number' ? data.image_index : undefined;
      const web = data.final_image_url || data.webImageUrl;
      const orig = data.imageUrl as string | undefined;
      if (idx !== undefined && (typeof web === 'string' && web.length > 0)) {
        applyFinalImageUrl(jobId, idx, web, orig);
        return;
      }
    }
  };

  // Connect to WebSocket for a specific job
  const connectToJob = useCallback((jobId: string) => {
    // Don't create duplicate connections
    if (activeConnections.current.has(jobId)) {
      console.log(`🔌 WebSocket already connected for job: ${jobId}`);
      return;
    }

    console.log(`🔌 Connecting to WebSocket progress for job: ${jobId}`);
    
    // Check if WebSocket URL is configured
    const wsUrl = process.env.NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL;
    if (!wsUrl) {
      console.warn(`⚠️ NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL not configured, falling back to polling for job ${jobId}`);
      
      // Start polling as fallback
      const interval = startPollingForJob(jobId);
      pollingIntervals.current.set(jobId, interval);
      return;
    }
    
    console.log(`🔗 Using WebSocket URL: ${wsUrl}`);
    
    // Do not force 'running' status; show a temporary connecting message instead
    if (!messageHold.current.has(jobId)) {
      infiniteJobs.updateJobMessage(jobId, 'Connecting');
      infiniteJobs.updateJobStatus(jobId, 'starting');
    }
    
    // Use the centralized WebSocket manager
    import('@/lib/websocket/connection-manager').then(({ webSocketManager }) => {
      try {
        console.log(`🔌 Setting up WebSocket subscription for inference job ${jobId}`);
        const subscriptionId = webSocketManager.subscribe(jobId, 'inference', {
          onProgress: (data) => handleProgress(jobId, data),
          onComplete: async (success, error) => {
            console.log(`✅ Job ${jobId} completed. Success: ${success}`, error ? `Error: ${error}` : '');
            
            if (success) {
              infiniteJobs.updateJobStatus(jobId, 'completed');
              await fetchAndApplyResults(jobId, '🔍');
            } else {
              infiniteJobs.updateJobStatus(jobId, 'failed');
              // Mark all thumbnails as failed
              const job = infiniteJobs.jobs.find(j => j.id === jobId);
              if (job) {
                job.thumbnails.forEach((_, index) => {
                  infiniteJobs.updateThumbnail(jobId, index, { 
                    status: 'failed',
                    errorMessage: error || 'Generation failed'
                  });
                });
              }
            }
            
            // Clean up connection
            activeConnections.current.delete(jobId);
          },
          onError: (error) => {
            console.error(`❌ WebSocket error for job ${jobId}:`, error);
            infiniteJobs.updateJobStatus(jobId, 'failed');
            
            // Mark all thumbnails as failed
            const job = infiniteJobs.jobs.find(j => j.id === jobId);
            if (job) {
              job.thumbnails.forEach((_, index) => {
                infiniteJobs.updateThumbnail(jobId, index, { 
                  status: 'failed',
                  errorMessage: error || 'Connection error'
                });
              });
            }
            
            // Clean up connection
            activeConnections.current.delete(jobId);
          }
        });
        
        activeConnections.current.set(jobId, subscriptionId);
        console.log(`🔌 WebSocket connected for job ${jobId}, subscription: ${subscriptionId}`);
        
      } catch (error) {
        console.error(`❌ Failed to connect WebSocket for job ${jobId}:`, error);
        infiniteJobs.updateJobStatus(jobId, 'failed');
      }
    }).catch(error => {
      console.error(`❌ Failed to import WebSocket manager:`, error);
      infiniteJobs.updateJobStatus(jobId, 'failed');
    });
  }, [infiniteJobs]);

  // Polling fallback when WebSocket is not available
  const startPollingForJob = useCallback((jobId: string) => {
    console.log(`🔄 Starting polling for job: ${jobId}`);
    
    const pollInterval = setInterval(async () => {
      try {
        const { fetchInferenceJob, getInferenceImageUrl } = await import('@/lib/api/inference-job-management');
        const job = await fetchInferenceJob(jobId);
        
        if (!job) {
          console.warn(`⚠️ Job ${jobId} not found, stopping polling`);
          clearInterval(pollInterval);
          return;
        }
        
        console.log(`📊 Polling update for job ${jobId}: status=${job.status}`);
        
        // Update job status
        if (job.status === 'completed') {
          infiniteJobs.updateJobStatus(jobId, 'completed');
          
          // Update thumbnails with images
          job.generated_images.forEach((image, index) => {
            infiniteJobs.updateThumbnail(jobId, index, {
              status: 'completed',
              progress: 100,
              imageUrl: getInferenceImageUrl(image.original_path),
              webImageUrl: getInferenceImageUrl(image.web_path)
            });
          });
          
          clearInterval(pollInterval);
          console.log(`✅ Job ${jobId} completed via polling`);
        } else if (job.status === 'failed') {
          infiniteJobs.updateJobStatus(jobId, 'failed');
          
          // Update all thumbnails to failed state
          const queueJob = infiniteJobs.jobs.find(j => j.id === jobId);
          if (queueJob) {
            queueJob.thumbnails.forEach((_, index) => {
              infiniteJobs.updateThumbnail(jobId, index, {
                status: 'failed',
                errorMessage: 'Generation failed'
              });
            });
          }
          
          clearInterval(pollInterval);
          console.log(`❌ Job ${jobId} failed via polling`);
        } else if (job.status === 'running' || job.status === 'pending') {
          // Avoid forcing 'running' label; keep current status, only log
          console.log(`🔄 Job ${jobId} is active (via polling): ${job.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Polling error for job ${jobId}:`, error);
      }
    }, 2000); // Poll every 2 seconds for faster updates
    
    return pollInterval;
  }, [infiniteJobs]);

  // Connect job after creation (replace placeholder with real ID)
  const connectJobAfterCreation = useCallback((placeholderId: string, realJobId: string) => {
    console.log(`🔄 Connecting job after creation: ${placeholderId} -> ${realJobId}`);
    
    // Update the job with the real ID (no WebSocket transfer needed since placeholder had no connection)
    infiniteJobs.updateJobWithRealId(placeholderId, realJobId);
    
    // DISABLED: WebSocket connection now handled by useInferenceProgress hook
    // connectToJob(realJobId);
    
  }, [infiniteJobs, connectToJob]);

  // Auto-connect to active jobs and update their thumbnail states
  useEffect(() => {
    const activeJobs = infiniteJobs.jobs.filter(job => 
      (job.status === 'queued' || job.status === 'generating' || job.status === 'initializing' || job.status === 'pending' || job.status === 'running' || (job as any).status === 'starting') &&
      !job.id.startsWith('placeholder_') // Don't connect to placeholder jobs
    );

    // Resume any pending holds for jobs currently pending
    activeJobs.forEach(job => {
      if (job.status === 'pending') {
        // Resume persisted hold if any
        resumeHoldIfAny(job.id);
        // If no watcher and no persisted hold, start a new hold now
        if (!dbWatchers.current.has(job.id)) {
          let hasStored = false;
          let hasDone = false;
          if (typeof window !== 'undefined') {
            try { hasStored = !!window.localStorage.getItem(holdKey(job.id)); } catch {}
            try { hasDone = !!window.localStorage.getItem(holdDoneKey(job.id)); } catch {}
          }
          if (!hasStored && !hasDone) {
            startHoldAndWatchDb(job.id);
          }
        }
      }
      if (job.status === 'completed' || job.status === 'failed') {
        cleanupHold(job.id);
        clearHoldDone(job.id);
      }
    });

    activeJobs.forEach(job => {
      // Check if we already have a connection for this job
      if (activeConnections.current.has(job.id)) {
        return;
      }

      console.log(`🔌 Auto-connecting to job ${job.id} for thumbnail updates`);
      // Normalize any preloaded DB status 'running' -> UI 'generating' before WS messages arrive
      if (job.status === 'running') {
        infiniteJobs.updateJobStatus(job.id, 'generating');
        // Keep any existing message; do not pin
      }
      
      // Subscribe to progress updates using the centralized WebSocket manager
      const subscriptionId = webSocketManager.subscribe(job.id, 'inference', {
        onProgress: (data) => {
          if (data && typeof data.job_id === 'string' && data.job_id !== job.id) {
            console.warn(`🔒 Auto-conn: ignoring packet for ${data.job_id} on connection for ${job.id}`);
            return;
          }
          const status = data.status;
          const progress = data.progress || 0;
          
          console.log(`📊 Auto-connection progress update for job ${job.id}: ${status} - ${progress}%`);
          
          // Debug: Check if preview_images exists in the auto-connection data
          if (data.preview_images) {
            console.log(`🎨 Auto-connection received preview_images for job ${job.id}:`, {
              preview_images_type: typeof data.preview_images,
              preview_images_length: data.preview_images?.length,
              image_index: data.image_index,
              first_preview_sample: data.preview_images[0]?.substring(0, 50) + '...'
            });
          }
          
          // Global progress and previews with guards
          updateGlobalProgressIfNeeded(job.id, data);
          
          // Determine UI status for thumbnails (simplified)
          let uiStatus: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
          const statusStr = String(status);
          if (statusStr === 'completed') uiStatus = 'completed';
          else if (statusStr === 'failed') uiStatus = 'failed';
          else if (typeof data.image_index === 'number' || statusStr === 'running' || statusStr === 'generating') {
            uiStatus = 'running';
            // WS indicates generation started: release any hold immediately
            if (messageHold.current.has(job.id)) {
              messageHold.current.delete(job.id);
              try {
                const watcher = dbWatchers.current.get(job.id);
                if (watcher) clearTimeout(watcher.timerId);
              } catch {}
              if (typeof window !== 'undefined') {
                try { window.localStorage.removeItem(holdKey(job.id)); } catch {}
              }
              const existing = dbWatchers.current.get(job.id);
              try { existing?.channel?.unsubscribe?.(); } catch {}
              dbWatchers.current.delete(job.id);
              clearHoldDone(job.id);
            }
          }
          
          applyPreviewIfAny(job.id, data, uiStatus);

          // Use Modal's status directly
          const generationPhase = typeof data.image_index === 'number' || statusStr === 'image_completed';
          
          // Update job status and message directly from Modal (normalize running->generating)
          // Normalize job-level status: keep UI at 'generating' during per-image completions
          const normStatus = (statusStr === 'running' || statusStr === 'image_completed') ? 'generating' : statusStr;
          infiniteJobs.updateJobStatus(job.id, normStatus);
          const msg = messageHold.current.has(job.id) ? 'Initializing' : data.message;
          if (msg) {
            infiniteJobs.updateJobMessage(job.id, msg);
          }

          applyTargetedProgress(job.id, data, uiStatus);

          // Per-image completion: accept final_image_url or webImageUrl/imageUrl
          if (statusStr === 'image_completed') {
            const idx = typeof data.image_index === 'number' ? data.image_index : undefined;
            const web = data.final_image_url || data.webImageUrl;
            const orig = data.imageUrl as string | undefined;
            if (idx !== undefined && (typeof web === 'string' && web.length > 0)) {
              applyFinalImageUrl(job.id, idx, web, orig);
              return;
            }
          }
        },
        onComplete: async (success: boolean) => {
          console.log(`✅ Auto-connection job ${job.id} completed: ${success}`);
          
          if (success) {
            infiniteJobs.updateJobStatus(job.id, 'completed');
            // Retry until we see all expected images (handles eventual DB consistency)
            await fetchAndApplyResults(job.id, '🔍 Auto-connection', job.thumbnails.length);
          } else {
            infiniteJobs.updateJobStatus(job.id, 'failed');
            // Mark all thumbnails as failed
            job.thumbnails.forEach((_, index) => {
              infiniteJobs.updateThumbnail(job.id, index, { 
                status: 'failed',
                errorMessage: 'Generation failed'
              });
            });
          }
        },
        onError: (error: string) => {
          console.error(`❌ WebSocket error for job ${job.id}:`, error);
          infiniteJobs.updateJobStatus(job.id, 'failed');
        }
      });
      
      // Store subscription for cleanup
      activeConnections.current.set(job.id, subscriptionId);
    });

    // Cleanup subscriptions for jobs that are no longer active
    for (const [jobId, subscriptionId] of activeConnections.current.entries()) {
      const job = infiniteJobs.jobs.find(j => j.id === jobId);
      const isTerminal = job && (job.status === 'completed' || job.status === 'failed');
      if (isTerminal) {
        console.log(`🔌 Cleaning up WebSocket subscription for job ${jobId} (terminal status: ${job!.status})`);
        webSocketManager.unsubscribe(subscriptionId);
        activeConnections.current.delete(jobId);
      }
    }
  }, [infiniteJobs.jobs, infiniteJobs]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      // Clean up WebSocket connections
      import('@/lib/websocket/connection-manager').then(({ webSocketManager }) => {
        activeConnections.current.forEach((subscriptionId) => {
          webSocketManager.unsubscribe(subscriptionId);
        });
        activeConnections.current.clear();
      });
      
      // Clean up polling intervals
      pollingIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervals.current.clear();
      
      // Note: No preview tracking cleanup needed with sequential generation
    };
  }, []);

  // Global realtime subscription to reflect DB status changes (e.g., queued -> failed)
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`inference_jobs_user_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'inference_jobs',
        filter: `user_id=eq.${user.id}`,
      }, async (payload: any) => {
        const row = payload?.new as any;
        const id = row?.id as string;
        const status = row?.status as string;
        if (!id || !status) return;

        if (status === 'failed') {
          const msg = row?.error_message || 'Generation failed';
          infiniteJobs.updateJobStatus(id, 'failed');
          infiniteJobs.updateJobMessage(id, msg);
          const job = infiniteJobs.jobs.find(j => j.id === id);
          if (job) {
            job.thumbnails.forEach((_, index) => {
              infiniteJobs.updateThumbnail(id, index, { status: 'failed', errorMessage: msg });
            });
          }
          return;
        }

        if (status === 'completed') {
          infiniteJobs.updateJobStatus(id, 'completed');
          await fetchAndApplyResults(id, '🔍 Realtime');
          return;
        }

        if (status === 'running') {
          infiniteJobs.updateJobStatus(id, 'generating');
          return;
        }

        if (status === 'pending') {
          // Ensure pending is reflected and resume any hold watcher
          infiniteJobs.updateJobStatus(id, 'pending' as any);
          resumeHoldIfAny(id);
          return;
        }
      })
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, [user?.id, infiniteJobs, resumeHoldIfAny, fetchAndApplyResults]);

  // Create queued thumbnails (optimistic UI)
  const createQueuedThumbnails = useCallback((nbTakes: number, meta?: { styleId?: string; sceneId?: string; wardrobeId?: string; colorId?: string; aspectRatio?: string; quality?: string }) => {
    // Create a placeholder ID for the thumbnails (no WebSocket connection yet)
    const placeholderId = `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the addJob function from infiniteJobs to create the placeholder
    infiniteJobs.addJob(placeholderId, nbTakes, meta);
    
    console.log(`📋 Created initializing thumbnails with placeholder ${placeholderId} (${nbTakes} takes)`);
    return placeholderId;
  }, [infiniteJobs]);

  // Calculate if any job is currently generating
  const isGenerating = infiniteJobs.jobs.some(job => 
    job.status === 'initializing' || job.status === 'queued' || job.status === 'running' || (job as any).status === 'starting'
  );

  return {
    ...infiniteJobs,
    connectToJob,
    connectJobAfterCreation,
    createQueuedThumbnails,
    isGenerating,
    // Expose helpers for the caller that orchestrates inference-create response
    __internal__: {
      startHoldAndWatchDb,
      cleanupHold,
      resumeHoldIfAny,
      messageHold,
    }
  };
}
