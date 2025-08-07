/**
 * Centralized Job Progress Hook
 * 
 * Replaces useTrainingProgress with a unified hook that can handle both
 * training and inference jobs through the centralized WebSocket manager.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketManager, type JobProgressData } from '@/lib/websocket/connection-manager';

type JobType = 'training' | 'inference';

export interface UseJobProgressParams {
  jobId: string;
  jobType: JobType;
  onComplete?: (success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}

export interface UseJobProgressResult {
  // Progress data
  progress: JobProgressData | null;
  
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Basic helper functions
  getProgressPercentage: () => number;
  getEstimatedTimeRemaining: () => string;
  getLiveCountdownSeconds: () => number;
  
  // Enhanced helper functions
  isCompleted: () => boolean;
  isFailed: () => boolean;
  isRunning: () => boolean;
  isQueued: () => boolean;
  getCurrentPhase: () => string;
  getStatusMessage: () => string;
  
  // Actions
  reconnect: () => void;
}

export function useJobProgress({
  jobId,
  jobType,
  onComplete,
  onError,
}: UseJobProgressParams): UseJobProgressResult {
  const [progress, setProgress] = useState<JobProgressData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const latestTimestampRef = useRef<number>(0);

  // Store stable references to callback functions
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Subscribe to job progress when jobId or jobType changes
  useEffect(() => {
    if (!jobId || !jobType) return;

    console.log(`🔌 useJobProgress: Subscribing to ${jobType} job ${jobId}`);

    const subscriptionId = webSocketManager.subscribe(jobId, jobType, {
      onProgress: (data: JobProgressData) => {
        // Only accept packets with newer timestamps to prevent old data
        const incomingTs = data.timestamp ?? 0;
        if (incomingTs <= latestTimestampRef.current) {
          return;
        }

        latestTimestampRef.current = incomingTs;
        setProgress(data);
      },
      onComplete: (success: boolean, error?: string) => {
        console.log(`✅ useJobProgress: Job ${jobId} completed (success: ${success})`);
        onCompleteRef.current?.(success, error);
      },
      onError: (error: string) => {
        console.error(`❌ useJobProgress: Job ${jobId} error:`, error);
        onErrorRef.current?.(error);
      },
    });

    subscriptionIdRef.current = subscriptionId;

    // Get initial data if available
    const initialData = webSocketManager.getLatestProgress(jobId, jobType);
    if (initialData) {
      setProgress(initialData);
      latestTimestampRef.current = initialData.timestamp ?? 0;
    }

    return () => {
      if (subscriptionIdRef.current) {
        console.log(`🔌 useJobProgress: Unsubscribing from ${jobType} job ${jobId}`);
        webSocketManager.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [jobId, jobType]); // REMOVED onComplete, onError from dependencies

  // Update connection status via event-driven approach (no polling)
  useEffect(() => {
    if (!jobId || !jobType) return;

    const updateStatus = () => {
      const status = webSocketManager.getConnectionStatus(jobId, jobType);
      setConnectionStatus(status);
    };

    const statusListener = (status: string, error?: string) => {
      setConnectionStatus({
        isConnected: status === 'connected',
        isConnecting: status === 'connecting' || status === 'reconnecting',
        error: error || (status === 'error' ? 'Connection error' : null),
      });
    };

    // Initial status
    updateStatus();

    // Subscribe to status changes
    webSocketManager.onStatusChange(jobId, jobType, statusListener);

    return () => {
      webSocketManager.offStatusChange(jobId, jobType, statusListener);
    };
  }, [jobId, jobType]);

  // Helper functions with enhanced capabilities
  const getProgressPercentage = useCallback(() => {
    return progress?.progress ?? 0;
  }, [progress]);

  const getEstimatedTimeRemaining = useCallback(() => {
    if (!progress?.estimated_remaining) return '';
    
    const seconds = progress.estimated_remaining;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, [progress]);

  const getLiveCountdownSeconds = useCallback(() => {
    if (!progress?.estimated_remaining || !progress?.timestamp) return 0;
    
    const now = Date.now() / 1000;
    const elapsed = now - progress.timestamp;
    const remaining = Math.max(0, progress.estimated_remaining - elapsed);
    
    return Math.floor(remaining);
  }, [progress]);

  // Enhanced helper functions
  const isCompleted = useCallback(() => {
    return progress?.status === 'completed';
  }, [progress]);

  const isFailed = useCallback(() => {
    return progress?.status === 'failed';
  }, [progress]);

  const isRunning = useCallback(() => {
    return progress?.status === 'running';
  }, [progress]);

  const isQueued = useCallback(() => {
    return progress?.status === 'queued';
  }, [progress]);

  const getCurrentPhase = useCallback(() => {
    return progress?.phase || 'unknown';
  }, [progress]);

  const getStatusMessage = useCallback(() => {
    if (!progress) return 'Connecting...';
    
    switch (progress.status) {
      case 'queued': return 'Queued for processing';
      case 'running': return progress.message || 'Processing...';
      case 'completed': return 'Completed successfully';
      case 'failed': return progress.error_message || 'Failed';
      default: return progress.message || 'Unknown status';
    }
  }, [progress]);

  const reconnect = useCallback(() => {
    if (jobId && jobType) {
      webSocketManager.reconnect(jobId, jobType);
    }
  }, [jobId, jobType]);

  // Input validation
  useEffect(() => {
    if (!jobId || !jobType) {
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Invalid jobId or jobType provided'
      }));
    }
  }, [jobId, jobType]);

  return {
    progress,
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    connectionError: connectionStatus.error,
    
    // Basic helpers
    getProgressPercentage,
    getEstimatedTimeRemaining,
    getLiveCountdownSeconds,
    
    // Enhanced helpers
    isCompleted,
    isFailed,
    isRunning,
    isQueued,
    getCurrentPhase,
    getStatusMessage,
    
    // Actions
    reconnect,
  };
}

// Backward compatibility: Training-specific hook
export function useTrainingProgress(params: {
  jobId: string;
  websocketUrl?: string; // Ignored - now handled by manager
  onComplete?: (success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}) {
  return useJobProgress({
    jobId: params.jobId,
    jobType: 'training',
    onComplete: params.onComplete,
    onError: params.onError,
  });
}

// New: Inference-specific hook
export function useInferenceProgress(params: {
  jobId: string;
  onComplete?: (success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}) {
  return useJobProgress({
    jobId: params.jobId,
    jobType: 'inference',
    onComplete: params.onComplete,
    onError: params.onError,
  });
}
