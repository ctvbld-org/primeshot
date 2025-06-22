import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketTrainingProgress {
  job_id: string;
  progress: number;
  message: string;
  timestamp: number;
  estimated_remaining: number;
  elapsed_time: number;
  phase: string;
  status: 'running' | 'completed' | 'failed';
  total_estimated_duration: number;
  error_message?: string;
}

interface UseWebSocketProgressProps {
  jobId: string;
  websocketUrl: string;
  onComplete?: (success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}

export function useWebSocketProgress({
  jobId,
  websocketUrl,
  onComplete,
  onError,
}: UseWebSocketProgressProps) {
  const [progress, setProgress] = useState<WebSocketTrainingProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [liveEstimatedRemaining, setLiveEstimatedRemaining] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  
  // Use refs for callbacks to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const connectionStartTimeRef = useRef<number>(0);

  // Update callback refs when props change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  });

  // Update live countdown when WebSocket data changes
  useEffect(() => {
    if (progress?.estimated_remaining !== undefined) {
      setLiveEstimatedRemaining(progress.estimated_remaining);
    }
  }, [progress?.estimated_remaining, jobId]);

  // Live countdown timer - decrements every second
  useEffect(() => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Start countdown if we have a valid remaining time, are connected, and training is running
    if (liveEstimatedRemaining !== null && 
        liveEstimatedRemaining > 0 && 
        isConnected && 
        progress?.status === 'running') {
      
      countdownIntervalRef.current = setInterval(() => {
        setLiveEstimatedRemaining(prev => {
          if (prev === null || prev <= 0) {
            return 0;
          }
          const newValue = prev - 1;
          if (newValue <= 0) {
            return 0;
          }
          return newValue;
        });
      }, 1000);

    }

    // Cleanup function
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [liveEstimatedRemaining, isConnected, progress?.status, jobId]);

  const connect = useCallback(() => {
    // Don't connect if no jobId or websocketUrl
    if (!jobId || !websocketUrl) {
      console.log('WebSocket connection skipped: missing jobId or websocketUrl', { jobId, websocketUrl });
      return;
    }

    // Prevent multiple simultaneous connections
    if (isConnectingRef.current) {
      console.log(`🔄 Connection already in progress for job ${jobId}, skipping...`);
      return;
    }

    // Don't connect if component is unmounted
    if (!isMountedRef.current) {
      console.log(`🚫 Component unmounted, skipping connection for job ${jobId}`);
      return;
    }

    isConnectingRef.current = true;
    connectionStartTimeRef.current = Date.now();

    // Clean up existing connection
    if (wsRef.current) {
      console.log(`🧹 Cleaning up existing connection for job ${jobId}`);
      wsRef.current.close(1000, 'Reconnecting');
      wsRef.current = null;
    }

    try {
      const wsUrl = `${websocketUrl}/ws/progress/${jobId}`;
      console.log(`🔗 Attempting WebSocket connection for job ${jobId}: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          console.log(`🚫 Component unmounted during connection for job ${jobId}, closing...`);
          ws.close(1000, 'Component unmounted');
          return;
        }

        console.log(`✅ WebSocket connected for job: ${jobId}`);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const progressData: WebSocketTrainingProgress = JSON.parse(event.data);
          
          setProgress(progressData);

          // Handle completion using refs to avoid dependency issues
          if (progressData.status === 'completed') {
            onCompleteRef.current?.(true);
          } else if (progressData.status === 'failed') {
            console.log(`❌ Training failed for job ${jobId}:`, progressData.error_message);
            onCompleteRef.current?.(false, progressData.error_message);
          }
        } catch (error) {
          console.error(`❌ Error parsing WebSocket message for job ${jobId}:`, error);
          onErrorRef.current?.(`Failed to parse progress data: ${error}`);
        }
      };

      ws.onclose = (event) => {
        const connectionDuration = Date.now() - connectionStartTimeRef.current;
        console.log(`🔌 WebSocket closed for job ${jobId}`, {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          connectionDuration: `${connectionDuration}ms`
        });
        
        setIsConnected(false);
        isConnectingRef.current = false;
        wsRef.current = null;

        // Don't reconnect if component is unmounted
        if (!isMountedRef.current) {
          console.log(`🚫 Component unmounted, not reconnecting for job ${jobId}`);
          return;
        }

        // Only reconnect for specific error codes and if we haven't exceeded max attempts
        const shouldReconnect = event.code !== 1000 && // Not a normal close
                               event.code !== 1001 && // Not going away
                               event.code !== 1005 && // No status code
                               reconnectAttempts.current < maxReconnectAttempts &&
                               connectionDuration > 500; // Only reconnect if connection lasted more than 500ms

        if (shouldReconnect) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reconnecting to job ${jobId} in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              reconnectAttempts.current++;
              connect();
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log(`⚠️ Maximum reconnection attempts reached for job ${jobId}`);
          setConnectionError('Maximum reconnection attempts reached');
          onErrorRef.current?.('Connection lost and could not reconnect');
        } else if (connectionDuration <= 500) {
          console.log(`⚠️ Connection closed too quickly (${connectionDuration}ms), not reconnecting for job ${jobId}`);
          setConnectionError('Connection unstable');
          onErrorRef.current?.('Connection is unstable');
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for job ${jobId}:`, {
          error,
          readyState: ws.readyState,
          url: ws.url,
          timestamp: new Date().toISOString()
        });
        
        isConnectingRef.current = false;
        setConnectionError('WebSocket connection error');
      };

    } catch (error) {
      console.error(`❌ Failed to create WebSocket connection for job ${jobId}:`, error);
      isConnectingRef.current = false;
      setConnectionError(`Failed to connect: ${error}`);
      onErrorRef.current?.(`Connection failed: ${error}`);
    }
  }, [jobId, websocketUrl]); // Remove callback dependencies

  // Connect on mount and when jobId/websocketUrl change
  useEffect(() => {
    isMountedRef.current = true;
    
    if (jobId && websocketUrl) {
      console.log(`🚀 Initializing WebSocket for job ${jobId}`);
      connect();
    } else {
      console.log(`⏭️ Skipping WebSocket connection - jobId: ${jobId}, websocketUrl: ${websocketUrl}`);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log(`🧹 Cleaning up WebSocket for job ${jobId}`);
      isMountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      
      isConnectingRef.current = false;
    };
  }, [jobId, websocketUrl]); // Only depend on job parameters, not connect function

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log(`🔄 Manual reconnect requested for job ${jobId}`);
    reconnectAttempts.current = 0;
    setConnectionError(null);
    
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    connect();
  }, [connect]);

  // Utility functions for progress display
  const getFormattedTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    return progress?.progress || 0;
  }, [progress]);

  const getEstimatedTimeRemaining = useCallback(() => {
    // Use live countdown if available, fallback to static WebSocket value
    const timeToUse = liveEstimatedRemaining !== null ? liveEstimatedRemaining : progress?.estimated_remaining;
    
    if (timeToUse === undefined || timeToUse === null) return 'Calculating...';
    if (timeToUse <= 0) return 'Finishing up...';
    
    return getFormattedTime(timeToUse);
  }, [liveEstimatedRemaining, progress?.estimated_remaining, getFormattedTime]);

  const getElapsedTime = useCallback(() => {
    if (!progress?.elapsed_time) return '0s';
    return getFormattedTime(progress.elapsed_time);
  }, [progress, getFormattedTime]);

  const getLiveCountdownSeconds = useCallback(() => {
    return liveEstimatedRemaining !== null ? liveEstimatedRemaining : progress?.estimated_remaining || 0;
  }, [liveEstimatedRemaining, progress?.estimated_remaining]);

  return {
    progress,
    isConnected,
    connectionError,
    reconnect,
    getProgressPercentage,
    getEstimatedTimeRemaining,
    getElapsedTime,
    getFormattedTime,
    getLiveCountdownSeconds,
    liveEstimatedRemaining,
  };
} 