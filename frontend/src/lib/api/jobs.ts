import { createClient } from '@/lib/supabase/client';
import type {
  TrainingStartRequest,
  TrainingStartResponse,
  TrainingProgressResponse,
  InferenceStartRequest,
  InferenceStartResponse,
  InferenceProgressResponse,
  JobApiClient
} from '@/types/jobs';

const supabase = createClient();

class JobsApiClient implements JobApiClient {
  private getSupabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }
    return url;
  }

  private async makeRequest<T>(
    functionName: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const url = `${this.getSupabaseUrl()}/functions/v1/${functionName}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async startTraining(request: TrainingStartRequest): Promise<TrainingStartResponse> {
    return this.makeRequest<TrainingStartResponse>('training-start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTrainingProgress(jobId: string, userId: string): Promise<TrainingProgressResponse> {
    const params = new URLSearchParams({ job_id: jobId, user_id: userId });
    return this.makeRequest<TrainingProgressResponse>(`training-progress?${params}`, {
      method: 'GET',
    });
  }

  async startInference(request: InferenceStartRequest): Promise<InferenceStartResponse> {
    return this.makeRequest<InferenceStartResponse>('inference-start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getInferenceProgress(jobId: string, userId: string): Promise<InferenceProgressResponse> {
    const params = new URLSearchParams({ job_id: jobId, user_id: userId });
    return this.makeRequest<InferenceProgressResponse>(`inference-progress?${params}`, {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const jobsApi = new JobsApiClient();

// Hook for React components to use with error handling
export function useJobsApi() {
  const startTraining = async (request: TrainingStartRequest): Promise<TrainingStartResponse> => {
    try {
      return await jobsApi.startTraining(request);
    } catch (error) {
      console.error('Failed to start training:', error);
      throw error;
    }
  };

  const getTrainingProgress = async (jobId: string, userId: string): Promise<TrainingProgressResponse> => {
    try {
      return await jobsApi.getTrainingProgress(jobId, userId);
    } catch (error) {
      console.error('Failed to get training progress:', error);
      throw error;
    }
  };

  const startInference = async (request: InferenceStartRequest): Promise<InferenceStartResponse> => {
    try {
      return await jobsApi.startInference(request);
    } catch (error) {
      console.error('Failed to start inference:', error);
      throw error;
    }
  };

  const getInferenceProgress = async (jobId: string, userId: string): Promise<InferenceProgressResponse> => {
    try {
      return await jobsApi.getInferenceProgress(jobId, userId);
    } catch (error) {
      console.error('Failed to get inference progress:', error);
      throw error;
    }
  };

  return {
    startTraining,
    getTrainingProgress,
    startInference,
    getInferenceProgress,
  };
}

// Utility function for polling job progress
export function createJobProgressPoller(
  getProgress: () => Promise<{ is_complete: boolean; progress: number }>,
  onUpdate: (data: any) => void,
  options: {
    interval?: number;
    maxDuration?: number;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { 
    interval = 2000, 
    maxDuration = 300000, // 5 minutes max
    onComplete,
    onError 
  } = options;

  let timeoutId: NodeJS.Timeout;
  const startTime = Date.now();
  let isPolling = true;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const data = await getProgress();
      onUpdate(data);

      if (data.is_complete) {
        isPolling = false;
        onComplete?.();
        return;
      }

      // Check if we've exceeded max duration
      if (Date.now() - startTime > maxDuration) {
        isPolling = false;
        onError?.(new Error('Polling timeout exceeded'));
        return;
      }

      // Schedule next poll
      timeoutId = setTimeout(poll, interval);
    } catch (error) {
      isPolling = false;
      onError?.(error instanceof Error ? error : new Error('Polling failed'));
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
} 