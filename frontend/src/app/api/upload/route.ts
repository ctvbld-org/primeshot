import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3, createPresignedUploadUrl } from '@/lib/s3'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { imageSchema } from '@/lib/schemas'
import { SupabaseClient } from '@supabase/supabase-js'

// Constants for image processing and upload
const MAX_WIDTH = 2048
const MAX_HEIGHT = 2048
const WEBP_QUALITY = 85
const MIN_DIMENSION = 800
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Utility function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Type for database operations
type DbResult<T> = {
  data: T | null
  error: Error | null
}

// Retry wrapper for async functions
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${i + 1} failed:`, error)
      
      // Check if we should retry based on error type
      if (
        error instanceof TypeError && 
        (error.message.includes('fetch failed') || error.message.includes('socket'))
      ) {
        if (i < retries - 1) {
          await wait(delay * Math.pow(2, i)) // Exponential backoff
          continue
        }
      } else {
        // Don't retry if it's not a network error
        throw error
      }
    }
  }
  
  throw lastError
}

// Process image with Sharp.js
async function processImage(file: Buffer, mimeType: string): Promise<{ buffer: Buffer, mimeType: string }> {
  let sharpInstance = sharp(file)
    .rotate() // Auto-rotate based on EXIF
    .withMetadata() // Preserve metadata

  // Get image info
  const metadata = await sharpInstance.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  // Ensure minimum dimensions
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`Image dimensions must be at least ${MIN_DIMENSION}x${MIN_DIMENSION} pixels`)
  }

  // Resize if needed while maintaining aspect ratio
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3' // Higher quality downscaling
    })
  }

  // Apply subtle sharpening to compensate for any resize softness
  sharpInstance = sharpInstance.sharpen({
    sigma: 1,
    m1: 0.1,
    m2: 0.1,
    x1: 2,
    y2: 10,
    y3: 20
  })

  // Always convert to WebP with optimal settings
  const processedBuffer = await sharpInstance
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,           // Maximum compression effort
      smartSubsample: true, // Better chroma subsampling
      nearLossless: false,  // Use lossy compression for better size reduction
      alphaQuality: 100    // Preserve alpha channel quality for any transparent areas
    })
    .toBuffer()

  return {
    buffer: processedBuffer,
    mimeType: 'image/webp'
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const compositionId = formData.get('compositionId') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!compositionId) {
      return NextResponse.json(
        { error: 'Composition ID is required' },
        { status: 400 }
      )
    }

    // Get user from session with retry
    const { data: { user }, error: authError } = await withRetry(() => 
      supabase.auth.getUser()
    )
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results = []

    for (const file of files) {
      try {
        // Read file as buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Process image (no retry needed as it's local)
        const { buffer: processedBuffer, mimeType: outputMimeType } = await processImage(buffer, file.type)

        // Generate unique key for S3 with .webp extension
        const originalName = file.name.replace(/\.[^/.]+$/, '')
        const key = `source-images/${user.id}/${uuidv4()}-${originalName}.webp`

        // Create a new File from the processed buffer
        const processedFile = new File([processedBuffer], `${originalName}.webp`, {
          type: outputMimeType
        })

        // Upload to S3 with retry
        const url = await withRetry(() => uploadToS3(processedFile, key))

        // Get dimensions of processed image
        const { width, height } = await sharp(processedBuffer).metadata()

        // Create database entry
        const imageData = {
          id: uuidv4(),
          composition_id: compositionId,
          user_id: user.id,
          url: url,
          file_name: `${originalName}.webp`,
          file_size: processedBuffer.length,
          mime_type: outputMimeType,
          dimensions: {
            width: width || 0,
            height: height || 0
          },
          created_at: new Date().toISOString()
        }

        // Validate image data
        const validatedData = imageSchema.parse(imageData)

        // Insert into database with retry
        const { data: dbImage, error: dbError } = await withRetry(async () => {
          const result = await supabase
            .from('images')
            .insert(validatedData)
            .select()
            .single()
          return result as DbResult<typeof validatedData>
        })

        if (dbError) throw dbError
        if (!dbImage) throw new Error('Failed to create database entry')

        results.push({
          originalName: file.name,
          url: url,
          id: dbImage.id
        })
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to process image'
        if (error instanceof Error) {
          if (error.message.includes('fetch failed') || error.message.includes('socket')) {
            errorMessage = 'Network error during upload. Please try again.'
          } else if (error.message.includes('dimensions')) {
            errorMessage = error.message
          }
        }
        
        results.push({
          originalName: file.name,
          error: errorMessage
        })
      }
    }

    return NextResponse.json({
      message: 'Upload complete',
      results
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Provide more specific error messages in the response
    let errorMessage = 'Failed to process upload'
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('socket')) {
        errorMessage = 'Network error during upload. Please try again.'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 