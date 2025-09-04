/**
 * Inference Results API
 * 
 * This module focuses on handling generated images, image serving,
 * and result-oriented operations. Use this for displaying and
 * working with the outputs of completed inference jobs.
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  GeneratedImage, 
  InferenceJobResult 
} from '@/types/inference';
import { getInferenceImageUrl } from '@/lib/utils/get-inference-image';

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

// Re-export the shared utility for convenience
export { getInferenceImageUrl } from '@/lib/utils/get-inference-image';

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
