'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover';
import { useAuth } from '@/contexts/auth-context';
import { useFaceModelsApi } from '@/lib/api/face-models';
import { createClient } from '@/lib/supabase/client';
import { ProgressTracker } from './progress_tracker';
import { Countdown } from './countdown';
import { cn } from '@/lib/utils';
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress';
import { Plus, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import styles from './FaceModelSelector.module.css';
import { getApiUrl } from '@/lib/api/client';
import { useOpenSigninModal } from '@/hooks/useOpenSigninModal';
import { Button } from '@primeshot/common/web/ui/button';
import { openFaceModelUploadDialog } from './FaceModelUploadDialog';

interface FaceModelWithTraining {
  id: string;
  name: string;
  status: 'queued' | 'training' | 'ready' | 'failed';
  user_id: string;
  training_job_id?: string;
  created_at: string;
  image_count?: number;
  thumbnail_url?: string;
}

interface TrainingJob {
  id: string;
  face_model_id: string;
  status: string;
  created_at: string;
}

interface FaceModelSelectorProps {
  className?: string;
  onModelSelected?: (modelId: string) => void;
  refreshTrigger?: number;
}

interface TrainingProgressState {
  progress?: any;
  isConnected: boolean;
  isConnecting: boolean;
  error?: string | null;
  getProgressPercentage?: () => number;
  getEstimatedTimeRemaining?: () => string;
  getLiveCountdownSeconds?: () => number;
}

// Note: Face models are automatically detected and selected when training starts
export function FaceModelSelector({ className, onModelSelected, refreshTrigger }: FaceModelSelectorProps) {
  const { user } = useAuth();
  const { getUserFaceModels } = useFaceModelsApi();
  const openSigninModal = useOpenSigninModal();
  const [faceModels, setFaceModels] = useState<FaceModelWithTraining[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [userHasManuallySelected, setUserHasManuallySelected] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<Record<string, TrainingProgressState>>({});
  const [trainingJobIds, setTrainingJobIds] = useState<Record<string, string>>({});

  const supabase = useMemo(() => createClient(), []);

  // Get the selected model
  const selectedModel = useMemo(() => {
    if (!user?.id) return null;
    return faceModels.find(model => model.id === selectedModelId);
  }, [faceModels, selectedModelId, user?.id]);

  // Helper function to get training job IDs for models
  const getTrainingJobIds = useCallback(async (models: FaceModelWithTraining[]) => {
    const trainingModels = models.filter(m => ['queued', 'training'].includes(m.status));
    if (trainingModels.length === 0) return {};

    const { data: jobs, error } = await supabase
      .from('training_jobs')
      .select('id, face_model_id')
      .in('face_model_id', trainingModels.map(m => m.id))
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training jobs:', error);
      return {};
    }

    return jobs.reduce((acc, job) => ({
      ...acc,
      [job.face_model_id]: job.id
    }), {} as Record<string, string>);
  }, [supabase]);

  // Load persisted selection on mount
  useEffect(() => {
    const persistedSelection = localStorage.getItem(`face-model-selection`);

    if (persistedSelection) {
        const { modelId, isManual } = JSON.parse(persistedSelection);
        setSelectedModelId(modelId);
        setUserHasManuallySelected(isManual);
    }
  }, []);

  const loadFaceModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (!user?.id) {
      setIsLoading(false);
      setFaceModels([]);
      return;
    }

    try {

      // Get face models with relevant statuses (including queued for new training)
      const models = await getUserFaceModels(user.id);
      const relevantModels = models.filter(model => 
        ['queued', 'training', 'ready', 'failed'].includes(model.status)
      );

      // Get training jobs for these models to link training models with their jobs
      const { data: trainingJobs, error: jobsError } = await supabase
        .from('training_jobs')
        .select('id, face_model_id, status, created_at')
        .eq('user_id', user.id)
        .in('face_model_id', relevantModels.map(m => m.id))
        .order('created_at', { ascending: false });

      if (jobsError) {
        throw new Error(`Failed to fetch training jobs: ${jobsError.message}`);
      }

      // Map models with their latest training job info
      const modelsWithTraining: FaceModelWithTraining[] = relevantModels.map(model => {
        const latestJob = trainingJobs?.find(job => job.face_model_id === model.id);
        
        return {
          id: model.id,
          name: model.name,
          status: model.status as 'queued' | 'training' | 'ready' | 'failed',
          user_id: model.user_id,
          training_job_id: latestJob?.id,
          created_at: model.created_at,
          image_count: model.image_count || 0,
          thumbnail_url: (model as any).thumbnail_url || null
        };
      });

      // Sort models from newest to oldest
      const sortedModels = modelsWithTraining.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setFaceModels(sortedModels);

      // Generate presigned URLs for thumbnails
      const urlPromises = modelsWithTraining
        .filter(model => model.thumbnail_url)
        .map(async (model) => {
          try {
            const response = await fetch(getApiUrl(`/api/user-images?url=${encodeURIComponent(model.thumbnail_url!)}`));
            if (response.ok) {
              const { url } = await response.json();
              return { [model.id]: url };
            } else {
              console.warn(`Failed to get signed URL for model ${model.id}`);
              return { [model.id]: '' };
            }
          } catch (error) {
            console.error(`Failed to create presigned URL for model ${model.id}:`, error);
            return { [model.id]: '' };
          }
        });

      if (urlPromises.length > 0) {
        try {
          const urlResults = await Promise.all(urlPromises);
          const urlMap = urlResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          setThumbnailUrls(urlMap);
        } catch (error) {
          console.warn('Failed to generate presigned URLs, using fallback avatars:', error);
          setThumbnailUrls({});
        }
      } else {
        setThumbnailUrls({});
      }

      // Smart selection logic
      if (sortedModels.length > 0) {
        const persistedSelection = localStorage.getItem(`face-model-selection`);
        const newestModel = sortedModels[0];
       
        if (persistedSelection) {
          const { modelId } = JSON.parse(persistedSelection);
          
          setSelectedModelId(modelId);
        } else {
          // No previous selection, auto-select newest model
          setSelectedModelId(newestModel.id);
          localStorage.setItem(`face-model-selection`, JSON.stringify({
            modelId: newestModel.id
          }));
          onModelSelected?.(newestModel.id);
        }
      }

    } catch (err) {
      console.error('Failed to load face models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load face models');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getUserFaceModels, supabase]);

  // Reload face models whenever the refreshTrigger increments
  useEffect(() => {
    loadFaceModels();
  }, [loadFaceModels, refreshTrigger]);

  // Clear selected model when user logs out
  useEffect(() => {
    if (!user?.id) {
      setSelectedModelId('');
    }
  }, [user?.id]);

  // Handle manual selection changes
  const handleModelSelected = useCallback((newModelId: string) => {    
    setSelectedModelId(newModelId);
    
    // Persist manual selection
    localStorage.setItem(`face-model-selection`, JSON.stringify({
    modelId: newModelId
    }));
    
    // Notify parent component
    onModelSelected?.(newModelId);
  }, [user?.id, onModelSelected]);

  // Handler passed to ProgressTracker to update central progress state without recreating tracker type
  const handleProgressUpdate = useCallback((modelId: string, data: TrainingProgressState) => {
    setTrainingProgress(prev => {
      const existing = prev[modelId];
      // While training is running, update every second to refresh live countdown
      if (data.progress?.status !== 'running') {
        const existingRemaining = existing?.getEstimatedTimeRemaining?.();
        const newRemaining = data.getEstimatedTimeRemaining?.();

        if (
          existing?.progress === data.progress &&
          existing?.isConnected === data.isConnected &&
          existing?.isConnecting === data.isConnecting &&
          existing?.error === data.error &&
          existingRemaining === newRemaining
        ) {
          return prev;
        }
      }

      return {
        ...prev,
        [modelId]: data
      };
    });
  }, []);

  // Refresh logic after a training job signals completion
  const handleTrainingComplete = useCallback((modelId: string) => {
    // Remove stale progress entry for this model
    setTrainingProgress(prev => {
      const { [modelId]: _removed, ...rest } = prev;
      return rest;
    });

    // Optimistically set model status to ready so UI updates immediately
    setFaceModels(prev => prev.map(m => (m.id === modelId ? { ...m, status: 'ready' } : m)));

    // Fetch fresh data to confirm backend status
    //loadFaceModels();

  }, [loadFaceModels]);

  const getStatusDisplay = (model: FaceModelWithTraining): React.ReactNode => {
    if (model.status === 'queued') {
      return 'Queued';
    }
    if (model.status === 'training') {
      const progress = trainingProgress[model.id];
      const seconds = progress?.progress ? progress.getLiveCountdownSeconds?.() : null;

      return <Countdown seconds={seconds} />;
    }
    if (model.status === 'ready') {
      const date = new Date(model.created_at);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'Failed';
  };

  const getImageCount = (model: FaceModelWithTraining) => {
    if (model.status === 'queued') {
      return 'Initializing...';
    }
    if (model.status === 'training') {
      const progress = trainingProgress[model.id];
      if (progress?.progress?.message) {
        return progress.progress.message;
      }
      return 'Training...';
    }
    if (model.status === 'ready' && model.image_count) {
      return `${model.image_count} Photos`;
    }
    return '';
  };

  // Fetch training job IDs for queued/training models whenever faceModels changes
  useEffect(() => {
    if (!faceModels) return;

    const fetchJobIds = async () => {
      const ids = await getTrainingJobIds(faceModels);
      setTrainingJobIds(ids);
    };

    fetchJobIds();
  }, [faceModels, getTrainingJobIds]);



  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {/* Hidden trackers that manage WebSocket connections */}
      {Object.entries(trainingJobIds).map(([modelId, jobId]) => (
        <ProgressTracker
          key={modelId}
          modelId={modelId}
          jobId={jobId}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleTrainingComplete}
        />
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <button className={styles.trigger}>
            {/* Thumbnail */}
            <div className={styles.thumbnail}>
              {!user?.id ? (
                <div className={`${styles.createIcon} ${styles.modelThumbnail}`}>
                  <Plus className="w-4 h-4 text-white" />
                </div>
              ) : selectedModel ? (
                <div className={styles.modelThumbnail}>
                  {(selectedModel.status === 'training' || selectedModel.status === 'queued') && (
                    <CircleProgress value={trainingProgress[selectedModel.id]?.getProgressPercentage?.() ?? 0} size={32} thickness={3} />
                  )}
                  {thumbnailUrls[selectedModel.id] ? (
                    <Image
                      src={thumbnailUrls[selectedModel.id]}
                      alt={selectedModel.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className={styles.modelInitial}>
                      {selectedModel.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${styles.createIconGray} ${styles.modelThumbnail}`}>
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Text */}
            <div className={styles.textContainer}>
              <p className={styles.primaryText}>
                {!user?.id ? "Create Model" : selectedModel ? selectedModel.name : "Select face model"}
              </p>
              <p className={styles.secondaryText}>Face Model</p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 bg-[#083533] border-[rgba(229,251,250,0.2)] text-white p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Face Model</h3>
          </div>
          
          <div className={styles.optionsContainer}>
            {!user?.id ? (
              // Show "Sign in" dialog when not authenticated
              <div className={styles.modelOption} onClick={() => handleModelSelected("signin")}>
                <div className="flex items-center space-x-3">
                  <div className={`${styles.createIcon} ${styles.modelThumbnailLarge}`}>
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>Create Face Model</div>
                    <div className={styles.modelMeta}>Sign in to get started</div>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              // Show loading state
              <div className={styles.modelOption}>
                <div className="flex items-center space-x-3">
                  <div className={styles.loadingIndicator}></div>
                  <div className={styles.modelMeta}>Loading face models...</div>
                </div>
              </div>
            ) : error ? (
              // Show error state
              <div className={styles.modelOption}>
                <div className="flex items-center space-x-3">
                  <div className={`${styles.errorIcon} ${styles.modelThumbnailLarge}`}>
                    !
                  </div>
                  <div className={styles.modelInfo}>
                    <div className="font-medium text-red-400">Error loading models</div>
                    <div className={styles.modelMeta}>{error}</div>
                  </div>
                </div>
              </div>
            ) : faceModels.length === 0 ? (
              // Show empty state for authenticated users
              <div className={styles.modelOption} onClick={() => {
                handleModelSelected("empty");
                openFaceModelUploadDialog();
              }}>
                <div className="flex items-center space-x-3">
                  <div className={`${styles.createIcon} ${styles.modelThumbnailLarge}`}>
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>Create Your First Face Model</div>
                    <div className={styles.modelMeta}>Upload photos to get started</div>
                  </div>
                </div>
              </div>
            ) : (
              // Show face models for authenticated users
              faceModels.map((model) => (
                <div
                  key={model.id}
                  className={styles.modelOption}
                  onClick={() => handleModelSelected(model.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className={styles.modelThumbnailLarge}>
                        {(model.status === 'training' || model.status === 'queued') && (
                          <CircleProgress value={trainingProgress[model.id]?.getProgressPercentage?.() ?? 0} size={48} thickness={3} />
                        )}
                        {thumbnailUrls[model.id] ? (
                          <Image
                            src={thumbnailUrls[model.id]}
                            alt={model.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className={styles.modelInitial}>
                            {model.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.modelInfo}>
                        <div className={styles.modelName}>{model.name}</div>
                        <div className={styles.modelMeta}>
                          {getImageCount(model)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.statusIndicator}>
                      {getStatusDisplay(model)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.dropdownFooter}>
            {!user?.id ? (
              <Button variant="outline" className={styles.dropdownFooterButton} onClick={() => openSigninModal()}>
                Sign in
              </Button>
            ) : (
              <Button variant="outline" className={styles.dropdownFooterButton} onClick={() => openFaceModelUploadDialog()}>
                Create Face Model
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedModel && ['queued', 'training'].includes(selectedModel.status || '') && (
        <div className="flex space-x-1">
          <div className="text-sm">
            {selectedModel.status === 'queued' && (
              <span className="text-yellow-400">Queued</span>
            )}
            {selectedModel.status === 'training' && (
              trainingProgress[selectedModel.id]?.progress ? (
                <span className="text-cyan-400">{trainingProgress[selectedModel.id].progress.message}</span>
              ) : (
                <span className="text-cyan-400">Initializing</span>
              )
            )}
          </div>
          <div className="text-sm text-gray-400">
            {selectedModel.status === 'training' ? (
              <><span>About </span><Countdown seconds={trainingProgress[selectedModel.id]?.getLiveCountdownSeconds?.()} /><span> remaining</span></>
            ) : (
              <span>Calculating remaining time</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}