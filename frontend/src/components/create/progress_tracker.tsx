import React, { useEffect } from 'react';
import { useWebSocketProgress } from '@/hooks/useWebSocketProgress';

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
  onComplete: () => void;
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
  } = useWebSocketProgress({
    jobId,
    websocketUrl: process.env.NEXT_PUBLIC_TRAINING_WEBSOCKET_URL || '',
    onComplete: () => {
      onComplete();
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

  // Emit countdown updates every second while running
  useEffect(() => {
    if (!progress || progress.status !== 'running') return;

    const interval = setInterval(() => {
      onProgressUpdate(modelId, {
        progress,
        isConnected,
        isConnecting,
        error: connectionError ? String(connectionError) : null,
        getProgressPercentage,
        getEstimatedTimeRemaining,
        getLiveCountdownSeconds,
      });
    }, 1000);

    return () => clearInterval(interval);
    // We intentionally omit deps to keep interval stable; updates come via above effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.status]);

  return null;
}; 