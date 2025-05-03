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

// Process image with sharp
async function processImage(buffer: Buffer) {
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
  } catch (error: unknown) {
    console.error('Image processing error:', error)
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// --- Single File Processing Pipeline ---
async function processAndUploadFile(
  file: File, 
  userId: string, 
  orderId: string,
  supabase: SupabaseClient
) {
  const originalName = file.name
  console.log(`[${originalName}] Starting processing pipeline for order ${orderId}...`)
  try {
    // 1. Process Image
    const buffer = Buffer.from(await file.arrayBuffer())
    const { buffer: processedBuffer, mimeType: outputMimeType } = await processImage(buffer)
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
      order_id: orderId,
      composition_id: null,
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
    console.log(`[${originalName}] Saved to DB with orderId ${orderId}.`) 

    // Return success result for this file
    return { originalName, url }

  } catch (error: unknown) {
    console.error(`[${originalName}] Error in processing pipeline:`, error)
    // Return error result for this file
    return { originalName, error: error instanceof Error ? error.message : 'Processing failed' }
  }
}

// --- POST Handler ---
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('User authenticated:', user.id)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const orderId = formData.get('orderId') as string // Get orderId from form data

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }
    
    // Validate orderId
    if (!orderId || typeof orderId !== 'string') {
      console.error('Missing or invalid orderId in form data')
      return NextResponse.json({ error: 'Missing or invalid order ID' }, { status: 400 })
    }
    console.log(`Processing ${files.length} files for orderId: ${orderId}`)

    // --- Corrected Streaming Logic --- 
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        console.log('Stream started. Processing files...');

        const processFileAndEnqueue = async (file: File) => {
          // Pass the orderId to the processing function
          const result = await processAndUploadFile(file, user.id, orderId, supabase);
          try {
            const jsonData = JSON.stringify(result);
            controller.enqueue(encoder.encode(jsonData + '\n')); // Send JSON line
            console.log(`Enqueued result for ${result.originalName}:`, jsonData);
          } catch (e) {
            console.error(`Error encoding or enqueuing result for ${file.name}:`, e);
            // Optionally enqueue an error object for this file
            try {
              controller.enqueue(encoder.encode(JSON.stringify({ originalName: file.name, error: 'Serialization failed' }) + '\n'));
            } catch (enqueueError) {
               console.error('Failed to enqueue serialization error:', enqueueError);
            }
          }
        };

        // Create promises for all file processing tasks
        const processingPromises = files.map(file => processFileAndEnqueue(file));
        
        // Wait for all processing to complete
        await Promise.allSettled(processingPromises);

        // All files processed (or failed), close the stream
        console.log('All file processing settled. Closing stream.');
        controller.close();
      }
    });

    // Return the streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson', // Use newline-delimited JSON
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      }
    });
    // --- End Corrected Streaming Logic --- 

  } catch (error) {
    console.error('Upload API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error during upload'
    // Return a standard JSON error response if the whole request fails early
    return NextResponse.json({ error: message, success: false }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS (if needed, often handled by framework middleware)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust for production!
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}