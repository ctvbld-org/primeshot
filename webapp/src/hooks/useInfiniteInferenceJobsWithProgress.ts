'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useInfiniteInferenceJobs } from './useInfiniteInferenceJobs';
import { useAuth } from '@/contexts/auth-context';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';

/**
 * Enhanced infinite inference jobs hook with WebSocket progress tracking
 * Combines infinite scrolling with real-time progress updates
 */
export function useInfiniteInferenceJobsWithProgress() {
  const infiniteJobs = useInfiniteInferenceJobs();
  const { user } = useAuth();
  const activeConnections = useRef<Map<string, string>>(new Map()); // jobId -> subscriptionId
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map()); // jobId -> interval

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
    
    // Update job status to running when connecting
    infiniteJobs.updateJobStatus(jobId, 'running');
    
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
            infiniteJobs.updateJobStatus(jobId, jobStatus);
            
            // Debug: Check if job exists in queue
            const currentJob = infiniteJobs.jobs.find(j => j.id === jobId);
            if (!currentJob) {
              console.error(`❌ Job ${jobId} not found in queue! Available jobs:`, infiniteJobs.jobs.map(j => j.id));
              return;
            }
            
            console.log(`🎯 Found job ${jobId} in queue with ${currentJob.thumbnails.length} thumbnails, current status: ${currentJob.status}`);
            
            // Always update thumbnails when we receive WebSocket data
            const job = infiniteJobs.jobs.find(j => j.id === jobId);
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
                      
                      infiniteJobs.updateThumbnail(jobId, index, {
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
                      
                      infiniteJobs.updateThumbnail(jobId, index, {
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
                infiniteJobs.updateThumbnail(jobId, index, updates);
              });
            } else {
              console.warn(`⚠️ Job ${jobId} not found in queue for progress update`);
            }
          },
          onComplete: async (success, error) => {
            console.log(`✅ Job ${jobId} completed. Success: ${success}`, error ? `Error: ${error}` : '');
            
            if (success) {
              infiniteJobs.updateJobStatus(jobId, 'completed');
              
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
                    
                    infiniteJobs.updateThumbnail(jobId, index, {
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
          infiniteJobs.updateJobStatus(jobId, 'running');
          console.log(`🔄 Job ${jobId} is running (via polling)`);
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
    
    // Connect to the real job WebSocket
    connectToJob(realJobId);
    
  }, [infiniteJobs, connectToJob]);

  // Auto-connect to active jobs when they're loaded from the database
  useEffect(() => {
    const activeJobs = infiniteJobs.jobs.filter(job => 
      (job.status === 'queued' || job.status === 'running') &&
      !job.id.startsWith('placeholder_') // Don't connect to placeholder jobs
    );

    if (activeJobs.length > 0) {
      console.log(`🔌 Auto-connecting to ${activeJobs.length} active jobs (excluding placeholders)`);
      activeJobs.forEach(job => {
        connectToJob(job.id);
      });
    }
  }, [infiniteJobs.jobs, connectToJob]);

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

  // Create queued thumbnails (optimistic UI)
  const createQueuedThumbnails = useCallback((nbTakes: number) => {
    // Create a placeholder ID for the thumbnails (no WebSocket connection yet)
    const placeholderId = `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the addJob function from infiniteJobs to create the placeholder
    infiniteJobs.addJob(placeholderId, nbTakes);
    
    console.log(`📋 Created queued thumbnails with placeholder ${placeholderId} (${nbTakes} takes)`);
    return placeholderId;
  }, [infiniteJobs]);

  // Calculate if any job is currently generating
  const isGenerating = infiniteJobs.jobs.some(job => 
    job.status === 'queued' || job.status === 'running'
  );

  return {
    ...infiniteJobs,
    connectToJob,
    connectJobAfterCreation,
    createQueuedThumbnails,
    isGenerating,
  };
}
