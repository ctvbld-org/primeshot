import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

export interface TrainingProgressPacket {
  job_id: string;
  progress: number; // percentage 0-100
  message: string;
  timestamp: number;
  estimated_remaining: number; // seconds
  elapsed_time: number; // seconds
  phase: string;
  status: 'running' | 'completed' | 'failed';
  total_estimated_duration: number;
  error_message?: string;
}

interface UseTrainingProgressParams {
  /** Job identifier used by the backend. */
  jobId: string;
  /** Root URL that returns a working WebSocket when appended with `/ws/progress/${jobId}`. */
  websocketUrl: string;
  /** Called when status becomes `completed` or `failed`. */
  onComplete?: (success: boolean, error?: string) => void;
  /** Called when an unrecoverable error occurs. */
  onError?: (error: string) => void;
}

export function useTrainingProgress({
  jobId,
  websocketUrl,
  onComplete,
  onError,
}: UseTrainingProgressParams) {
  // Build full ws URL lazily – if jobId or url missing we return null and hook will idle.
  const wsUrl = jobId && websocketUrl ? `${websocketUrl}/ws/progress/${jobId}` : null;

  const {
    isConnected,
    isConnecting,
    error: connectionError,
    lastMessage,
    reconnect,
  } = useWebSocket(wsUrl);

  // Simply store the latest valid progress packet
  const [progress, setProgress] = useState<TrainingProgressPacket | null>(null);

  // Track latest timestamp to prevent old packets
  const latestTimestampRef = useRef<number>(0);

  // —— Parse incoming messages ——
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const data: TrainingProgressPacket = JSON.parse(lastMessage.data);
      const incomingTs = data.timestamp ?? 0;

      // Only accept packets with newer timestamps
      if (incomingTs <= latestTimestampRef.current) {
        return;
      }

      // Update timestamp guard and set progress
      latestTimestampRef.current = incomingTs;
      setProgress(data);

      // Handle completion
      if (data.status === 'completed') {
        onComplete?.(true);
      } else if (data.status === 'failed') {
        onComplete?.(false, data.error_message);
      }
    } catch (err) {
      console.error('Failed to parse progress packet', err);
      onError?.('Failed to parse progress data');
    }
  }, [lastMessage, onComplete, onError]);

  // ————— Helper formatters —————
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const getProgressPercentage = useCallback(() => progress?.progress ?? 0, [progress]);

  const getEstimatedTimeRemaining = useCallback(() => {
    const secs = progress?.estimated_remaining;
    if (secs === undefined || secs === null) return 'Calculating...';
    //if (secs <= 0) return 'Finishing up...';
    return formatTime(secs);
  }, [progress?.estimated_remaining, formatTime]);

  const getElapsedTime = useCallback(() => {
    if (!progress?.elapsed_time) return '0s';
    return formatTime(progress.elapsed_time);
  }, [progress, formatTime]);

  const getLiveCountdownSeconds = useCallback(
    () => progress?.estimated_remaining ?? 0,
    [progress?.estimated_remaining]
  );

  return {
    progress,
    isConnected,
    isConnecting,
    connectionError,
    reconnect,
    getProgressPercentage,
    getEstimatedTimeRemaining,
    getElapsedTime,
    getLiveCountdownSeconds,
  };
} 