import { getApiUrl } from '@primeshot/common/lib/api/client'

/**
 * Get thumbnail URL using the media thumbnail API (client-side helper)
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
  
  // Use getApiUrl to handle basePath properly (like Media page does)
  return getApiUrl(`/api/media/thumbnail?key=${encodeURIComponent(key)}&w=${width}`)
}

// Type definitions
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
  
  const { data, hasMore } = await response.json()
  
  // Convert character thumbnails client-side
  const jobsWithThumbs = data.map((job: TrainingJobWithDetails) => ({
    ...job,
    character: job.character ? {
      ...job.character,
      thumbnail_url: job.character.thumbnail_url 
        ? getThumbUrl(job.character.thumbnail_url, 240)
        : null
    } : null
  }))
  
  return { data: jobsWithThumbs, hasMore }
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
  
  const { data, hasMore } = await response.json()
  
  // Convert character thumbnails client-side
  const jobsWithThumbs = data.map((job: InferenceJobWithDetails) => ({
    ...job,
    character: job.character ? {
      ...job.character,
      thumbnail_url: job.character.thumbnail_url 
        ? getThumbUrl(job.character.thumbnail_url, 240)
        : null
    } : null
  }))
  
  return { data: jobsWithThumbs, hasMore }
}

export async function fetchTrainingImages(characterId: string): Promise<UploadedImage[]> {
  const response = await fetch(
    getApiUrl(`/api/admin/characters/${characterId}/uploaded-images`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch training images')
  }
  
  const { data } = await response.json()
  
  // Convert S3 URLs to thumbnail API URLs (client-side)
  const imagesWithThumbs = data.map((image: UploadedImage) => ({
    ...image,
    url: getThumbUrl(image.url, 640)
  }))
  
  return imagesWithThumbs
}

export async function fetchGeneratedImages(inferenceId: string): Promise<GeneratedImage[]> {
  const response = await fetch(
    getApiUrl(`/api/admin/inference/${inferenceId}/generated-images`)
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch generated images')
  }
  
  const { data } = await response.json()
  
  // Convert S3 URLs to thumbnail API URLs (client-side)
  const imagesWithThumbs = data.map((image: GeneratedImage) => ({
    ...image,
    web_path: image.web_path ? getThumbUrl(image.web_path, 1024) : null,
    original_path: image.original_path ? getThumbUrl(image.original_path, 1024) : null
  }))
  
  return imagesWithThumbs
}
