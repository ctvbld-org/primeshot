'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useAuth } from '@/contexts/auth-context';

export interface InferenceJob {
  id: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  thumbnails: InferenceThumbnail[];
  createdAt: Date;
  progress?: number;
  nbTakes: number;
}

interface UseInferenceQueueReturn {
  jobs: InferenceJob[];
  addJob: (jobId: string, nbTakes: number) => void;
  updateJobStatus: (jobId: string, status: InferenceJob['status']) => void;
  updateThumbnail: (jobId: string, thumbnailIndex: number, updates: Partial<InferenceThumbnail>) => void;
  clearJobs: () => void;
  isGenerating: boolean;
  isLoading: boolean;
}

export function useInferenceQueue(): UseInferenceQueueReturn {
  const [jobs, setJobs] = useState<InferenceJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeJobIds = useRef<Set<string>>(new Set());
  const { user } = useAuth();

  // Calculate if any job is currently generating
  const isGenerating = jobs.some(job => 
    job.status === 'queued' || job.status === 'generating'
  );

  // Fetch active inference jobs from database on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Debug configuration on first load
    import('@/lib/debug/inference-debug').then(({ checkInferenceConfiguration }) => {
      checkInferenceConfiguration();
    });

    const loadActiveJobs = async () => {
      try {
        const { fetchActiveInferenceJobs, fetchCompletedInferenceJobs, getInferenceImageUrl } = await import('@/lib/api/inference-jobs');
        
        // Fetch both active and recent completed jobs
        const [activeJobs, completedJobs] = await Promise.all([
          fetchActiveInferenceJobs(user.id),
          fetchCompletedInferenceJobs(user.id, 5) // Get last 5 completed jobs
        ]);

        console.log(`📊 Found ${activeJobs.length} active jobs and ${completedJobs.length} completed jobs for user ${user.id}`);

        const allJobs: InferenceJob[] = [];

        // Convert active database jobs to UI format
        activeJobs.forEach(dbJob => {
          const nbTakes = dbJob.settings?.nb_takes || 1;
          const thumbnails: InferenceThumbnail[] = Array.from({ length: nbTakes }, (_, index) => ({
            id: uuidv4(),
            jobId: dbJob.id,
            status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'running' : 'queued',
            index,
            progress: dbJob.status === 'running' ? 50 : 0 // Rough progress estimate
          }));

          allJobs.push({
            id: dbJob.id,
            status: dbJob.status === 'pending' || dbJob.status === 'running' ? 'generating' : 'queued',
            thumbnails,
            createdAt: new Date(dbJob.created_at),
            nbTakes
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
          const nbTakes = dbJob.settings?.nb_takes || thumbnails.length;
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
        console.log(`🚀 Loaded ${allJobs.length} total inference jobs from database`);

      } catch (error) {
        console.error('❌ Failed to load inference jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveJobs();
  }, [user?.id]);

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
    activeJobIds.current.add(jobId);
    
    console.log(`➕ Added job ${jobId} with ${nbTakes} thumbnails`);
    
    // After a short delay, transition job to generating if it's still queued
    // This handles cases where the job starts immediately but we haven't received WebSocket updates yet
    setTimeout(() => {
      setJobs(currentJobs => {
        const jobIndex = currentJobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1 && currentJobs[jobIndex].status === 'queued') {
          console.log(`🚀 Auto-transitioning job ${jobId} from queued to generating`);
          
          const updatedJobs = [...currentJobs];
          updatedJobs[jobIndex] = {
            ...updatedJobs[jobIndex],
            status: 'generating'
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

  const updateJobStatus = useCallback((jobId: string, status: InferenceJob['status']) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));

    if (status === 'completed' || status === 'failed') {
      activeJobIds.current.delete(jobId);
    }
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
        const { subscribeToInferenceJobUpdates } = await import('@/lib/api/inference-jobs');
        
        console.log(`📡 Setting up real-time subscription for user ${user.id}`);
        
        const unsubscribe = subscribeToInferenceJobUpdates(user.id, (updatedJob) => {
          console.log(`📨 Real-time update for job ${updatedJob.id}:`, updatedJob.status);
          
          // Update job status in the queue
          if (updatedJob.status === 'completed') {
            // Fetch the complete job with images
            import('@/lib/api/inference-jobs').then(async ({ fetchInferenceJob, getInferenceImageUrl }) => {
              const completeJob = await fetchInferenceJob(updatedJob.id);
              if (completeJob && completeJob.generated_images.length > 0) {
                updateJobStatus(updatedJob.id, 'completed');
                
                // Update thumbnails with actual images
                completeJob.generated_images.forEach((image, index) => {
                  updateThumbnail(updatedJob.id, index, {
                    status: 'completed',
                    progress: 100,
                    imageUrl: getInferenceImageUrl(image.original_path),
                    webImageUrl: getInferenceImageUrl(image.web_path)
                  });
                });
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
          } else if (updatedJob.status === 'running') {
            updateJobStatus(updatedJob.id, 'generating');
          } else if (updatedJob.status === 'pending') {
            updateJobStatus(updatedJob.id, 'generating');
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
    updateJobStatus,
    updateThumbnail,
    clearJobs,
    isGenerating,
    isLoading,
  };
}

// Polling fallback when WebSocket is not available
function startPollingForJob(jobId: string, queue: UseInferenceQueueReturn) {
  console.log(`🔄 Starting polling for job: ${jobId}`);
  
  const pollInterval = setInterval(async () => {
    try {
      const { fetchInferenceJob, getInferenceImageUrl } = await import('@/lib/api/inference-jobs');
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
        queue.updateJobStatus(jobId, 'generating');
        
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
  }, 5000); // Poll every 5 seconds
  
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
      console.warn(`⚠️ Expected URL format: wss://creativebuild--primeshot-inference-progress.modal.run`);
      
      // Start polling as fallback
      const interval = startPollingForJob(jobId, queue);
      pollingIntervals.current.set(jobId, interval);
      return;
    }
    
    console.log(`🔗 Using WebSocket URL: ${wsUrl}`);
    
    // Update job status to generating when connecting
    queue.updateJobStatus(jobId, 'generating');
    
    // Use the centralized WebSocket manager
    import('@/lib/websocket/connection-manager').then(({ webSocketManager }) => {
      try {
        const subscriptionId = webSocketManager.subscribe(jobId, 'inference', {
          onProgress: (data) => {
            console.log(`📈 WebSocket Progress for job ${jobId}:`, {
              status: data.status,
              progress: data.progress,
              message: data.message,
              timestamp: data.timestamp
            });
            
            // Map database status to UI status
            let uiStatus: 'queued' | 'running' | 'completed' | 'failed' = 'queued';
            let jobStatus: 'queued' | 'generating' | 'completed' | 'failed' = 'queued';
            
            switch (data.status) {
              case 'running':
                uiStatus = 'running';
                jobStatus = 'generating';
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
                jobStatus = 'generating';
                break;
              case 'initializing':
                uiStatus = 'running';
                jobStatus = 'generating';
                break;
              default:
                uiStatus = 'queued';
                jobStatus = 'queued';
            }
            
            console.log(`🔄 Status mapping for job ${jobId}: ${data.status} → UI: ${uiStatus}, Job: ${jobStatus}`);
            
            // Update job status
            queue.updateJobStatus(jobId, jobStatus);
            
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
                      console.log(`🎨 Setting preview image ${index} for job ${jobId}: ${previewUrl}`);
                      
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
                      const webUrl = getInferenceImage(completedImage.web_path);
                      const originalUrl = getInferenceImage(completedImage.original_path);
                      
                      console.log(`✨ Individual image ${index} completed for job ${jobId}: ${webUrl}`);
                      
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
            
            if (success) {
              queue.updateJobStatus(jobId, 'completed');
              
              // Fetch generated images and update thumbnails
              try {
                const { fetchInferenceJobResult, getInferenceImageUrl } = await import('@/lib/api/inference-images');
                const result = await fetchInferenceJobResult(jobId);
                
                if (result && result.generated_images.length > 0) {
                  // Update thumbnails with actual image URLs
                  result.generated_images.forEach((image, index) => {
                    const webImageUrl = getInferenceImageUrl(image.web_path, true);
                    const originalImageUrl = getInferenceImageUrl(image.original_path, false);
                    
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
  replaceJobId: (tempJobId: string, realJobId: string) => void;
} {
  const queue = useInferenceQueue();
  const { connectToJob, disconnectFromJob } = useInferenceWebSocketManager(queue);

  // Auto-connect to active jobs when they're loaded from the database
  useEffect(() => {
    const activeJobs = queue.jobs.filter(job => 
      job.status === 'queued' || job.status === 'generating'
    );

    if (activeJobs.length > 0) {
      console.log(`🔌 Auto-connecting to ${activeJobs.length} active jobs`);
      activeJobs.forEach(job => {
        connectToJob(job.id);
      });
    }
  }, [queue.jobs, connectToJob]);

  const replaceJobId = useCallback((tempJobId: string, realJobId: string) => {
    console.log(`🔄 Replacing temp job ID ${tempJobId} with real job ID ${realJobId}`);
    
    // Find the job with temp ID
    const tempJob = queue.jobs.find(job => job.id === tempJobId);
    if (!tempJob) {
      console.warn(`⚠️ Temp job ${tempJobId} not found for replacement`);
      return;
    }

    // Create new job with real ID and transfer thumbnails
    const newJob: InferenceJob = {
      ...tempJob,
      id: realJobId,
      thumbnails: tempJob.thumbnails.map(thumbnail => ({
        ...thumbnail,
        jobId: realJobId
      }))
    };

    // Add new job to the queue (this will replace the temp job in practice)
    queue.addJob(realJobId, tempJob.nbTakes);
    
    // Transfer thumbnail states to the new job
    tempJob.thumbnails.forEach((thumbnail, index) => {
      queue.updateThumbnail(realJobId, index, {
        status: thumbnail.status,
        progress: thumbnail.progress,
        imageUrl: thumbnail.imageUrl,
        webImageUrl: thumbnail.webImageUrl
      });
    });
    
    // Disconnect temp job and connect real job
    disconnectFromJob(tempJobId);
    connectToJob(realJobId);
    
    // Remove temp job (mark as completed to clean it up)
    setTimeout(() => {
      queue.updateJobStatus(tempJobId, 'completed');
    }, 100);
    
  }, [queue, connectToJob, disconnectFromJob]);

  return {
    ...queue,
    connectToJob,
    replaceJobId,
  };
}
