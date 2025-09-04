import { createClient } from '@/lib/supabase/client';
import type {
  TrainingStartRequest,
  TrainingStartResponse,
  InferenceStartRequest,
  InferenceStartResponse,
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

  private async makeRequestWithRetry<T>(
    functionName: string, 
    options: RequestInit = {},
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void
  ): Promise<T> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(functionName, options);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Notify caller of retry attempt
          onRetry?.(attempt + 1, maxRetries, lastError);
          
          console.warn(`${functionName} failed, retrying (${attempt + 1}/${maxRetries})...`, error);
          
          // Exponential backoff with jitter (1s, 2s, 3s + random 0-1s)
          await new Promise(resolve => 
            setTimeout(resolve, (1000 * (attempt + 1)) + Math.random() * 1000)
          );
        } else {
          console.error(`${functionName} failed after ${maxRetries} retries:`, error);
        }
      }
    }

    throw lastError!;
  }

  async startTraining(
    request: TrainingStartRequest, 
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void
  ): Promise<TrainingStartResponse> {
    return this.makeRequestWithRetry<TrainingStartResponse>('training-create', {
      method: 'POST',
      body: JSON.stringify(request),
    }, onRetry);
  }

  async startInference(
    request: InferenceStartRequest,
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void
  ): Promise<InferenceStartResponse> {
    return this.makeRequestWithRetry<InferenceStartResponse>('inference-create', {
      method: 'POST',
      body: JSON.stringify(request),
    }, onRetry);
  }

}

// Export singleton instance
export const jobsApi = new JobsApiClient();

// Hook for React components to use with error handling and retry support
export function useJobsApi() {
  const startTraining = async (
    request: TrainingStartRequest,
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void
  ): Promise<TrainingStartResponse> => {
    try {
      return await jobsApi.startTraining(request, onRetry);
    } catch (error) {
      console.error('Failed to start training after retries:', error);
      throw error;
    }
  };

  const startInference = async (
    request: InferenceStartRequest,
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void
  ): Promise<InferenceStartResponse> => {
    try {
      return await jobsApi.startInference(request, onRetry);
    } catch (error) {
      console.error('Failed to start inference after retries:', error);
      throw error;
    }
  };

  return {
    startTraining,
    startInference,
  };
}