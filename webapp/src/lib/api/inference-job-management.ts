/**
 * Inference Job Management API
 * 
 * This module focuses on job lifecycle management, status tracking,
 * and job metadata operations. Use this for managing the inference
 * process itself rather than handling the generated results.
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  InferenceJobRow, 
  GeneratedImage, 
  InferenceJobWithImages 
} from '@/types/inference';
import { getInferenceImageUrl } from '@/lib/utils/inference-images';

/**
 * Fetch active inference jobs for a user
 */
export async function fetchActiveInferenceJobs(userId: string): Promise<InferenceJobRow[]> {
  try {
    const supabase = createClient();

    const { data: jobs, error } = await supabase
      .from('inference_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'pending', 'running'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active inference jobs:', error);
      return [];
    }

    return jobs || [];
  } catch (error) {
    console.error('Failed to fetch active inference jobs:', error);
    return [];
  }
}

/**
 * Fetch completed inference jobs with their generated images
 */
export async function fetchCompletedInferenceJobs(
  userId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<InferenceJobWithImages[]> {
  try {
    const supabase = createClient();

    const { data: jobs, error } = await supabase
      .from('inference_jobs')
      .select(`
        *,
        generated_images (
          id,
          inference_id,
          user_id,
          original_path,
          web_path,
          width,
          height,
          format,
          bytes,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching completed inference jobs:', error);
      return [];
    }

    return jobs || [];
  } catch (error) {
    console.error('Failed to fetch completed inference jobs:', error);
    return [];
  }
}

/**
 * Fetch a specific inference job with its generated images
 */
export async function fetchInferenceJob(jobId: string): Promise<InferenceJobWithImages | null> {
  try {
    const supabase = createClient();

    const { data: job, error } = await supabase
      .from('inference_jobs')
      .select(`
        *,
        generated_images (
          id,
          inference_id,
          user_id,
          original_path,
          web_path,
          width,
          height,
          format,
          bytes,
          created_at
        )
      `)
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching inference job:', error);
      return null;
    }

    return job;
  } catch (error) {
    console.error('Failed to fetch inference job:', error);
    return null;
  }
}

/**
 * Get total count of inference jobs for a user
 */
export async function getTotalInferenceJobsCount(userId: string): Promise<number> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('inference_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching inference jobs count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch inference jobs count:', error);
    return 0;
  }
}

/**
 * Fetch all inference jobs with pagination support
 */
export async function fetchInferenceJobsPaginated(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<InferenceJobWithImages[]> {
  try {
    const supabase = createClient();

    const { data: jobs, error } = await supabase
      .from('inference_jobs')
      .select(`
        *,
        generated_images (
          id,
          inference_id,
          user_id,
          original_path,
          web_path,
          width,
          height,
          format,
          bytes,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching paginated inference jobs:', error);
      return [];
    }

    return jobs || [];
  } catch (error) {
    console.error('Failed to fetch paginated inference jobs:', error);
    return [];
  }
}

// Re-export the shared utility for convenience
export { getInferenceImageUrl } from '@/lib/utils/inference-images';

/**
 * Subscribe to real-time updates for inference jobs
 */
export function subscribeToInferenceJobUpdates(
  userId: string,
  onUpdate: (job: InferenceJobRow) => void
) {
  const supabase = createClient();

  const subscription = supabase
    .channel(`inference_jobs_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inference_jobs',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Inference job updated:', payload);
        if (payload.new) {
          onUpdate(payload.new as InferenceJobRow);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
