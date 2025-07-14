'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { confirmationService } from '@/lib/services/confirmationService';
import { useAuth } from '@/contexts/auth-context';
import { useFaceModelsApi } from '@/lib/api/face-models';
import { createClient } from '@/lib/supabase/client';
import { ProgressTracker } from './progress_tracker';
import { Countdown } from './countdown';
import { cn } from '@/lib/utils';
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress';
import { Plus, ChevronDown } from 'lucide-react';
import { Icon } from '@primeshot/common/web/Icon';
import Image from 'next/image';
import styles from './FaceModelSelector.module.css';
import { getApiUrl } from '@/lib/api/client';
import { Button } from '@primeshot/common/web/ui/button';
import { FaceModelUploadDialog } from './FaceModelUploadDialog';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useSubscriptionTiers, useCreditCosts, getFaceModelTrainingCost, getFaceModelLimit } from '@/hooks/usePricingConfig';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription';
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog';
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useFaceModelTrainingStatus } from '@/hooks/useFaceModelTrainingStatus';

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

export function FaceModelSelector({ className, onModelSelected, refreshTrigger }: FaceModelSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('upload');
  const queryClient = useQueryClient();
  const dialogService = useDialogService();
  const { data: subscription } = useCurrentSubscription();
  const { data: subscriptionTiers } = useSubscriptionTiers();
  const { data: creditCosts } = useCreditCosts();
  const { data: creditBalance } = useCreditBalance();
  const { hasActiveSubscription } = useSubscriptionStatus();
  const openSubscriptionDialog = useOpenSubscriptionDialog();
  const openCreditPackDialog = useOpenCreditPackDialog();
  
  // Face model training cost from DB
  const faceModelTrainingCost = getFaceModelTrainingCost(creditCosts);
  
  // Calculate remaining face model trainings
  const remainingFaceModelTrainings = useMemo(() => {
    if (!subscription) return 0;
    return Math.max(0, subscription.face_model_training_included - subscription.face_model_training_used);
  }, [subscription]);

  // Check if user needs credits for training (vs included in subscription)
  const needsCreditsForTraining = useMemo(() => {
    if (!subscription) return true;
    return remainingFaceModelTrainings <= 0;
  }, [subscription, remainingFaceModelTrainings]);

  // Check if user has sufficient credits when needed
  const hasSufficientCredits = useMemo(() => {
    if (!needsCreditsForTraining) return true;
    if (creditBalance === undefined) return false;
    return creditBalance >= faceModelTrainingCost;
  }, [needsCreditsForTraining, creditBalance, faceModelTrainingCost]);

  // Check maximum face models allowed
  const maxFaceModels = useMemo(() => {
    if (!subscription || !subscriptionTiers) return 1;
    return getFaceModelLimit(subscription.plan_name, subscriptionTiers);
  }, [subscription, subscriptionTiers]);

  const { getUserFaceModels, deleteFaceModel } = useFaceModelsApi();
  const [faceModels, setFaceModels] = useState<FaceModelWithTraining[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<Record<string, TrainingProgressState>>({});
  const [trainingJobIds, setTrainingJobIds] = useState<Record<string, string>>({});
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [refreshTriggerInternal, setRefreshTriggerInternal] = useState<number>(0);

  const supabase = createClient()
  const creditGuard = useCreditGuard(faceModelTrainingCost);

  // Get the selected model object
  const selectedModel = useMemo(() => 
    faceModels.find(model => model.id === selectedModelId),
    [faceModels, selectedModelId]
  );

  // Determine if popover should be enabled (only when user is authenticated AND has active subscription)
  const shouldEnablePopover = user?.id && hasActiveSubscription;

  // Check if user has reached face model limit
  const hasReachedFaceModelLimit = useMemo(() => {
    return faceModels.length >= maxFaceModels;
  }, [faceModels.length, maxFaceModels]);

  // Check if user is on the highest tier (Pro/Tier 3)
  const isOnHighestTier = useMemo(() => {
    if (!subscription?.plan_name || !subscriptionTiers) return false;
    const tier = subscriptionTiers.find(t => t.name === subscription.plan_name);
    // Pro tier has max_face_models: 8, which is the highest
    return tier?.max_face_models === 8;
  }, [subscription?.plan_name, subscriptionTiers]);

  // Determine what should happen when Create Face Model button is clicked
  const createFaceModelAction = useMemo(() => {
    // Check face model limits
    if (hasReachedFaceModelLimit) {
      if (isOnHighestTier) {
        return { type: 'limit_reached', message: 'Limit Reached' };
      } else {
        return { type: 'upgrade_subscription', message: 'Create'};
      }
    }
    
    // Check credits for paid training
    if (needsCreditsForTraining && !hasSufficientCredits) {
      return { type: 'credit_pack', message: 'Create', credits: faceModelTrainingCost };
    }

    // All checks passed - allow creation
    return { type: 'create', message: 'Create' };
  }, [
    hasReachedFaceModelLimit, 
    isOnHighestTier, 
    needsCreditsForTraining, 
    hasSufficientCredits, 
    faceModelTrainingCost
  ]);

  // Handle button click - either open popover or trigger guard function
  const handleButtonClick = useCallback(() => {
    if (shouldEnablePopover) {
      setIsPopoverOpen(true);
    } else {
      // Use credit guard to handle authentication and subscription flow
      creditGuard(() => {
        // This will only execute if user is authenticated and has subscription
        setIsPopoverOpen(true);
      })();
    }
  }, [shouldEnablePopover, creditGuard]);

  // Automatically select first model if none selected
  useEffect(() => {
    if (faceModels.length > 0 && !selectedModelId) {
      // Check for manual selection from localStorage
      try {
        const savedSelection = localStorage.getItem(`face-model-selection`);
        if (savedSelection) {
          const { modelId } = JSON.parse(savedSelection);
          if (faceModels.find(m => m.id === modelId)) {
            setSelectedModelId(modelId);
            onModelSelected?.(modelId);
            return;
          }
        }
      } catch (e) {
        // Invalid saved data, ignore
      }
      
      // Default to first model
      const firstModel = faceModels[0];
      setSelectedModelId(firstModel.id);
      onModelSelected?.(firstModel.id);
    }
  }, [faceModels, selectedModelId, onModelSelected]);

  // Auto refresh on external trigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setRefreshTriggerInternal(refreshTrigger);
    }
  }, [refreshTrigger]);

  // Fetch training job IDs for models in training/queued states
  const getTrainingJobIds = useCallback(async (models: FaceModelWithTraining[]) => {
    const trainingModels = models.filter(m => ['queued', 'training'].includes(m.status));
    if (trainingModels.length === 0) return {};

    const modelIds = trainingModels.map(m => m.id);
    const { data, error } = await supabase
      .from('training_jobs')
      .select('id, face_model_id')
      .in('face_model_id', modelIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch training job IDs:', error);
      return {};
    }

    // Create mapping of face_model_id -> training_job_id
    const mapping: Record<string, string> = {};
    data?.forEach(job => {
      if (!mapping[job.face_model_id]) { // Only take the most recent job
        mapping[job.face_model_id] = job.id;
      }
    });

    return mapping;
  }, [supabase]);

  // Fetch thumbnail URLs for models that have thumbnail_url
  const fetchThumbnailUrls = useCallback(async (models: FaceModelWithTraining[]) => {
    const modelsWithThumbnails = models.filter(m => m.thumbnail_url);
    if (modelsWithThumbnails.length === 0) return {};

    // Generate presigned URLs for thumbnails
    const urlPromises = modelsWithThumbnails.map(async (model) => {
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
        return urlMap;
      } catch (error) {
        console.warn('Failed to generate presigned URLs, using fallback avatars:', error);
        return {};
      }
    }

    return {};
  }, []);

  // Delete face model handler with confirmation
  const handleDeleteConfirm = useCallback(async (model: FaceModelWithTraining) => {
    if (!user?.id) return;
    
    setDeletingModelId(model.id);
    
    try {
      await deleteFaceModel(model.id, user.id);
      
      // Remove from local state immediately
      setFaceModels(prev => prev.filter(m => m.id !== model.id));
      
      // Clear selection if the deleted model was selected
      if (selectedModelId === model.id) {
        setSelectedModelId('');
      }
      
      // Trigger internal refresh to sync with server
      setRefreshTriggerInternal(prev => prev + 1);
      
    } catch (err) {
      console.error('Failed to delete face model:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete face model');
    } finally {
      setDeletingModelId(null);
    }
  }, [deleteFaceModel, selectedModelId, user?.id]);

  // Load face models
  const loadFaceModels = useCallback(async () => {
    if (!user?.id) {
      setFaceModels([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const models = await getUserFaceModels(user.id);
      
      // Filter out deleted models and transform to FaceModelWithTraining
      const validModels: FaceModelWithTraining[] = models
        .filter(model => model.status !== 'deleted')
        .map(model => ({
          id: model.id,
          name: model.name,
          status: model.status as 'queued' | 'training' | 'ready' | 'failed',
          user_id: model.user_id,
          training_job_id: undefined,
          created_at: model.created_at,
          image_count: model.image_count,
          thumbnail_url: (model as any).thumbnail_url
        }));
      
      setFaceModels(validModels);

      // Fetch training job IDs for queued/training models
      const jobIds = await getTrainingJobIds(validModels);
      setTrainingJobIds(jobIds);

      // Fetch thumbnail URLs for ready models
      const thumbnails = await fetchThumbnailUrls(validModels);
      setThumbnailUrls(thumbnails);

    } catch (err) {
      console.error('Failed to load face models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load face models');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getUserFaceModels, getTrainingJobIds, fetchThumbnailUrls]);

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
    setIsPopoverOpen(false); // Close popover when model is selected
    
    // Persist manual selection
    localStorage.setItem(`face-model-selection`, JSON.stringify({
    modelId: newModelId
    }));
    
    // Notify parent component
    onModelSelected?.(newModelId);
  }, [onModelSelected]);

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
  const handleTrainingComplete = useCallback((modelId: string, success?: boolean, errorMessage?: string) => {
    // Remove stale progress entry for this model
    setTrainingProgress(prev => {
      const { [modelId]: _removed, ...rest } = prev;
      return rest;
    });

    // Remove the training job ID as well since it's completed
    setTrainingJobIds(prev => {
      const { [modelId]: _removed, ...rest } = prev;
      return rest;
    });

    if (success === false) {
      // Training failed - update model status to failed and show error
      setFaceModels(prev => prev.map(m => (m.id === modelId ? { ...m, status: 'failed' } : m)));
      
      // Show error toast
      toast({
        title: t('faceModel.trainingError'),
        description: errorMessage || 'Face model training failed',
        variant: 'destructive'
      });
    } else {
      // Training completed successfully - optimistically set model status to ready
      setFaceModels(prev => prev.map(m => (m.id === modelId ? { ...m, status: 'ready' } : m)));
    }

    // Fetch fresh data to get the correct image count and confirm backend status
    setTimeout(() => {
      loadFaceModels();
    }, 1000); // Small delay to ensure backend has updated

  }, [loadFaceModels, toast, t]);

  // Function to open face model upload dialog
  const openFaceModelUploadDialog = useCallback(() => {
    dialogService.openDialog(
      <FaceModelUploadDialog 
        onComplete={(faceModelId) => {
          // Refresh the face models list when upload completes
          loadFaceModels();
          // Auto-select the newly created model
          setSelectedModelId(faceModelId);
          onModelSelected?.(faceModelId);
          // Invalidate subscription and credit queries to update training usage count and balance
          queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
          queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
        }}
      />
    );
  }, [dialogService, loadFaceModels, onModelSelected, queryClient]);

  // Handle Create Face Model button click with enhanced logic
  const handleCreateFaceModelClick = useCallback(() => {
    switch (createFaceModelAction.type) {
      case 'auth':
        // Use credit guard to handle authentication flow
        creditGuard(() => {
          // After authentication, the useMemo will recalculate and we'll get here again
          setIsPopoverOpen(false);
          openFaceModelUploadDialog();
        })();
        break;
      
      case 'subscription':
        setIsPopoverOpen(false);
        openSubscriptionDialog();
        break;
      
      case 'upgrade_subscription':
        setIsPopoverOpen(false);
        // Use enhanced subscription dialog with face model limit context
        openSubscriptionDialog({
          context: 'face-model-limit',
          currentPlan: subscription?.plan_name,
          showOnlyUpgrades: true,
          requiredFeature: 'max_face_models'
        });
        break;
      
      case 'credit_pack':
        setIsPopoverOpen(false);
        openCreditPackDialog(createFaceModelAction.credits);
        break;
      
      case 'limit_reached':
        // Do nothing - button should be disabled
        break;
      
      case 'create':
        setIsPopoverOpen(false);
        openFaceModelUploadDialog();
        break;
    }
  }, [createFaceModelAction, creditGuard, openFaceModelUploadDialog, openSubscriptionDialog, openCreditPackDialog, setIsPopoverOpen, subscription?.plan_name]);

  // Handle delete button click
  // Handle delete confirmation
  const handleDeleteClick = useCallback(async (e: React.MouseEvent, model: FaceModelWithTraining) => {
    e.stopPropagation(); // Prevent model selection
    
    const confirmed = await confirmationService.confirm({
      title: `Delete FaceModel '${model.name}'?`,
      description: `This can't be undone. ${needsCreditsForTraining ? `You have no included face model training left. Creating a new one will cost ${faceModelTrainingCost} credits.` : ''}`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'bin'
    });

    if (confirmed) {
      setIsPopoverOpen(false); // Close popover when deletion starts
      await handleDeleteConfirm(model);
    }
  }, [needsCreditsForTraining, faceModelTrainingCost, handleDeleteConfirm]);

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
    if (deletingModelId === model.id) {
      return 'Deleting...';
    }
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

  // Clean up training progress for models that are no longer training
  useEffect(() => {
    const readyModelIds = faceModels.filter(m => m.status === 'ready').map(m => m.id);
    if (readyModelIds.length > 0) {
      setTrainingProgress(prev => {
        const newProgress = { ...prev };
        readyModelIds.forEach(modelId => {
          delete newProgress[modelId];
        });
        return newProgress;
      });
    }
  }, [faceModels]);


  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {/* Hidden trackers that manage WebSocket connections */}
      {Object.entries(trainingJobIds)
        .filter(([modelId]) => {
          const model = faceModels.find(m => m.id === modelId);
          return model && ['queued', 'training'].includes(model.status);
        })
        .map(([modelId, jobId]) => (
          <ProgressTracker
            key={modelId}
            modelId={modelId}
            jobId={jobId}
            onProgressUpdate={handleProgressUpdate}
            onComplete={handleTrainingComplete}
          />
        ))}

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button className={styles.trigger} onClick={handleButtonClick}>
            <div className={styles.thumbnail}>
              {!user?.id ? (
                <div className={`${styles.createIcon} ${styles.modelThumbnail}`}>
                  <Plus className="w-4 h-4 text-white" />
                </div>
              ) : selectedModel ? (
                <div className={`${styles.modelThumbnail} ${deletingModelId === selectedModel.id ? 'opacity-50' : ''}`}>
                  {/* Show deleting state */}
                  {deletingModelId === selectedModel.id && (
                    <CircleProgress value={100} size={32} thickness={3} className="animate-spin" />
                  )}
                  {/* Show training/queued progress */}
                  {deletingModelId !== selectedModel.id && (selectedModel.status === 'training' || selectedModel.status === 'queued') && (
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
                {!user?.id ? "Create Model" : 
                 selectedModel ? 
                   (deletingModelId === selectedModel.id ? "Deleting..." : selectedModel.name) : 
                   "Select face model"}
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
            {isLoading ? (
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
              <div className={styles.modelOption}>
                <p>Add up to {maxFaceModels} Face Model{maxFaceModels !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              // Show face models for authenticated users with subscription
              faceModels.map((model) => (
                <div
                  key={model.id}
                  className={`${styles.modelOption} ${deletingModelId === model.id ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => deletingModelId !== model.id && handleModelSelected(model.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className={styles.modelThumbnailLarge} style={{ position: 'relative' }}>
                        {/* Show deleting state */}
                        {deletingModelId === model.id && (
                          <CircleProgress value={100} size={48} thickness={3} className="animate-spin" />
                        )}
                        {/* Show training/queued progress */}
                        {deletingModelId !== model.id && (model.status === 'training' || model.status === 'queued') && (
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
                        {/* Delete icon overlay - only show for non-training models */}
                        {model.status !== 'training' && 
                         deletingModelId !== model.id && (
                          <div 
                            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteClick(e, model)}
                          >
                            <Icon variant="bin" size={20} className="text-red-400" />
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

          <div className={styles.dropdownFooter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 120, textAlign: 'left', fontSize: 13, color: '#b6e3e2', fontWeight: 500 }}>
              {needsCreditsForTraining ? (
                <span>{faceModelTrainingCost} credits</span>
              ) : (
                <span>{remainingFaceModelTrainings} included in plan</span>
              )}
            </div>
            <Button 
              variant="ghost" 
              className={styles.dropdownFooterButton} 
              onClick={handleCreateFaceModelClick}
              disabled={createFaceModelAction.type === 'limit_reached'}
            >
              {createFaceModelAction.message}
            </Button>
          </div>
        </PopoverContent>
      </Popover>



      {selectedModel && 
       selectedModel.status !== 'ready' && 
       ['queued', 'training'].includes(selectedModel.status || '') && (
        <div className="flex space-x-1">
          <div className="text-sm">
            {selectedModel.status === 'queued' && (
              <span className="text-yellow-400">Queued</span>
            )}
            {selectedModel.status === 'training' && (
              trainingProgress[selectedModel.id]?.progress && 
              trainingProgress[selectedModel.id].progress.message !== 'Training completed successfully' ? (
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