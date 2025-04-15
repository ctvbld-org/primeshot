import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/s3'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { imageSchema } from '@/lib/schemas'
import { SupabaseClient } from '@supabase/supabase-js'

// Constants for image processing and upload
const MAX_WIDTH = 2048
const MAX_HEIGHT = 2048
const WEBP_QUALITY = 85
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Utility function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Process image with sharp
async function processImage(buffer: Buffer, originalMimeType: string) {
  try {
    console.log('Starting image processing...')
    
    // Load image metadata
    const metadata = await sharp(buffer).metadata()
    console.log('Image metadata:', metadata)

    // Create sharp instance with original image
    let sharpInstance = sharp(buffer)

    // Auto-rotate based on EXIF data
    sharpInstance = sharpInstance.rotate()

    // Resize if needed while maintaining aspect ratio
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // Convert to WebP with quality setting
    const processedBuffer = await sharpInstance
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    console.log('Image processing completed successfully')
    
    return {
      buffer: processedBuffer,
      mimeType: 'image/webp'
    }
  } catch (error) {
    console.error('Image processing error:', error)
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// --- Single File Processing Pipeline ---
async function processAndUploadFile(file: File, userId: string, supabase: SupabaseClient) {
  const originalName = file.name
  console.log(`[${originalName}] Starting processing pipeline...`)
  try {
    // 1. Process Image
    const buffer = Buffer.from(await file.arrayBuffer())
    const { buffer: processedBuffer, mimeType: outputMimeType } = await processImage(buffer, file.type)
    console.log(`[${originalName}] Image processed.`) 
    
    // 2. Upload to S3
    const cleanOriginalName = originalName.replace(/\.[^/.]+$/, '')
    const key = `source-images/${userId}/${uuidv4()}-${cleanOriginalName}.webp`
    const processedFile = new File([processedBuffer], `${cleanOriginalName}.webp`, { type: outputMimeType })
    const url = await uploadToS3(processedFile, key) 
    console.log(`[${originalName}] Uploaded to S3.`) 

    // 3. Save to Database
    const { width, height } = await sharp(processedBuffer).metadata()
    const imageData = {
      id: uuidv4(),
      user_id: userId,
      url: url,
      file_name: `${cleanOriginalName}.webp`,
      file_size: processedBuffer.length,
      mime_type: outputMimeType,
      dimensions: { width: width || 0, height: height || 0 },
      created_at: new Date().toISOString()
    }
    const validatedData = imageSchema.parse(imageData)
    const { error: dbError } = await supabase
      .from('images')
      .insert(validatedData)
    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)
    console.log(`[${originalName}] Saved to DB.`) 

    // Return success result for this file
    return { originalName, url }

  } catch (error: any) {
    console.error(`[${originalName}] Error in processing pipeline:`, error)
    // Return error result for this file
    return { originalName, error: error.message || 'Processing failed' }
  }
}

// --- API Route Handler (Parallel Processing & Streaming) --- 
export async function POST(request: Request) {
  try {
    // 1. Initialize Supabase Client and Authenticate User
    const supabase = await createClient() // Await the client initialization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. Get Files
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    console.log(`Received ${files.length} files for upload.`) 

    // 3. Setup Streaming Response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        console.log('Stream started. Beginning parallel processing...') 
        
        // Supabase client is available here due to closure
        
        // Function to process one file and enqueue its result
        const processFileAndEnqueue = async (file: File) => {
           // Pass the initialized client to the processing function
          const result = await processAndUploadFile(file, user.id, supabase)
          try {
             controller.enqueue(encoder.encode(JSON.stringify(result) + '\n'))
             console.log(`Enqueued result for ${result.originalName}`) 
          } catch (e) {
             console.error(`Error enqueuing result for ${result.originalName}:`, e)
          }
        }

        // 4. Start all processing concurrently
        const processingPromises = files.map(file => processFileAndEnqueue(file))
        
        // 5. Wait for all to settle
        await Promise.allSettled(processingPromises)

        // 6. Close the stream 
        console.log('All file processing settled. Closing stream.') 
        controller.close()
      }
    })

    // 7. Return the stream immediately
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('Upload request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate upload' },
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