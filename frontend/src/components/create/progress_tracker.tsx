import React, { useEffect } from 'react';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';

export interface ProgressTrackerProps {
  modelId: string;
  jobId: string;
  onProgressUpdate: (
    modelId: string,
    data: {
      progress: any;
      isConnected: boolean;
      isConnecting: boolean;
      error: string | null;
      getProgressPercentage: () => number;
      getEstimatedTimeRemaining: () => string;
      getLiveCountdownSeconds: () => number;
    }
  ) => void;
  onComplete: (modelId: string) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  modelId,
  jobId,
  onProgressUpdate,
  onComplete,
}) => {
  const {
    progress,
    isConnected,
    isConnecting,
    connectionError,
    getProgressPercentage,
    getEstimatedTimeRemaining,
    getLiveCountdownSeconds,
  } = useTrainingProgress({
    jobId,
    websocketUrl: process.env.NEXT_PUBLIC_TRAINING_WEBSOCKET_URL || '',
    onComplete: () => {
      onComplete(modelId);
    },
    onError: (error) => {
      console.error(`WebSocket error for face model ${modelId}:`, error);
    },
  });

  // Report progress to parent
  useEffect(() => {
    onProgressUpdate(modelId, {
      progress,
      isConnected,
      isConnecting,
      error: connectionError ? String(connectionError) : null,
      getProgressPercentage,
      getEstimatedTimeRemaining,
      getLiveCountdownSeconds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, isConnected, isConnecting, connectionError]);

  return null;
}; 