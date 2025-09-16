/**
 * API functions for fetching inference job results and images
 * 
 * This module focuses on handling generated images, image serving,
 * and result-oriented operations.
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
          favourite,
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

/**
 * Toggle favourite flag for a generated image
 */
export async function setImageFavourite(imageId: string, favourite: boolean, opts?: { retries?: number }) {
  const supabase = createClient();
  const retries = Math.max(0, Math.min(3, opts?.retries ?? 2));
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ favourite })
        .eq('id', imageId);
      if (error) throw error;
      return { id: imageId, favourite } as { id: string; favourite: boolean };
    } catch (e: any) {
      lastErr = e;
      const message: string = (e?.message || '').toLowerCase();
      const code: string | undefined = e?.code || e?.status?.toString?.();
      const isTimeout = message.includes('statement timeout') || code === '57014';
      if (isTimeout && attempt < retries) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function getImageFavourite(imageId: string): Promise<boolean | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('generated_images')
    .select('favourite')
    .eq('id', imageId)
    .maybeSingle();
  if (error) return null;
  return (data as any)?.favourite ?? null;
}

/** Delete a generated image: S3 variants + DB row. Returns remaining count on the job. */
export async function deleteGeneratedImage(imageId: string): Promise<{ success: boolean; remaining: number; jobId: string }> {
  const res = await fetch('/api/inference/delete-generated-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to delete image');
  }
  return res.json();
}
