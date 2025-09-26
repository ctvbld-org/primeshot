// Training Job Types
export interface TrainingJob {
  id: string;
  user_id: string;
  character_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  estimated_duration?: number;
  image_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  message?: string; // Progress message from the progress tracker
  characters?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface TrainingStartRequest {
  user_id: string;
  character_id: string;
  training_params?: {
    batch_size?: number;
    resize_size?: number;
      steps?: number;
    learning_rate?: number;
    resolution?: string;
  };
}

export interface TrainingStartResponse {
  job_id: string;
  modal_job_id?: string;
  status: string;
  estimated_duration: number;
  message: string;
  gpu_type?: string;
}

export interface TrainingProgressResponse {
  job_id: string;
  character_id: string;
  character?: {
    id: string;
    name: string;
    status: string;
  };
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  estimated_duration?: number;
  elapsed_time: number;
  estimated_remaining: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  message?: string; // Progress message from the progress tracker
  image_count: number;
  is_complete: boolean;
}

// Inference Job Types
export interface InferenceJob {
  id: string;
  user_id: string;
  character_id: string;
  style_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
  result_url?: string;
  prompt?: string;
  settings?: InferenceSettings;
}

export interface InferenceSettings {
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export interface InferenceStartRequest {
  user_id: string;
  character_id: string;
  style_id: string;
  wardrobe_id?: string;
  color_id?: string;
  scene_id?: string;
  params?: {
    nb_takes?: number;
    quality?: string;
    aspect_ratio?: string;
    seed?: number;
  };
  queue_type?: 'fast' | 'slow' | 'ultra';
  prompt_override?: { enabled: boolean; prompt: string };
  settings_override?: {
    character?: { strength_model?: number; strength_clip?: number };
    style?: { strength_model?: number; strength_clip?: number };
  };
}

export interface InferenceStartResponse {
  job_id: string;
  modal_job_id?: string;
  status: 'queued' | 'pending' | 'initializing';
  estimated_duration: number;
  message: string;
}

export interface InferenceProgressResponse {
  job_id: string;
  character_id: string;
  style_id: string;
  character?: {
    id: string;
    name: string;
    status: string;
  };
  style?: {
    id: string;
    name: string;
    description: string;
    thumbnail_url: string;
  };
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  estimated_duration?: number;
  elapsed_time: number;
  estimated_remaining: number;
  queue_position: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
  result_url?: string;
  prompt?: string;
  settings?: InferenceSettings;
  is_complete: boolean;
}

// Character Types
export interface Character {
  id: string;
  user_id: string;
  name: string;
  status: 'queued' | 'training' | 'ready' | 'failed' | 'deleted';
  image_count?: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

// Style Types
export interface Style {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Client Types
export interface JobApiClient {
  // Training
  startTraining: (request: TrainingStartRequest) => Promise<TrainingStartResponse>;
  
  // Inference
  startInference: (request: InferenceStartRequest) => Promise<InferenceStartResponse>;
} 