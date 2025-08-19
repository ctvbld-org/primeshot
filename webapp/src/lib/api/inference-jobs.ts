/**
 * API functions for managing inference jobs
 */

import { createClient } from '@/lib/supabase/client';

export interface InferenceJobRow {
  id: string;
  user_id: string;
  character_id: string;
  style_id: string;
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  settings?: {
    nb_takes?: number;
    quality?: string;
    aspect_ratio?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  inference_id: string;
  user_id: string;
  original_path: string;
  web_path: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

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
export async function fetchCompletedInferenceJobs(userId: string, limit: number = 10): Promise<(InferenceJobRow & { generated_images: GeneratedImage[] })[]> {
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
      .limit(limit);

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
export async function fetchInferenceJob(jobId: string): Promise<(InferenceJobRow & { generated_images: GeneratedImage[] }) | null> {
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
 * Get the CloudFront URL for an inference image
 */
export function getInferenceImageUrl(imagePath: string): string {
  const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd3el9qajjnmn76.cloudfront.net';
  
  // Remove s3:// prefix if present
  const cleanPath = imagePath.replace(/^s3:\/\/[^\/]+\//, '');
  
  return `https://${cloudfrontDomain}/${cleanPath}`;
}

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
