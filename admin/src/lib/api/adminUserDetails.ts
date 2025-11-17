import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 20
  
  // Fetch limit + 1 to check if there are more records
  const { data, error } = await supabase
    .from('training_jobs')
    .select(`
      *,
      character:characters(
        id,
        name,
        thumbnail_url,
        lora_path,
        metadata,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)
  
  if (error) {
    console.error('Error fetching training jobs:', error)
    throw error
  }

  // Check if there are more records
  const hasMore = data.length > limit
  const resultData = hasMore ? data.slice(0, limit) : data

  // Convert character thumbnails to CDN URLs
  const jobsWithCdnUrls = resultData.map(job => {
    if (job.character?.thumbnail_url) {
      return {
        ...job,
        character: {
          ...job.character,
          thumbnail_url: getThumbUrl(job.character.thumbnail_url, 240)
        }
      }
    }
    return job
  })
  
  return { 
    data: jobsWithCdnUrls as TrainingJobWithDetails[], 
    hasMore 
  }
}

export async function fetchUserInferenceJobs(
  userId: string,
  options?: { offset?: number; limit?: number }
): Promise<{ data: InferenceJobWithDetails[]; hasMore: boolean }> {
  const supabase = createClient()
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 20
  
  // Fetch limit + 1 to check if there are more records
  const { data, error } = await supabase
    .from('inference_jobs')
    .select(`
      *,
      style:styles(
        id,
        name,
        preview_images
      ),
      wardrobe:style_wardrobes(
        id,
        label,
        image
      ),
      scene:style_scenes(
        id,
        label,
        image
      ),
      color:style_colors(
        id,
        label,
        value,
        color
      ),
      character:characters(
        id,
        name,
        thumbnail_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)
  
  if (error) {
    console.error('Error fetching inference jobs:', error)
    throw error
  }

  // Check if there are more records
  const hasMore = data.length > limit
  const resultData = hasMore ? data.slice(0, limit) : data

  // Convert all URLs to CDN URLs or proper placeholder paths
  const jobsWithCdnUrls = resultData.map(job => {
    const converted = { ...job }
    
    // Convert character thumbnail
    if (job.character?.thumbnail_url) {
      converted.character = {
        ...job.character,
        thumbnail_url: getThumbUrl(job.character.thumbnail_url, 240)
      }
    }

    // Convert style preview images - from database paths like "styles/Repos-640.webp"
    if (job.style?.preview_images && Array.isArray(job.style.preview_images)) {
      converted.style = {
        ...job.style,
        preview_images: job.style.preview_images.map((img: string | null) => 
          img ? toCdnUrl(`app-images/placeholders/styles/${img}`) : null
        )
      }
    }

    // Convert wardrobe placeholder image - from database value already includes extension
    if (job.wardrobe?.image) {
      converted.wardrobe = {
        ...job.wardrobe,
        image: toCdnUrl(`app-images/placeholders/options/wardrobes/${job.wardrobe.image}`)
      }
    }

    // Convert scene placeholder image - from database value already includes extension
    if (job.scene?.image) {
      converted.scene = {
        ...job.scene,
        image: toCdnUrl(`app-images/placeholders/options/scenes/${job.scene.image}`)
      }
    }
    
    return converted
  })
  
  return { 
    data: jobsWithCdnUrls as InferenceJobWithDetails[], 
    hasMore 
  }
}

export async function fetchTrainingImages(characterId: string): Promise<UploadedImage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('uploaded_images')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching uploaded images:', error)
    throw error
  }

  // Convert image URLs to thumbnail API URLs
  const imagesWithCdnUrls = data.map(image => ({
    ...image,
    url: getThumbUrl(image.url, 640)
  }))
  
  return imagesWithCdnUrls as UploadedImage[]
}

export async function fetchGeneratedImages(inferenceId: string): Promise<GeneratedImage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('inference_id', inferenceId)
    .order('image_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching generated images:', error)
    throw error
  }

  // Convert image URLs to thumbnail API URLs
  const imagesWithCdnUrls = data.map(image => ({
    ...image,
    web_path: image.web_path ? getThumbUrl(image.web_path, 1280) : null,
    original_path: image.original_path ? toCdnUrl(image.original_path) : null
  }))
  
  return imagesWithCdnUrls as GeneratedImage[]
}
