'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useAuth } from '@/contexts/auth-context';
import { webSocketManager } from '@/lib/websocket/connection-manager';

export interface InferenceJob {
  id: string;
  status: string; // Allow any status from Modal - no more rigid mapping
  thumbnails: InferenceThumbnail[];
  createdAt: Date;
  progress?: number;
  nbTakes: number;
  message?: string;
  // Metadata for UI subtitle rendering
  styleId?: string;
  sceneId?: string;
  wardrobeId?: string;
  colorId?: string;
}

interface UseInferenceQueueReturn {
  jobs: InferenceJob[];
  addJob: (jobId: string, nbTakes: number) => void;
  createQueuedThumbnails: (nbTakes: number) => string; // Returns placeholder ID
  updateJobWithRealId: (placeholderId: string, realJobId: string) => void;
  updateJobStatus: (jobId: string, status: InferenceJob['status']) => void;
  updateJobMessage: (jobId: string, message?: string) => void;
  updateThumbnail: (jobId: string, thumbnailIndex: number, updates: Partial<InferenceThumbnail>) => void;
  clearJobs: () => void;
  isGenerating: boolean;
  isLoading: boolean;
  setJobs: React.Dispatch<React.SetStateAction<InferenceJob[]>>;
}

export function useInferenceQueue(): UseInferenceQueueReturn {
  const [jobs, setJobs] = useState<InferenceJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeJobIds = useRef<Set<string>>(new Set());
  const { user } = useAuth();

  // Calculate if any job is currently generating
  const isGenerating = jobs.some(job => 
    job.status === 'initializing' || job.status === 'queued' || job.status === 'running'
  );

  // Fetch active inference jobs from database on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadActiveJobs = async () => {
      try {
        const { fetchActiveInferenceJobs, fetchCompletedInferenceJobs, fetchInferenceJob, getInferenceImageUrl } = await import('@/lib/api/inference-job-management');
        
        // Fetch both active and recent completed jobs
        const [activeJobs, completedJobs] = await Promise.all([
          fetchActiveInferenceJobs(user.id),
          fetchCompletedInferenceJobs(user.id, 5) // Get last 5 completed jobs
        ]);

        console.log(`📊 Found ${activeJobs.length} active jobs and ${completedJobs.length} completed jobs for user ${user.id}`);

        const allJobs: InferenceJob[] = [];

        // Convert active database jobs to UI format
        activeJobs.forEach(dbJob => {
          const nbTakes = dbJob.nb_takes || 1;
          const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
            id: uuidv4(),
            jobId: dbJob.id,
            status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'running' : 'queued',
            index,
            progress: dbJob.status === 'running' ? 50 : 0 // Rough progress estimate
          }));

          allJobs.push({
            id: dbJob.id,
            status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'running' : 'queued',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes,
            // Attach DB metadata so UI can resolve labels by UUID
            styleId: dbJob.style_id,
            sceneId: dbJob.scene_id || undefined,
            wardrobeId: dbJob.wardrobe_id || undefined,
            colorId: dbJob.color_id || undefined
          });

          activeJobIds.current.add(dbJob.id);
        });

        // Convert completed database jobs to UI format with images
        completedJobs.forEach(dbJob => {
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
            nbTakes,
            // Attach DB metadata (UUIDs)
            styleId: dbJob.style_id,
            sceneId: dbJob.scene_id || undefined,
            wardrobeId: dbJob.wardrobe_id || undefined,
            colorId: dbJob.color_id || undefined
          });
        });

        // Sort by creation date (newest first)
        allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setJobs(allJobs);
        console.log(`🚀 Loaded ${allJobs.length} total inference jobs from database`);

        // After initial load, hydrate any already-generated images for running/pending jobs
        // This fixes the reload case where WS won't replay completed images
        await Promise.all(
          activeJobs
            .filter(j => j.status === 'running' || j.status === 'pending')
            .map(async (j) => {
              try {
                const full = await fetchInferenceJob(j.id);
                const images = full?.generated_images || [];
                if (images.length > 0) {
                  setJobs(prev => prev.map(queueJob => {
                    if (queueJob.id !== j.id) return queueJob;
                    const updated = [...queueJob.thumbnails];
                    // Map available images to first N thumbnails (consistent with existing logic)
                    images.forEach((img: any, idx: number) => {
                      const webUrl = getInferenceImageUrl(img.web_path);
                      const originalUrl = getInferenceImageUrl(img.original_path);
                      if (updated[idx]) {
                        updated[idx] = {
                          ...updated[idx],
                          status: 'completed',
                          progress: 100,
                          webImageUrl: webUrl,
                          imageUrl: originalUrl,
                        };
                      }
                    });
                    return { ...queueJob, thumbnails: updated };
                  }));
                }
              } catch (e) {
                console.warn('Hydration fetch failed for job', j.id, e);
              }
            })
        );

      } catch (error) {
        console.error('❌ Failed to load inference jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveJobs();
  }, [user?.id]);

  const addJob = useCallback((jobId: string, nbTakes: number, meta?: { styleId?: string; sceneId?: string; wardrobeId?: string; colorId?: string }) => {
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
      styleId: meta?.styleId,
      sceneId: meta?.sceneId,
      wardrobeId: meta?.wardrobeId,
      colorId: meta?.colorId,
    };

    setJobs(prev => [newJob, ...prev]);
    activeJobIds.current.add(jobId);
    
    console.log(`➕ Added job ${jobId} with ${nbTakes} thumbnails`);
    
    // After a short delay, transition job to running if it's still queued
    // This handles cases where the job starts immediately but we haven't received WebSocket updates yet
    setTimeout(() => {
      setJobs(currentJobs => {
        const jobIndex = currentJobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1 && currentJobs[jobIndex].status === 'queued') {
          console.log(`🚀 Auto-transitioning job ${jobId} from queued to running`);
          
          const updatedJobs = [...currentJobs];
          updatedJobs[jobIndex] = {
            ...updatedJobs[jobIndex],
            status: 'running'
          };
          
          // Update thumbnails to show generating state
          updatedJobs[jobIndex].thumbnails = updatedJobs[jobIndex].thumbnails.map(thumb => ({
            ...thumb,
            status: 'running' as const,
            progress: 10 // Small initial progress
          }));
          
          return updatedJobs;
        }
        return currentJobs;
      });
    }, 3000); // 3 second delay to allow for job initialization
  }, []);

  const createQueuedThumbnails = useCallback((nbTakes: number, meta?: { styleId?: string; sceneId?: string; wardrobeId?: string; colorId?: string }) => {
    // Create a placeholder ID for the thumbnails (no WebSocket connection yet)
    const placeholderId = `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
      id: uuidv4(),
      jobId: placeholderId,
      status: 'queued' as const,
      index,
    }));

    const newJob: InferenceJob = {
      id: placeholderId,
      status: 'initializing',
      thumbnails,
      createdAt: new Date(),
      nbTakes,
      styleId: meta?.styleId,
      sceneId: meta?.sceneId,
      wardrobeId: meta?.wardrobeId,
      colorId: meta?.colorId,
    };

    setJobs(prev => [newJob, ...prev]);
    
    console.log(`📋 Created queued thumbnails with placeholder ${placeholderId} (${nbTakes} takes)`);
    return placeholderId;
  }, []);

  const updateJobWithRealId = useCallback((placeholderId: string, realJobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === placeholderId) {
        // Update job ID and thumbnail jobIds
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
        
        // Add to active jobs tracking
        activeJobIds.current.add(realJobId);
        
        return updatedJob;
      }
      return job;
    }));
  }, []);

  const updateJobStatus = useCallback((jobId: string, status: InferenceJob['status']) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));

    if (status === 'completed' || status === 'failed') {
      activeJobIds.current.delete(jobId);
    }
  }, []);

  const updateJobMessage = useCallback((jobId: string, message?: string) => {
    if (message == null) return;
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, message } : job
    ));
  }, []);

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

  const clearJobs = useCallback(() => {
    setJobs([]);
    activeJobIds.current.clear();
  }, []);

  // Set up real-time subscriptions for inference job updates
  useEffect(() => {
    if (!user?.id) return;

    const setupRealtimeSubscription = async () => {
      try {
        const { subscribeToInferenceJobUpdates } = await import('@/lib/api/inference-job-management');
        
        console.log(`📡 Setting up real-time subscription for user ${user.id}`);
        
        const unsubscribe = subscribeToInferenceJobUpdates(user.id, (updatedJob) => {
          console.log(`📨 Real-time update for job ${updatedJob.id}:`, updatedJob.status);

          // Prevent downgrades once generation has begun (e.g., running → starting)
          const current = jobs.find(j => j.id === updatedJob.id);
          const currentIsRunning = current?.status === 'running';
          const isDowngradeToStarting = currentIsRunning && (updatedJob.status as any) === 'starting';
          const anyThumbProgress = current?.thumbnails?.some(t => (t.progress ?? 0) > 0);
          if (isDowngradeToStarting || (anyThumbProgress && (updatedJob.status as any) === 'starting')) {
            console.log(`⏭️ Ignoring downgrade to 'starting' for job ${updatedJob.id} (already generating)`);
          } else {
            // Update job status in the queue
            updateJobStatus(updatedJob.id, updatedJob.status);
          }

          if (updatedJob.status === 'completed') {
            // Fetch the complete job with images
            import('@/lib/api/inference-job-management').then(async ({ fetchInferenceJob, getInferenceImageUrl }) => {
              const completeJob = await fetchInferenceJob(updatedJob.id);
              if (completeJob && completeJob.generated_images.length > 0) {
                updateJobStatus(updatedJob.id, 'completed');
                
                // Update thumbnails with actual images
                completeJob.generated_images.forEach((image, index) => {
                  console.log(`📸 Updating thumbnail ${index} for job ${updatedJob.id}:`, {
                    original: image.original_path,
                    web: image.web_path
                  });
                  updateThumbnail(updatedJob.id, index, {
                    status: 'completed',
                    progress: 100,
                    imageUrl: getInferenceImageUrl(image.original_path),
                    webImageUrl: getInferenceImageUrl(image.web_path)
                  });
                });
              } else {
                console.warn(`⚠️ No generated images found for completed job ${updatedJob.id}`);
              }
            });
          } else if (updatedJob.status === 'failed') {
            updateJobStatus(updatedJob.id, 'failed');
            // Mark all thumbnails as failed
            const job = jobs.find(j => j.id === updatedJob.id);
            if (job) {
              job.thumbnails.forEach((_, index) => {
                updateThumbnail(updatedJob.id, index, { 
                  status: 'failed',
                  errorMessage: updatedJob.error_message || 'Generation failed'
                });
              });
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Failed to set up real-time subscription:', error);
      }
    };

    const subscriptionPromise = setupRealtimeSubscription();

    return () => {
      subscriptionPromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
          console.log(`📡 Unsubscribed from real-time updates for user ${user.id}`);
        }
      });
    };
  }, [user?.id, updateJobStatus, updateThumbnail, jobs]);

  return {
    jobs,
    addJob,
    createQueuedThumbnails,
    updateJobWithRealId,
    updateJobStatus,
    updateJobMessage,
    updateThumbnail,
    clearJobs,
    isGenerating,
    isLoading,
    setJobs,
  };
}

// Polling fallback when WebSocket is not available
function startPollingForJob(jobId: string, queue: UseInferenceQueueReturn) {
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
        queue.updateJobStatus(jobId, 'completed');
        
        // Update thumbnails with images
        job.generated_images.forEach((image, index) => {
          queue.updateThumbnail(jobId, index, {
            status: 'completed',
            progress: 100,
            imageUrl: getInferenceImageUrl(image.original_path),
            webImageUrl: getInferenceImageUrl(image.web_path)
          });
        });
        
        clearInterval(pollInterval);
        console.log(`✅ Job ${jobId} completed via polling`);
      } else if (job.status === 'failed') {
        queue.updateJobStatus(jobId, 'failed');
        
        // Update all thumbnails to failed state
        const queueJob = queue.jobs.find(j => j.id === jobId);
        if (queueJob) {
          queueJob.thumbnails.forEach((_, index) => {
            queue.updateThumbnail(jobId, index, {
              status: 'failed',
              errorMessage: 'Generation failed'
            });
          });
        }
        
        clearInterval(pollInterval);
        console.log(`❌ Job ${jobId} failed via polling`);
      } else if (job.status === 'running' || job.status === 'pending') {
        queue.updateJobStatus(jobId, 'running');
        
        // Check for any completed images while job is still running
        if (job.generated_images && job.generated_images.length > 0) {
          console.log(`🎨 Found ${job.generated_images.length} partial images for running job ${jobId}`);
          
          // Update thumbnails with any available images
          job.generated_images.forEach((image, index) => {
            const webImageUrl = getInferenceImageUrl(image.web_path);
            const originalImageUrl = getInferenceImageUrl(image.original_path);
            
            queue.updateThumbnail(jobId, index, {
              status: 'completed', // This specific image is completed
              progress: 100,
              imageUrl: originalImageUrl,
              webImageUrl: webImageUrl
            });
          });
          
          // Update remaining thumbnails to running state
          const queueJob = queue.jobs.find(j => j.id === jobId);
          if (queueJob) {
            for (let i = job.generated_images.length; i < queueJob.thumbnails.length; i++) {
              queue.updateThumbnail(jobId, i, {
                status: 'running',
                progress: 75 // Higher progress since some images are done
              });
            }
          }
        } else {
          // No images yet, update all thumbnails to running state
          const queueJob = queue.jobs.find(j => j.id === jobId);
          if (queueJob) {
            queueJob.thumbnails.forEach((_, index) => {
              queue.updateThumbnail(jobId, index, {
                status: 'running',
                progress: 50 // Estimated progress for running jobs
              });
            });
          }
        }
        
        console.log(`🔄 Job ${jobId} is running (via polling)`);
      } else if (job.status === 'queued') {
        // Keep as queued but ensure thumbnails are in queued state
        queue.updateJobStatus(jobId, 'queued');
        console.log(`⏳ Job ${jobId} still queued (via polling)`);
      }
      
    } catch (error) {
      console.error(`❌ Polling error for job ${jobId}:`, error);
    }
  }, 2000); // Poll every 2 seconds for faster updates
  
  // Store interval for cleanup
  return pollInterval;
}

// Hook for managing WebSocket connections for inference jobs
function useInferenceWebSocketManager(queue: UseInferenceQueueReturn) {
  const activeConnections = useRef<Map<string, string>>(new Map()); // jobId -> subscriptionId
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map()); // jobId -> interval

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
      const interval = startPollingForJob(jobId, queue);
      pollingIntervals.current.set(jobId, interval);
      return;
    }
    
    console.log(`🔗 Using WebSocket URL: ${wsUrl}`);
    
    // Update job status to running when connecting
    queue.updateJobStatus(jobId, 'running');
    
    // Use the centralized WebSocket manager
    import('@/lib/websocket/connection-manager').then(({ webSocketManager }) => {
      try {
        console.log(`🔌 Setting up WebSocket subscription for inference job ${jobId}`);
        const subscriptionId = webSocketManager.subscribe(jobId, 'inference', {
          onProgress: (data) => {
            console.log(`📈 WebSocket Progress for job ${jobId}:`, {
              status: data.status,
              progress: data.progress,
              message: data.message,
              timestamp: data.timestamp,
              preview_images: data.preview_images ? `${data.preview_images.length} previews` : 'none',
              completed_images: data.completed_images ? `${data.completed_images.length} completed` : 'none'
            });
            
            // Map database status to UI status
            let uiStatus: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
            let jobStatus: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
            
            switch (data.status) {
              case 'running':
                uiStatus = 'running';
                jobStatus = 'running';
                break;
              case 'completed':
                uiStatus = 'completed';
                jobStatus = 'completed';
                break;
              case 'failed':
                uiStatus = 'failed';
                jobStatus = 'failed';
                break;
              case 'pending':
                uiStatus = 'running';
                jobStatus = 'running';
                break;
              case 'initializing':
                uiStatus = 'running';
                jobStatus = 'running';
                break;
              default:
                uiStatus = 'queued';
                jobStatus = 'queued';
            }
            
            console.log(`🔄 Status mapping for job ${jobId}: ${data.status} → UI: ${uiStatus}, Job: ${jobStatus}`);
            
            // Update job status
            queue.updateJobStatus(jobId, jobStatus);
            // Update job message if provided
            if (typeof data.message === 'string' && data.message) {
              queue.updateJobMessage(jobId, data.message);
            }
            
            // Debug: Check if job exists in queue
            const currentJob = queue.jobs.find(j => j.id === jobId);
            if (!currentJob) {
              console.error(`❌ Job ${jobId} not found in queue! Available jobs:`, queue.jobs.map(j => j.id));
              return;
            }
            
            console.log(`🎯 Found job ${jobId} in queue with ${currentJob.thumbnails.length} thumbnails, current status: ${currentJob.status}`);
            
            // Always update thumbnails when we receive WebSocket data
            const job = queue.jobs.find(j => j.id === jobId);
            if (job) {
              console.log(`🎯 Updating ${job.thumbnails.length} thumbnails for job ${jobId}`);
              
              job.thumbnails.forEach((thumbnail, index) => {
                const updates: Partial<InferenceThumbnail> = {
                  status: uiStatus
                };
                
                // Add progress if available
                if (data.progress !== undefined && data.progress >= 0) {
                  updates.progress = Math.round(Math.min(100, Math.max(0, data.progress)));
                } else if (uiStatus === 'running') {
                  // Provide estimated progress for running jobs without specific progress
                  updates.progress = 50;
                } else if (uiStatus === 'completed') {
                  updates.progress = 100;
                } else if (uiStatus === 'failed') {
                  updates.errorMessage = data.error_message || 'Generation failed';
                }
                
                // Check for preview images in progress data
                if (data.preview_images && Array.isArray(data.preview_images) && data.preview_images[index]) {
                  const previewPath = data.preview_images[index];
                  if (previewPath) {
                    // Import the image URL utility
                    import('@/lib/utils/get-inference-image').then(({ getInferenceImage }) => {
                      const previewUrl = getInferenceImage(previewPath);
                      
                      // Enhanced logging for base64 previews
                      const isBase64 = previewPath.startsWith('data:image/');
                      const logUrl = isBase64 
                        ? `${previewPath.substring(0, 50)}... (base64, ${previewPath.length} chars)`
                        : previewUrl;
                      
                      console.log(`🎨 Setting preview image ${index} for job ${jobId}: ${logUrl}`);
                      
                      // Validate base64 data before setting
                      if (isBase64) {
                        try {
                          // Basic validation - check if it's a valid data URL
                          const [header, data] = previewPath.split(',');
                          if (!header.includes('data:image/') || !data || data.length < 100) {
                            console.warn(`⚠️ Invalid base64 preview for job ${jobId}, index ${index}`);
                            return;
                          }
                          
                          // Check size (warn if very large)
                          if (previewPath.length > 100000) { // 100KB
                            console.warn(`⚠️ Large base64 preview for job ${jobId}: ${previewPath.length} chars`);
                          }
                        } catch (e) {
                          console.error(`❌ Base64 validation failed for job ${jobId}:`, e);
                          return;
                        }
                      }
                      
                      queue.updateThumbnail(jobId, index, {
                        ...updates,
                        webImageUrl: previewUrl, // Use preview as web image
                        imageUrl: previewUrl // Also set as main image for now
                      });
                    });
                    return; // Skip the regular update since we're doing it with preview
                  }
                }
                
                // Check for individual image completion in progress data
                if (data.completed_images && Array.isArray(data.completed_images)) {
                  const completedImage = data.completed_images.find((img: any) => img.index === index);
                  if (completedImage) {
                    import('@/lib/utils/get-inference-image').then(({ getInferenceImage }) => {
                      // Handle both base64 URLs and S3 paths
                      const webUrl = completedImage.web_path 
                        ? getInferenceImage(completedImage.web_path)
                        : completedImage.base64 || completedImage.web_base64;
                      
                      const originalUrl = completedImage.original_path 
                        ? getInferenceImage(completedImage.original_path)
                        : completedImage.base64 || completedImage.original_base64 || webUrl;
                      
                      console.log(`✨ Individual image ${index} completed for job ${jobId}:`, {
                        webUrl: webUrl ? `${webUrl.substring(0, 50)}...` : 'none',
                        originalUrl: originalUrl ? `${originalUrl.substring(0, 50)}...` : 'none',
                        isBase64: webUrl?.startsWith('data:image/') || false
                      });
                      
                      queue.updateThumbnail(jobId, index, {
                        ...updates,
                        status: 'completed',
                        progress: 100,
                        webImageUrl: webUrl,
                        imageUrl: originalUrl
                      });
                    });
                    return; // Skip regular update
                  }
                }
                
                console.log(`📝 Updating thumbnail ${index} for job ${jobId}:`, updates);
                queue.updateThumbnail(jobId, index, updates);
              });
            } else {
              console.warn(`⚠️ Job ${jobId} not found in queue for progress update`);
            }
          },
          onComplete: async (success, error) => {
            console.log(`✅ Job ${jobId} completed. Success: ${success}`, error ? `Error: ${error}` : '');
            console.log(`🔍 Current queue state:`, queue.jobs.map(j => ({ id: j.id, status: j.status, thumbnails: j.thumbnails.length })));
            
            if (success) {
              queue.updateJobStatus(jobId, 'completed');
              
              // Fetch generated images and update thumbnails
              try {
                console.log(`🔍 Fetching inference job result for ${jobId}...`);
                const { fetchInferenceJobResult, getInferenceImageUrl } = await import('@/lib/api/inference-results');
                const result = await fetchInferenceJobResult(jobId);
                
                console.log(`🔍 Fetched result for job ${jobId}:`, result);
                
                if (result && result.generated_images.length > 0) {
                  // Update thumbnails with actual image URLs
                  result.generated_images.forEach((image, index) => {
                    const webImageUrl = getInferenceImageUrl(image.web_path, true);
                    const originalImageUrl = getInferenceImageUrl(image.original_path, false);
                    
                    console.log(`🖼️ Updating thumbnail ${index} for job ${jobId}:`, {
                      web_path: image.web_path,
                      webImageUrl,
                      original_path: image.original_path,
                      originalImageUrl
                    });
                    
                    queue.updateThumbnail(jobId, index, {
                      status: 'completed',
                      imageUrl: originalImageUrl,
                      webImageUrl: webImageUrl,
                      progress: 100
                    });
                  });
                  
                  console.log(`🖼️ Updated ${result.generated_images.length} thumbnails for job ${jobId}`);
                } else {
                  console.warn(`⚠️ No generated images found for completed job ${jobId}`);
                }
              } catch (fetchError) {
                console.error(`❌ Failed to fetch images for completed job ${jobId}:`, fetchError);
              }
            } else {
              queue.updateJobStatus(jobId, 'failed');
              // Mark all thumbnails as failed
              const job = queue.jobs.find(j => j.id === jobId);
              if (job) {
                job.thumbnails.forEach((_, index) => {
                  queue.updateThumbnail(jobId, index, { 
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
            queue.updateJobStatus(jobId, 'failed');
            
            // Mark all thumbnails as failed
            const job = queue.jobs.find(j => j.id === jobId);
            if (job) {
              job.thumbnails.forEach((_, index) => {
                queue.updateThumbnail(jobId, index, { 
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
        queue.updateJobStatus(jobId, 'failed');
      }
    }).catch(error => {
      console.error(`❌ Failed to import WebSocket manager:`, error);
      queue.updateJobStatus(jobId, 'failed');
    });
  }, [queue]);

  const disconnectFromJob = useCallback((jobId: string) => {
    // Clean up WebSocket connection
    const subscriptionId = activeConnections.current.get(jobId);
    if (subscriptionId) {
      import('@/lib/websocket/connection-manager').then(({ webSocketManager }) => {
        webSocketManager.unsubscribe(subscriptionId);
        activeConnections.current.delete(jobId);
        console.log(`🔌 Disconnected WebSocket for job ${jobId}`);
      });
    }
    
    // Clean up polling interval
    const interval = pollingIntervals.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingIntervals.current.delete(jobId);
      console.log(`🔄 Stopped polling for job ${jobId}`);
    }
  }, []);

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
    };
  }, []);

  return {
    connectToJob,
    disconnectFromJob,
  };
}

// Custom hook that combines inference queue with WebSocket progress tracking
export function useInferenceQueueWithProgress(): UseInferenceQueueReturn & {
  connectToJob: (jobId: string) => void;
} {
  const queue = useInferenceQueue();
  const { connectToJob, disconnectFromJob } = useInferenceWebSocketManager(queue);
  const activeConnections = useRef<Map<string, string>>(new Map()); // jobId -> subscriptionId

  // Monitor active jobs and update their thumbnail states based on WebSocket progress
  useEffect(() => {
    const activeJobs = queue.jobs.filter(job => 
      (job.status === 'queued' || job.status === 'running') &&
      !job.id.startsWith('placeholder_') // Don't connect to placeholder jobs
    );

    activeJobs.forEach(job => {
      // Subscribe to progress updates for this job using the centralized manager
      const subscriptionId = webSocketManager.subscribe(job.id, 'inference', {
        onProgress: (data) => {
          const status = data.status;
          const progress = data.progress || 0;
          
          if (status === 'running' || status === 'pending' || status === 'initializing') {
            queue.updateJobStatus(job.id, 'running');
            
            // Update all thumbnails to running state
            job.thumbnails.forEach((_, index) => {
              queue.updateThumbnail(job.id, index, {
                status: 'running',
                progress: Math.min(progress, 90) // Cap at 90% until completion
              });
            });
          } else if (status === 'completed') {
            queue.updateJobStatus(job.id, 'completed');
            
            // Mark all thumbnails as completed
            job.thumbnails.forEach((_, index) => {
              queue.updateThumbnail(job.id, index, {
                status: 'completed',
                progress: 100
              });
            });
          } else if (status === 'failed') {
            queue.updateJobStatus(job.id, 'failed');
            
            // Mark all thumbnails as failed
            job.thumbnails.forEach((_, index) => {
              queue.updateThumbnail(job.id, index, {
                status: 'failed',
                progress: 0
              });
            });
          }
        },
        onComplete: (success: boolean) => {
          queue.updateJobStatus(job.id, success ? 'completed' : 'failed');
        },
        onError: (error: string) => {
          console.error(`WebSocket error for job ${job.id}:`, error);
          queue.updateJobStatus(job.id, 'failed');
        }
      });
      
      // Store subscription for cleanup
      activeConnections.current.set(job.id, subscriptionId);
    });

    // Cleanup subscriptions for jobs that are no longer active
    for (const [jobId, subscriptionId] of activeConnections.current.entries()) {
      if (!activeJobs.find(job => job.id === jobId)) {
        webSocketManager.unsubscribe(subscriptionId);
        activeConnections.current.delete(jobId);
      }
    }
  }, [queue.jobs, queue]);

  // Removed connectJobAfterCreation - now using simplified useInferenceProgress approach

  return {
    ...queue,
    connectToJob,
  };
}
