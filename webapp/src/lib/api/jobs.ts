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

  async startTraining(request: TrainingStartRequest): Promise<TrainingStartResponse> {
    return this.makeRequest<TrainingStartResponse>('training-start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async startInference(request: InferenceStartRequest): Promise<InferenceStartResponse> {
    return this.makeRequest<InferenceStartResponse>('inference-start', {
      method: 'POST',
      body: JSON.stringify(request),
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

  const startInference = async (request: InferenceStartRequest): Promise<InferenceStartResponse> => {
    try {
      return await jobsApi.startInference(request);
    } catch (error) {
      console.error('Failed to start inference:', error);
      throw error;
    }
  };

  return {
    startTraining,
    startInference,
  };
}