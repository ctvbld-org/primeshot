'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocketProgress } from '@/hooks/useWebSocketProgress';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingProgressCardProps {
  jobId: string;
  userId: string;
  faceModelName: string;
  initialStatus?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function TrainingProgressCard({
  jobId,
  userId,
  faceModelName,
  initialStatus,
  onComplete,
  onError,
  className
}: TrainingProgressCardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Only connect to WebSocket for jobs that might still be active
  const shouldConnectWebSocket = !initialStatus || ['queued', 'running'].includes(initialStatus);
  
  // Debug logging for WebSocket connection decision
  useEffect(() => {
    console.log(`🔍 Training Progress Card for job ${jobId}:`, {
      initialStatus,
      shouldConnectWebSocket,
      websocketUrl: process.env.NEXT_PUBLIC_TRAINING_WEBSOCKET_URL
    });
  }, [jobId, initialStatus, shouldConnectWebSocket]);

  const {
    progress,
    isConnected,
    connectionError,
    reconnect,
    getProgressPercentage,
    getEstimatedTimeRemaining,
    getElapsedTime
  } = useWebSocketProgress({
    jobId: shouldConnectWebSocket ? jobId : '', // Empty jobId prevents connection
    websocketUrl: process.env.NEXT_PUBLIC_TRAINING_WEBSOCKET_URL || '',
    onComplete: (success, error) => {
      if (success) {
        onComplete?.();
      } else {
        onError?.(new Error(error || 'Training failed'));
      }
      setLastUpdate(new Date());
    },
    onError: (error) => {
      onError?.(new Error(error));
    }
  });

  // Update last update time when progress changes
  useEffect(() => {
    if (progress) {
      setLastUpdate(new Date());
    }
  }, [progress]);

  // Get status from WebSocket data or use initial status from database
  const status = progress?.status || initialStatus || 'queued';
  const currentProgress = getProgressPercentage();
  const estimatedRemaining = getEstimatedTimeRemaining();
  const elapsedTime = getElapsedTime();

  // Get progress message from WebSocket data
  const getProgressMessage = (): string => {
    if (progress?.message) {
      return progress.message;
    }
    
    // Fallback based on status if no message available
    switch (status) {
      case 'queued': return 'Waiting in queue...';
      case 'running': return 'Training in progress...';
      case 'completed': return 'Training completed!';
      case 'failed': return 'Training failed';
      default: return 'Processing...';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'queued': return 'secondary';
      case 'running': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'running': return 'Training';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getConnectionState = () => {
    if (connectionError) return 'disconnected';
    if (!isConnected) return 'reconnecting';
    return 'connected';
  };

  const handleRetry = () => {
    reconnect();
  };

  // Show loading state if no progress data yet and no connection error
  if (!progress && !connectionError) {
    return (
      <Card className={cn('p-4', className)}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-sm text-muted-foreground">Connecting to training...</p>
        </CardContent>
      </Card>
    );
  }

  // Show error state if connection failed and no progress data
  if (connectionError && !progress) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-3" />
            <div>
              <h3 className="font-medium">Failed to connect to training</h3>
              <p className="text-sm text-muted-foreground">{connectionError}</p>
            </div>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const connectionState = getConnectionState();

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Training: {faceModelName}
            </CardTitle>
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant={getStatusVariant(status)} className="flex items-center">
                {status === 'running' && <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1"></div>}
                {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                {getStatusDisplay(status)}
              </Badge>
              <div className="flex items-center">
                {connectionState === 'connected' && (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                {connectionState === 'disconnected' && (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                {connectionState === 'reconnecting' && (
                  <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {getProgressMessage()}
            </span>
            <span className="font-medium">
              {Math.round(currentProgress)}%
            </span>
          </div>
          
          <Progress 
            value={currentProgress} 
            className="h-2"
          />
          
          {/* Enhanced step information for training phase */}
          {status === 'running' && progress?.phase && (
            <div className="text-xs text-muted-foreground">
              <span>Phase: {progress.phase}</span>
            </div>
          )}
        </div>

        {/* Time Section */}
        {status === 'running' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-medium">{estimatedRemaining}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Elapsed:</span>
              <span className="font-medium">{elapsedTime}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'failed' && progress?.error_message && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{progress.error_message}</span>
          </div>
        )}

        {/* Success Message */}
        {status === 'completed' && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <span className="text-sm text-green-700">Training completed successfully!</span>
              {progress?.elapsed_time && (
                <div className="text-xs text-green-600 mt-1">
                  Total time: {elapsedTime}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          
          {connectionState === 'disconnected' && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 