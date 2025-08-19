/**
 * API functions for fetching inference job results and images
 */

import { createClient } from '@/lib/supabase/client';

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

export interface InferenceJobResult {
  id: string;
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  generated_images: GeneratedImage[];
}

/**
 * Fetch inference job results including generated images
 */
export async function fetchInferenceJobResult(jobId: string): Promise<InferenceJobResult | null> {
  try {
    const supabase = createClient();

    // Fetch the job with its generated images
    const { data: job, error: jobError } = await supabase
      .from('inference_jobs')
      .select(`
        id,
        status,
        error_message,
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

    if (jobError) {
      console.error('Error fetching inference job:', jobError);
      return null;
    }

    return job as InferenceJobResult;
  } catch (error) {
    console.error('Failed to fetch inference job result:', error);
    return null;
  }
}

/**
 * Get the CloudFront URL for an inference image
 */
export function getInferenceImageUrl(imagePath: string, useWebVariant: boolean = true): string {
  const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd3el9qajjnmn76.cloudfront.net';
  
  // Remove s3:// prefix if present
  const cleanPath = imagePath.replace(/^s3:\/\/[^\/]+\//, '');
  
  return `https://${cloudfrontDomain}/${cleanPath}`;
}

/**
 * Subscribe to inference job completion and update thumbnails
 */
export function subscribeToInferenceJobUpdates(
  jobId: string, 
  onUpdate: (result: InferenceJobResult) => void
) {
  const supabase = createClient();

  const subscription = supabase
    .channel(`inference_job_${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'inference_jobs',
        filter: `id=eq.${jobId}`,
      },
      async (payload) => {
        console.log('Inference job updated:', payload);
        
        // Fetch the full job result when it's updated
        const result = await fetchInferenceJobResult(jobId);
        if (result) {
          onUpdate(result);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
