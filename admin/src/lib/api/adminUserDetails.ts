import { getApiUrl } from '@primeshot/common/lib/api/client'

/**
 * Convert S3 keys/URLs to CloudFront CDN URLs
 */
function toCdnUrl(keyOrUrl: string): string {
  const cdn = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''
  
  // If already a full URL, extract the path
  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl)
      const path = url.pathname.substring(1) // Remove leading slash
      return `${cdn}/${path.split('/').map(encodeURIComponent).join('/')}`
    } catch {
      return keyOrUrl
    }
  }
  
  // Otherwise treat as S3 key
  return `${cdn}/${keyOrUrl.split('/').map(encodeURIComponent).join('/')}`
}

/**
 * Get thumbnail URL using the media thumbnail API
 */
function getThumbUrl(keyOrUrl: string, width: number = 480): string {
  // Extract S3 key from URL if needed
  let key = keyOrUrl
  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl)
      key = url.pathname.substring(1)
    } catch {
      key = keyOrUrl
    }
  }
  
  // Encode the entire key for the query parameter
  return `/api/media/thumbnail?key=${encodeURIComponent(key)}&w=${width}`
}

export interface TrainingJobWithDetails {
  id: string
  user_id: string
  character_id: string
  status: string
  created_at: string
  completed_at: string | null
  updated_at: string
  metadata: Record<string, any>
  modal_job_id: string | null
  error_message: string | null
  character: {
    id: string
    name: string
    thumbnail_url: string | null
    lora_path: string | null
    metadata: Record<string, any>
    status: string
  } | null
}

export interface InferenceJobWithDetails {
  id: string
  user_id: string
  character_id: string
  style_id: string | null
  wardrobe_id: string | null
  scene_id: string | null
  color_id: string | null
  status: string
  quality: string | null
  nb_takes: number | null
  aspect_ratio: string | null
  created_at: string
  completed_at: string | null
  updated_at: string
  error_message: string | null
  credits_spent: number | null
  style: {
    id: string
    name: string
    preview_images: any[] | null
  } | null
  wardrobe: {
    id: string
    label: string
    image: string | null
  } | null
  scene: {
    id: string
    label: string
    image: string | null
  } | null
  color: {
    id: string
    label: string
    value: string
    color: string
  } | null
  character: {
    id: string
    name: string
    thumbnail_url: string | null
  } | null
}

export interface UploadedImage {
  id: string
  user_id: string
  character_id: string
  url: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  dimensions: Record<string, any> | null
  quality_score: number | null
  created_at: string
}

export interface GeneratedImage {
  id: string
  user_id: string
  inference_id: string
  image_index: number | null
  original_path: string | null
  web_path: string | null
  width: number | null
  height: number | null
  format: string | null
  bytes: number | null
  seed: number | null
  metadata: Record<string, any> | null
  created_at: string
}

export async function fetchUserTrainingJobs(
  userId: string, 
  options?: { offset?: number; limit?: number }
): Promise<{ data: TrainingJobWithDetails[]; hasMore: boolean }> {
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 20
  
  const response = await fetch(
    getApiUrl(`/api/admin/users/${userId}/training-jobs?offset=${offset}&limit=${limit}`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch training jobs')
  }
  
  return response.json()
}

export async function fetchUserInferenceJobs(
  userId: string,
  options?: { offset?: number; limit?: number }
): Promise<{ data: InferenceJobWithDetails[]; hasMore: boolean }> {
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 20
  
  const response = await fetch(
    getApiUrl(`/api/admin/users/${userId}/inference-jobs?offset=${offset}&limit=${limit}`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch inference jobs')
  }
  
  return response.json()
}

export async function fetchTrainingImages(characterId: string): Promise<UploadedImage[]> {
  const response = await fetch(
    getApiUrl(`/api/admin/characters/${characterId}/uploaded-images`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch training images')
  }
  
  const { data } = await response.json()
  return data
}

export async function fetchGeneratedImages(inferenceId: string): Promise<GeneratedImage[]> {
  const response = await fetch(
    getApiUrl(`/api/admin/inference/${inferenceId}/generated-images`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch generated images')
  }
  
  const { data } = await response.json()
  return data
}
