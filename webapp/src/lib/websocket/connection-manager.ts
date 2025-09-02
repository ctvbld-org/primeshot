/**
 * Centralized WebSocket Connection Manager
 * 
 * Manages WebSocket connections for training and inference jobs, preventing
 * duplicate connections and providing a single source of truth for job progress.
 */

type JobType = 'training' | 'inference';

export interface JobProgressData {
  job_id: string;
  job_type: JobType;
  progress: number;
  message: string;
  timestamp: number;
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed' | 'closed' | 'image_completed';
  estimated_remaining?: number;
  elapsed_time?: number;
  phase?: string;
  error_message?: string;
  final_image_url?: string;
  image_index?: number;
  [key: string]: any;
}

export interface JobSubscription {
  id: string;
  jobId: string;
  jobType: JobType;
  onProgress: (data: JobProgressData) => void;
  onComplete: (success: boolean, error?: string) => void;
  onError: (error: string) => void;
}

interface WebSocketConnection {
  websocket: WebSocket;
  jobId: string;
  jobType: JobType;
  url: string;
  subscriptions: Set<string>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isConnecting: boolean;
  isConnected: boolean;
  lastData: JobProgressData | null;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
type StatusChangeListener = (status: ConnectionStatus, error?: string) => void;

class WebSocketConnectionManager {
  private connections = new Map<string, WebSocketConnection>(); // Key: ${jobId}-${jobType}
  private subscriptions = new Map<string, JobSubscription>();
  private subscriptionsByJob = new Map<string, Set<string>>(); // Key: ${jobId}-${jobType}, Value: Set of subscription IDs
  private statusListeners = new Map<string, Set<StatusChangeListener>>(); // Key: ${jobId}-${jobType}
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 1000; // 1 second
  private pendingCloseTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly closeGraceMs = 2000; // Grace period before closing when last subscriber leaves

  /**
   * Subscribe to job progress updates
   */
  subscribe(
    jobId: string,
    jobType: JobType,
    callbacks: {
      onProgress: (data: JobProgressData) => void;
      onComplete: (success: boolean, error?: string) => void;
      onError: (error: string) => void;
    }
  ): string {
    // Input validation
    if (!jobId || !jobType) {
      const error = 'Invalid jobId or jobType provided';
      callbacks.onError(error);
      throw new Error(error);
    }

    if (!this.getWebSocketUrl(jobType)) {
      const error = `No WebSocket URL configured for ${jobType} jobs`;
      callbacks.onError(error);
      throw new Error(error);
    }

    const jobKey = this.getJobKey(jobId, jobType);
    
    // Check if we already have too many subscriptions for this job (safety check)
    const existingSubsForJob = this.subscriptionsByJob.get(jobKey) || new Set();
    
    if (existingSubsForJob.size > 10) {
      console.warn(`📡 WebSocket Manager: Too many subscriptions for ${jobType} job ${jobId}, cleaning up old ones`);
      // Clean up old subscriptions to prevent memory leaks
      const subsToRemove = Array.from(existingSubsForJob).slice(0, -5);
      subsToRemove.forEach(subId => this.unsubscribe(subId));
    }
    
    const subscriptionId = `${jobId}-${jobType}-${Date.now()}-${Math.random()}`;
    
    const subscription: JobSubscription = {
      id: subscriptionId,
      jobId,
      jobType,
      onProgress: callbacks.onProgress,
      onComplete: callbacks.onComplete,
      onError: callbacks.onError,
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    // Track subscription by job
    if (!this.subscriptionsByJob.has(jobKey)) {
      this.subscriptionsByJob.set(jobKey, new Set());
    }
    this.subscriptionsByJob.get(jobKey)!.add(subscriptionId);

    // New subscriber – keep connection alive if a close was pending
    this.cancelPendingClose(jobKey);

    // Create or reuse WebSocket connection
    this.ensureConnection(jobId, jobType);

    // Send latest data if available
    const connection = this.connections.get(jobKey);
    if (connection?.lastData) {
      callbacks.onProgress(connection.lastData);
    }

    const currentSubCount = this.subscriptionsByJob.get(jobKey)?.size || 0;
    console.log(`📡 WebSocket Manager: Subscribed to ${jobType} job ${jobId} (subscription: ${subscriptionId}) - Total subs for job: ${currentSubCount}`);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from job progress updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    const { jobId, jobType } = subscription;
    const jobKey = this.getJobKey(jobId, jobType);

    this.subscriptions.delete(subscriptionId);
    
    // Remove from job subscription tracking
    const jobSubs = this.subscriptionsByJob.get(jobKey);
    if (jobSubs) {
      jobSubs.delete(subscriptionId);
      if (jobSubs.size === 0) {
        this.subscriptionsByJob.delete(jobKey);
      }
    }

    const connection = this.connections.get(jobKey);
    if (connection) {
      connection.subscriptions.delete(subscriptionId);
      
      // If no more subscriptions, schedule a grace close
      if (connection.subscriptions.size === 0) {
        this.cancelPendingClose(jobKey);
        const timer = setTimeout(() => {
          // If still no subscribers after grace period, close
          const stillNoSubs = this.connections.get(jobKey)?.subscriptions.size === 0;
          if (stillNoSubs) {
            this.closeConnection(jobKey);
          }
        }, this.closeGraceMs);
        this.pendingCloseTimers.set(jobKey, timer);
      }
    }

    console.log(`📡 WebSocket Manager: Unsubscribed from ${jobType} job ${jobId} (subscription: ${subscriptionId})`);
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(jobId: string, jobType: JobType, listener: StatusChangeListener): void {
    const jobKey = this.getJobKey(jobId, jobType);
    if (!this.statusListeners.has(jobKey)) {
      this.statusListeners.set(jobKey, new Set());
    }
    this.statusListeners.get(jobKey)!.add(listener);
  }

  /**
   * Unsubscribe from connection status changes
   */
  offStatusChange(jobId: string, jobType: JobType, listener: StatusChangeListener): void {
    const jobKey = this.getJobKey(jobId, jobType);
    const listeners = this.statusListeners.get(jobKey);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.statusListeners.delete(jobKey);
      }
    }
  }

  /**
   * Generate job key for avoiding collisions between training and inference
   */
  private getJobKey(jobId: string, jobType: JobType): string {
    return `${jobId}-${jobType}`;
  }

  /**
   * Get connection status for a job
   */
  getConnectionStatus(jobId: string, jobType: JobType): {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
  } {
    const jobKey = this.getJobKey(jobId, jobType);
    const connection = this.connections.get(jobKey);
    
    if (!connection) {
      return { isConnected: false, isConnecting: false, error: null };
    }

    return {
      isConnected: connection.isConnected,
      isConnecting: connection.isConnecting,
      error: connection.reconnectAttempts >= connection.maxReconnectAttempts 
        ? 'Connection failed after maximum retry attempts' 
        : null
    };
  }

  /**
   * Force reconnect for a job
   */
  reconnect(jobId: string, jobType: JobType): void {
    const jobKey = this.getJobKey(jobId, jobType);
    const connection = this.connections.get(jobKey);
    if (connection) {
      connection.reconnectAttempts = 0;
      this.emitStatusChange(jobKey, 'reconnecting');
      this.closeConnection(jobKey);
      this.ensureConnection(jobId, jobType);
    }
  }

  /**
   * Get latest progress data for a job
   */
  getLatestProgress(jobId: string, jobType: JobType): JobProgressData | null {
    const jobKey = this.getJobKey(jobId, jobType);
    return this.connections.get(jobKey)?.lastData || null;
  }

  /**
   * Clean up all connections (for app shutdown)
   */
  cleanup(): void {
    for (const jobKey of this.connections.keys()) {
      this.closeConnection(jobKey);
    }
    this.subscriptions.clear();
    this.subscriptionsByJob.clear();
    this.statusListeners.clear();
    console.log('📡 WebSocket Manager: Cleaned up all connections');
  }

  private ensureConnection(jobId: string, jobType: JobType): void {
    const jobKey = this.getJobKey(jobId, jobType);
    
    if (this.connections.has(jobKey)) {
      // Add ALL subscription IDs for this job to existing connection (fixed bug)
      const connection = this.connections.get(jobKey)!;
      const jobSubs = this.subscriptionsByJob.get(jobKey);
      if (jobSubs) {
        for (const subId of jobSubs) {
          connection.subscriptions.add(subId);
        }
      }
      return;
    }

    this.createConnection(jobId, jobType);
  }

  /**
   * Emit status change to listeners
   */
  private emitStatusChange(jobKey: string, status: ConnectionStatus, error?: string): void {
    const listeners = this.statusListeners.get(jobKey);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(status, error);
        } catch (err) {
          console.error('Error in status change listener:', err);
        }
      }
    }
  }

  private cancelPendingClose(jobKey: string): void {
    const timer = this.pendingCloseTimers.get(jobKey);
    if (timer) {
      clearTimeout(timer);
      this.pendingCloseTimers.delete(jobKey);
    }
  }

  private createConnection(jobId: string, jobType: JobType): void {
    const baseUrl = this.getWebSocketUrl(jobType);
    if (!baseUrl) {
      const error = `No WebSocket URL configured for ${jobType}`;
      console.error(`📡 WebSocket Manager: ${error}`);
      // Notify all subscribers of the error
      const jobKey = this.getJobKey(jobId, jobType);
      const jobSubs = this.subscriptionsByJob.get(jobKey);
      if (jobSubs) {
        for (const subId of jobSubs) {
          const subscription = this.subscriptions.get(subId);
          if (subscription) {
            subscription.onError(error);
          }
        }
      }
      return;
    }

    // Add delay for inference jobs to allow Modal container to start
    const delay = jobType === 'inference' ? 3000 : 0; // 3 second delay for inference
    
    if (delay > 0) {
      console.log(`📡 WebSocket Manager: Delaying connection for ${jobType} job ${jobId} by ${delay}ms to allow Modal startup`);
      setTimeout(() => {
        this.createConnectionNow(jobId, jobType, baseUrl);
      }, delay);
    } else {
      this.createConnectionNow(jobId, jobType, baseUrl);
    }
  }

  private createConnectionNow(jobId: string, jobType: JobType, baseUrl: string): void {
    const url = `${baseUrl}/ws/progress/${jobId}`;
    const jobKey = this.getJobKey(jobId, jobType);
    
    console.log(`📡 WebSocket Manager: Creating connection for ${jobType} job ${jobId} at ${url}`);

    const connection: WebSocketConnection = {
      websocket: new WebSocket(url),
      jobId,
      jobType,
      url,
      subscriptions: new Set(),
      reconnectAttempts: 0,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnecting: true,
      isConnected: false,
      lastData: null,
    };

    // Add ALL subscription IDs for this job (fixed bug)
    const jobSubs = this.subscriptionsByJob.get(jobKey);
    if (jobSubs) {
      for (const subId of jobSubs) {
        connection.subscriptions.add(subId);
      }
    }

    this.connections.set(jobKey, connection);
    this.emitStatusChange(jobKey, 'connecting');
    this.setupWebSocketEvents(connection);
    
    // Set a connection timeout for inference jobs (Modal containers can be slow)
    const connectionTimeout = jobType === 'inference' ? 30000 : 10000; // 30s for inference, 10s for training
    setTimeout(() => {
      if (connection.isConnecting && !connection.isConnected) {
        console.warn(`📡 WebSocket Manager: Connection timeout for ${jobType} job ${jobId} after ${connectionTimeout}ms`);
        connection.websocket.close();
      }
    }, connectionTimeout);
  }

  private setupWebSocketEvents(connection: WebSocketConnection): void {
    const { websocket, jobId, jobType } = connection;
    const jobKey = this.getJobKey(jobId, jobType);

    websocket.onopen = () => {
      console.log(`📡 WebSocket Manager: Connected to ${jobType} job ${jobId}`);
      connection.isConnecting = false;
      connection.isConnected = true;
      connection.reconnectAttempts = 0;
      this.emitStatusChange(jobKey, 'connected');
    };

    websocket.onmessage = (event) => {
      try {
        // Check message size for debugging
        const messageSize = event.data.length;
        if (messageSize > 100000) { // 100KB
          console.warn(`📡 Large WebSocket message received: ${messageSize} bytes for ${jobType} job ${jobId}`);
        }
        
        const data: JobProgressData = JSON.parse(event.data);
        
        // Safety: ignore packets for a different job to prevent cross-job mixing
        if (data && typeof data.job_id === 'string' && data.job_id !== jobId) {
          console.warn(`📡 WebSocket Manager: Ignoring message for mismatched job_id ${data.job_id} (connection for ${jobId})`);
          return;
        }
        
        // Store latest data
        connection.lastData = data;
        
        // Notify all subscribers
        for (const subscriptionId of connection.subscriptions) {
          const subscription = this.subscriptions.get(subscriptionId);
          if (subscription) {
            subscription.onProgress(data);
            
            // Handle completion
            if (data.status === 'completed') {
              subscription.onComplete(true);
              // Close connection after completion to ensure UI immediately hides overlays
              setTimeout(() => {
                this.closeConnection(jobKey);
              }, 100);
            } else if (data.status === 'failed') {
              subscription.onComplete(false, data.error_message);
              setTimeout(() => {
                this.closeConnection(jobKey);
              }, 100);
            } else if (data.status === 'closed' && data.close_connection && data.final === true) {
              // Handle explicit close signal from server
              console.log(`📡 WebSocket Manager: Received close signal for job ${jobId}`);
              subscription.onComplete(true);
              // Close the connection after a brief delay
              setTimeout(() => {
                this.closeConnection(jobKey);
              }, 100);
            }
          }
        }
      } catch (error) {
        const messageSize = event.data?.length || 0;
        console.error(`📡 WebSocket Manager: Failed to parse message for job ${jobId} (size: ${messageSize} bytes):`, error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to parse progress data';
        if (messageSize > 1000000) { // 1MB
          errorMessage = 'Message too large to process';
        } else if (error instanceof SyntaxError) {
          errorMessage = 'Invalid message format received';
        }
        
        this.notifySubscribersError(connection, errorMessage);
      }
    };

    websocket.onerror = (error) => {
      console.error(`📡 WebSocket Manager: Error for ${jobType} job ${jobId}:`, error);
      connection.isConnecting = false;
      connection.isConnected = false;
      this.emitStatusChange(jobKey, 'error', 'WebSocket connection error');
      this.notifySubscribersError(connection, 'WebSocket connection error');
    };

    websocket.onclose = (event) => {
      console.log(`📡 WebSocket Manager: Disconnected from ${jobType} job ${jobId} (code: ${event.code})`);
      connection.isConnecting = false;
      connection.isConnected = false;
      this.emitStatusChange(jobKey, 'disconnected');
      
      // Auto-reconnect for various error codes (not just normal closure)
      const shouldReconnect = (
        event.code !== 1000 && // Normal closure
        event.code !== 1001 && // Going away
        connection.reconnectAttempts < connection.maxReconnectAttempts
      );
      
      if (shouldReconnect) {
        this.scheduleReconnect(connection);
      } else {
        this.connections.delete(jobKey);
        if (connection.reconnectAttempts >= connection.maxReconnectAttempts) {
          this.emitStatusChange(jobKey, 'error', 'Connection failed after maximum retry attempts');
          this.notifySubscribersError(connection, 'Connection failed after maximum retry attempts');
        }
      }
    };
  }

  private scheduleReconnect(connection: WebSocketConnection): void {
    connection.reconnectAttempts++;
    
    // Use longer delays for inference jobs since Modal containers take time to start
    const baseDelay = connection.jobType === 'inference' ? 5000 : this.reconnectDelay; // 5s for inference, 1s for training
    const delay = baseDelay * Math.pow(1.5, connection.reconnectAttempts - 1); // Gentler exponential backoff
    
    const jobKey = this.getJobKey(connection.jobId, connection.jobType);
    
    console.log(`📡 WebSocket Manager: Reconnecting to ${connection.jobType} job ${connection.jobId} in ${delay}ms (attempt ${connection.reconnectAttempts}/${connection.maxReconnectAttempts})`);
    this.emitStatusChange(jobKey, 'reconnecting');
    
    setTimeout(() => {
      if (this.connections.has(jobKey)) {
        connection.isConnecting = true;
        connection.websocket = new WebSocket(connection.url);
        this.setupWebSocketEvents(connection);
      }
    }, delay);
  }

  private notifySubscribersError(connection: WebSocketConnection, error: string): void {
    for (const subscriptionId of connection.subscriptions) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.onError(error);
      }
    }
  }

  private closeConnection(jobKey: string): void {
    const connection = this.connections.get(jobKey);
    if (connection) {
      this.cancelPendingClose(jobKey);
      connection.websocket.close(1000, 'Manager cleanup');
      this.connections.delete(jobKey);
      this.emitStatusChange(jobKey, 'disconnected');
      console.log(`📡 WebSocket Manager: Closed connection for job ${connection.jobId}`);
    }
  }

  private getWebSocketUrl(jobType: JobType): string | null {
    switch (jobType) {
      case 'training':
        return process.env.NEXT_PUBLIC_TRAINING_WEBSOCKET_URL || null;
      case 'inference':
        return process.env.NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL || 'wss://creativebuild--primeshot-inference-progress.modal.run';
      default:
        return null;
    }
  }
}

// Singleton instance
export const webSocketManager = new WebSocketConnectionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketManager.cleanup();
  });
}
