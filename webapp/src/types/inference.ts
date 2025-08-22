/**
 * Shared types for inference jobs and generated images
 */

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

export interface InferenceJobRow {
  id: string;
  user_id: string;
  character_id: string;
  style_id: string;
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  // Direct columns from database schema
  nb_takes?: number;
  quality?: string;
  aspect_ratio?: string;
  wardrobe_id?: string;
  scene_id?: string;
  color_id?: string;
  credits_spent?: number;
  completed_at?: string;
  retry_after?: string;
  queue_type?: string;
  modal_job_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InferenceJobResult {
  id: string;
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  generated_images: GeneratedImage[];
}

export interface InferenceJobWithImages extends InferenceJobRow {
  generated_images: GeneratedImage[];
}

export type InferenceJobStatus = 'queued' | 'pending' | 'running' | 'completed' | 'failed';
