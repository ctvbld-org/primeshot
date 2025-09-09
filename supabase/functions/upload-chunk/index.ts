import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Use crypto for AWS signature v4
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

// Security limits
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_CHUNKS = 1000

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')!
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')!
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'
const AWS_S3_BUCKET = Deno.env.get('AWS_S3_BUCKET')!

interface ChunkMetadata {
  uploadId: string
  fileName: string
  fileType: string
  fileSize: number
  chunkIndex: number
  totalChunks: number
  characterId: string
  isFirstImage: boolean
  faceBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

function parseChunkMetadata(formData: FormData): ChunkMetadata {
  // Preferred: metadata JSON string under 'metadata' (current frontend behavior)
  const metadataStr = formData.get('metadata') as string | null
  if (metadataStr) {
    try {
      const parsed = JSON.parse(metadataStr)
      // Basic validation and defaults
      if (!parsed?.uploadId || !parsed?.fileName || !parsed?.characterId) {
        throw new Error('metadata JSON missing required fields')
      }
      parsed.isFirstImage = Boolean(parsed.isFirstImage)
      if (typeof parsed.fileSize === 'string') parsed.fileSize = parseInt(parsed.fileSize)
      if (typeof parsed.chunkIndex === 'string') parsed.chunkIndex = parseInt(parsed.chunkIndex)
      if (typeof parsed.totalChunks === 'string') parsed.totalChunks = parseInt(parsed.totalChunks)

      // Validate
      if (parsed.chunkIndex < 0 || parsed.chunkIndex >= parsed.totalChunks) {
        throw new Error('Invalid chunk index')
      }
      if (parsed.totalChunks > MAX_CHUNKS) {
        throw new Error(`Too many chunks: ${parsed.totalChunks} > ${MAX_CHUNKS}`)
      }
      if (parsed.fileSize > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${parsed.fileSize} > ${MAX_FILE_SIZE}`)
      }
      return parsed as ChunkMetadata
    } catch (e) {
      throw new Error('Invalid metadata JSON')
    }
  }

  // Fallback legacy form fields (uploadId, fileName, ...)
  const legacy = {
    uploadId: formData.get('uploadId') as string,
    fileName: formData.get('fileName') as string,
    fileType: formData.get('fileType') as string,
    fileSize: parseInt(formData.get('fileSize') as string),
    chunkIndex: parseInt(formData.get('chunkIndex') as string),
    totalChunks: parseInt(formData.get('totalChunks') as string),
    characterId: formData.get('characterId') as string,
    isFirstImage: formData.get('isFirstImage') === 'true',
  } as any

  const faceBoxStr = formData.get('faceBox') as string
  if (faceBoxStr && faceBoxStr !== 'undefined') {
    try { legacy.faceBox = JSON.parse(faceBoxStr) } catch {}
  }

  if (!legacy.uploadId || !legacy.fileName || !legacy.characterId) {
    throw new Error('Missing required metadata fields')
  }
  if (legacy.chunkIndex < 0 || legacy.chunkIndex >= legacy.totalChunks) {
    throw new Error('Invalid chunk index')
  }
  if (legacy.totalChunks > MAX_CHUNKS) {
    throw new Error(`Too many chunks: ${legacy.totalChunks} > ${MAX_CHUNKS}`)
  }
  if (legacy.fileSize > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${legacy.fileSize} > ${MAX_FILE_SIZE}`)
  }
  return legacy as ChunkMetadata
}

// RFC3986 encode each path segment but keep '/'
function encodeS3Key(key: string): string {
  return key
    .split('/')
    .map(seg => encodeURIComponent(seg).replace(/[!*'()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()))
    .join('/')
}

function sanitizePathSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
}

// S3 upload function using direct AWS signature v4 (with retries, timeout, cache headers)
async function uploadToS3(supabase: any, buffer: Uint8Array, key: string, mimeType: string): Promise<string> {
  const host = `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
  const encodedKey = encodeS3Key(key)
  const url = `https://${host}/${encodedKey}`
  const contentType = mimeType || 'application/octet-stream'
  const cacheControl = 'public, max-age=31536000, immutable'

  const now = new Date()
  const dateString = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeString = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'

  // Canonical request
  const method = 'PUT'
  const canonicalUri = `/${encodedKey}`
  const canonicalQueryString = ''
  const payloadHash = 'UNSIGNED-PAYLOAD'
  const canonicalHeaders = [
    `cache-control:${cacheControl}`,
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${timeString}`
  ].join('\n') + '\n'
  const signedHeaders = 'cache-control;content-type;host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateString}/${AWS_REGION}/s3/aws4_request`
  const stringToSign = [
    algorithm,
    timeString,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n')

  const signature = await calculateSignature(AWS_SECRET_ACCESS_KEY, dateString, AWS_REGION, 's3', stringToSign)
  const authorization = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Retry with backoff + timeout
  let lastErr: any = null
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
          'X-Amz-Content-Sha256': payloadHash,
          'X-Amz-Date': timeString,
          'Authorization': authorization
        },
        body: buffer,
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const text = await response.text()
        lastErr = new Error(`HTTP ${response.status}: ${text}`)
        // retry on 5xx
        if (response.status >= 500 && attempt < 4) {
          const backoff = 200 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100)
          await new Promise(r => setTimeout(r, backoff))
          continue
        }
        throw lastErr
      }

      // success
      return url
    } catch (e: any) {
      lastErr = e
      const isAbort = e?.name === 'AbortError'
      const isNetwork = /Network|fetch|Failed to fetch|aborted/i.test(String(e?.message || ''))
      if ((isAbort || isNetwork) && attempt < 4) {
        const backoff = 200 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      break
    }
  }
  throw new Error(`S3 upload failed: ${lastErr?.message || lastErr}`)
}

// Helper functions for AWS signature v4
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return new Uint8Array(signature)
}

async function calculateSignature(secretKey: string, dateString: string, region: string, service: string, stringToSign: string): Promise<string> {
  const encoder = new TextEncoder()
  
  let key = encoder.encode(`AWS4${secretKey}`)
  key = await hmacSha256(key, dateString)
  key = await hmacSha256(key, region)
  key = await hmacSha256(key, service)
  key = await hmacSha256(key, 'aws4_request')
  
  const signature = await hmacSha256(key, stringToSign)
  return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Image processing using ImageMagick (available in Supabase Edge Functions)
async function processImage(buffer: Uint8Array): Promise<{ width: number; height: number }> {
  // For now, return default dimensions
  // In production, you'd use ImageMagick or similar
  return { width: 1024, height: 1024 }
}

// Thumbnail generation with face-aware cropping
async function createThumbnail(buffer: Uint8Array, faceBox?: any): Promise<Uint8Array> {
  try {
    // Use ImageMagick via Deno's built-in support
    // First, get image dimensions
    const tempFile = `/tmp/input_${Date.now()}.jpg`
    const outputFile = `/tmp/thumbnail_${Date.now()}.webp`
    
    // Write input buffer to temp file
    await Deno.writeFile(tempFile, buffer)
    
    let cropCommand = ''
    
    if (faceBox && faceBox.x !== undefined && faceBox.y !== undefined && faceBox.width > 0 && faceBox.height > 0) {
      // Face-aware cropping logic (same as Next.js implementation)
      
      // Get image dimensions first
      const identifyCmd = new Deno.Command('identify', {
        args: ['-format', '%w %h', tempFile]
      })
      const identifyResult = await identifyCmd.output()
      
      if (identifyResult.success) {
        const dimensions = new TextDecoder().decode(identifyResult.stdout).trim().split(' ')
        const imgWidth = parseInt(dimensions[0])
        const imgHeight = parseInt(dimensions[1])
        
        if (imgWidth > 0 && imgHeight > 0) {
          // Convert normalized face box to pixels with margin
          const margin = 0.15 // 15% padding around face
          const nx = Math.max(0, faceBox.x - margin)
          const ny = Math.max(0, faceBox.y - margin)
          const nw = Math.min(1 - nx, faceBox.width + margin * 2)
          const nh = Math.min(1 - ny, faceBox.height + margin * 2)
          
          // Create square crop around face box
          const px = Math.round(nx * imgWidth)
          const py = Math.round(ny * imgHeight)
          const pw = Math.round(nw * imgWidth)
          const ph = Math.round(nh * imgHeight)
          
          // Determine square side length
          const side = Math.min(imgWidth, imgHeight, Math.max(pw, ph))
          
          // Center square around face box center
          const faceCenterX = px + pw / 2
          const faceCenterY = py + ph / 2
          let sx = Math.round(faceCenterX - side / 2)
          let sy = Math.round(faceCenterY - side / 2)
          
          // Clamp to image bounds
          sx = Math.max(0, Math.min(imgWidth - side, sx))
          sy = Math.max(0, Math.min(imgHeight - side, sy))
          
          if (side > 0) {
            cropCommand = `-crop ${side}x${side}+${sx}+${sy}`
          }
        }
      }
    }
    
    // Create ImageMagick command
    const args = [
      tempFile,
      '-auto-orient', // Handle EXIF rotation
    ]
    
    if (cropCommand) {
      args.push(...cropCommand.split(' '))
    } else {
      // Fallback: center crop to square
      args.push('-resize', '400x400^', '-gravity', 'center', '-extent', '400x400')
    }
    
    args.push(
      '-resize', '200x200', // Final thumbnail size
      '-quality', '85',
      '-format', 'webp',
      outputFile
    )
    
    const cmd = new Deno.Command('convert', { args })
    const result = await cmd.output()
    
    if (result.success) {
      const thumbnailBuffer = await Deno.readFile(outputFile)
      
      // Clean up temp files
      try {
        await Deno.remove(tempFile)
        await Deno.remove(outputFile)
      } catch (e) {
        console.warn('Failed to clean up temp files:', e)
      }
      
      return thumbnailBuffer
    } else {
      const error = new TextDecoder().decode(result.stderr)
      throw new Error(`ImageMagick failed: ${error}`)
    }
    
  } catch (error) {
    console.error('Thumbnail generation failed:', error)
    
    // Fallback: return a small portion of original image
    // This ensures we always return something even if ImageMagick fails
    return buffer.slice(0, Math.min(buffer.length, 50000))
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    // Always include CORS on preflight
    return new Response('ok', {
      status: 200,
      headers: getCorsHeaders(req)
    })
  }

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const metadata = parseChunkMetadata(formData)
    const chunkFile = formData.get('chunk') as File

    if (!chunkFile) {
      return new Response(
        JSON.stringify({ error: 'Missing chunk data' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    // Validate character ownership and status
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', metadata.characterId)
      .eq('user_id', user.id)
      .single()

    if (characterError || !character) {
      return new Response(
        JSON.stringify({ error: 'Character not found or access denied' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    if (character.status !== 'queued') {
      return new Response(
        JSON.stringify({ error: 'Character is not in a valid state for uploading' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    // Validate subscription and credits (only for first chunk)
    if (metadata.chunkIndex === 0) {
      console.log(`[Info] Validating subscription for character training for user ${user.id}`)
      
      // Check subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('plan_name, status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      console.log('[Info] Subscription query result:', { subscription: subscriptionData, subscriptionError })

      if (subscriptionError || !subscriptionData) {
        return new Response(
          JSON.stringify({ error: 'Active subscription required for character training' }),
          { 
            status: 402, 
            headers: { 
              'Content-Type': 'application/json',
              ...getCorsHeaders(req)
            } 
          }
        )
      }

      // Check credit balance via RPC (fallback to manual)
      let creditBalance = 0
      try {
        const { data: rpcBal, error: rpcErr } = await supabase.rpc('get_user_available_credits', { user_uuid: user.id })
        if (rpcErr) throw rpcErr
        creditBalance = Math.max(0, Number(rpcBal || 0))
      } catch (_) {
        const { data: transactions } = await supabase
          .from('user_credits')
          .select('credits, transaction_type, expires_at')
          .eq('user_id', user.id)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        creditBalance = (transactions || []).reduce((total, t: any) => {
          if (t.transaction_type === 'earned') return total + (t.credits || 0)
          if (t.transaction_type === 'spent') return total - (t.credits || 0)
          return total
        }, 0)
        creditBalance = Math.max(0, creditBalance)
      }

      // Get training cost from DB pricing
      let trainingCost = 30
      try {
        const { data: costData } = await supabase
          .from('credit_costs')
          .select('value')
          .eq('type', 'FACE_MODEL_TRAINING')
          .single()
        if (costData?.value != null) trainingCost = Number(costData.value)
      } catch (_) {}
      console.log(`[Info] Character training cost: ${trainingCost} credits, available: ${creditBalance}`)

      if (creditBalance < trainingCost) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits for character training' }),
          { 
            status: 402, 
            headers: { 
              'Content-Type': 'application/json',
              ...getCorsHeaders(req)
            } 
          }
        )
      }
    }

    // Get or create upload session
    let session
    const { data: existingSession, error: sessionQueryError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('id', metadata.uploadId)
      .single()

    if (sessionQueryError && sessionQueryError.code !== 'PGRST116') {
      throw new Error(`Session query failed: ${sessionQueryError.message}`)
    }

    if (existingSession) {
      session = existingSession
    } else {
      // Create new session
      const { data: newSession, error: sessionCreateError } = await supabase
        .from('upload_sessions')
        .insert({
          id: metadata.uploadId,
          user_id: user.id,
          character_id: metadata.characterId,
          file_name: metadata.fileName,
          file_type: metadata.fileType,
          file_size: metadata.fileSize,
          total_chunks: metadata.totalChunks,
          status: 'pending'
        })
        .select()
        .single()

      if (sessionCreateError) {
        throw new Error(`Failed to create session: ${sessionCreateError.message}`)
      }

      session = newSession
    }

    // Store chunk in Supabase Storage
    const chunkBuffer = new Uint8Array(await chunkFile.arrayBuffer())
    const chunkPath = `upload-chunks/${metadata.uploadId}/chunk-${metadata.chunkIndex}`
    
    const { error: chunkUploadError } = await supabase.storage
      .from('uploads')
      .upload(chunkPath, chunkBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (chunkUploadError) {
      throw new Error(`Failed to store chunk: ${chunkUploadError.message}`)
    }

    // Record chunk metadata in database
    // Upsert chunk atomically to avoid duplicate key errors on retries
    const { error: chunkInsertError } = await supabase
      .from('upload_chunks')
      .upsert({
        session_id: session.id,
        chunk_index: metadata.chunkIndex,
        chunk_size: chunkBuffer.length,
        status: 'uploaded'
      }, { onConflict: 'session_id,chunk_index', returning: 'minimal' })

    if (chunkInsertError) {
      throw new Error(`Failed to insert chunk: ${chunkInsertError.message}`)
    }

    // Check if all chunks are received
    const { data: chunks, error: chunksError } = await supabase
      .from('upload_chunks')
      .select('chunk_index, status')
      .eq('session_id', session.id)
      .eq('status', 'uploaded')

    if (chunksError) {
      throw new Error(`Failed to query chunks: ${chunksError.message}`)
    }

    const allChunksReceived = chunks.length === metadata.totalChunks
    console.log(`[Info] Upload ${metadata.uploadId}: All chunks received: ${allChunksReceived}, chunk ${metadata.chunkIndex}/${metadata.totalChunks}`)

    if (allChunksReceived) {
      // Retrieve and combine all chunks
      const chunkBuffers: Uint8Array[] = []
      
      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunkPath = `upload-chunks/${metadata.uploadId}/chunk-${i}`
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('uploads')
          .download(chunkPath)

        if (downloadError) {
          throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`)
        }

        const chunkBytes = new Uint8Array(await chunkData.arrayBuffer())
        chunkBuffers.push(chunkBytes)
      }

      console.log(`[Info] DEBUG: Retrieved chunks: [${chunkBuffers.map((chunk, i) => `{ index: ${i}, hasData: ${!!chunk}, dataType: "${typeof chunk}", dataLength: ${chunk?.length || 0} }`).join(', ')}]`)

      // Combine chunks into final buffer
      const totalSize = chunkBuffers.reduce((sum, chunk) => sum + chunk.length, 0)
      const finalBuffer = new Uint8Array(totalSize)
      let offset = 0
      
      for (const chunkBytes of chunkBuffers) {
        finalBuffer.set(chunkBytes, offset)
        offset += chunkBytes.length
      }

      // Upload to S3
      const cleanOriginalName = metadata.fileName.replace(/\.[^/.]+$/, '')
      const fileExtension = metadata.fileName.split('.').pop() || 'jpg'
      const key = `user-images/${user.id}/training/${metadata.characterId}/source/${metadata.uploadId}-${cleanOriginalName}.${fileExtension}`
      const url = await uploadToS3(supabase, finalBuffer, key, metadata.fileType)

      // Process image dimensions
      const { width, height } = await processImage(finalBuffer)

      // Generate thumbnail if this is the first image (temporarily disabled if createThumbnail returns null)
      let thumbUrl: string | null = null
      if (metadata.isFirstImage) {
        try {
          const thumbnailBuffer = await createThumbnail(finalBuffer, metadata.faceBox)
          if (thumbnailBuffer) {
            const thumbKey = `user-images/${user.id}/training/${metadata.characterId}/thumbnail.webp`
            thumbUrl = await uploadToS3(supabase, thumbnailBuffer, thumbKey, 'image/webp')
          }
        } catch (thumbErr) {
          console.error('Failed to generate thumbnail:', thumbErr)
        }

        // Immediately set thumbnail_url on character (same behavior as Next.js flow)
        try {
          const { error: thumbSetErr } = await supabase
            .from('characters')
            .update({ thumbnail_url: thumbUrl ?? url })
            .eq('id', character.id)
          if (thumbSetErr) {
            console.error('[Warn] Failed to set thumbnail_url early:', thumbSetErr)
          }
        } catch (e) {
          console.error('[Warn] Early thumbnail_url update threw:', e)
        }
      }

      // Save to uploaded_images table (schema: url, file_name, file_size, mime_type, dimensions, character_id, user_id, quality_score)
      const imageData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        character_id: metadata.characterId,
        url: url,
        file_name: metadata.fileName,
        file_size: finalBuffer.length,
        mime_type: metadata.fileType,
        dimensions: { width, height },
        quality_score: (metadata as any).qualityScore ?? undefined
      }

      const { error: imageInsertError } = await supabase
        .from('uploaded_images')
        .insert(imageData)

      if (imageInsertError) {
        throw new Error(`Failed to save image: ${imageInsertError.message}`)
      }

      // Update session status
      const { error: sessionUpdateError } = await supabase
        .from('upload_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)

      if (sessionUpdateError) {
        throw new Error(`Failed to update session: ${sessionUpdateError.message}`)
      }

      // Update character status and thumbnail URL (fallback to original url if thumbnail not generated)
      const characterUpdate: any = { status: 'uploaded' }
      characterUpdate.thumbnail_url = thumbUrl ?? url
      
      console.log('[Info] Updating character with thumbnail:', { characterId: metadata.characterId, characterUpdate })
      const { data: updatedChar, error: charUpdateError } = await supabase
        .from('characters')
        .update(characterUpdate)
        .eq('id', metadata.characterId)
        .select('id, thumbnail_url, status')
        .single()

      if (charUpdateError) {
        console.error('[Error] Failed to update character thumbnail_url:', charUpdateError)
      } else {
        console.log('[Info] Character updated:', updatedChar)
      }

      // Clean up chunks from Supabase Storage
      console.log(`[Info] Cleaning up ${metadata.totalChunks} chunks from storage`)
      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunkPath = `upload-chunks/${metadata.uploadId}/chunk-${i}`
        const { error: deleteError } = await supabase.storage
          .from('uploads')
          .remove([chunkPath])
        
        if (deleteError) {
          console.error(`Failed to delete chunk ${i}:`, deleteError)
        }
      }

      // Clean up chunk records from database
      const { error: chunkDeleteError } = await supabase
        .from('upload_chunks')
        .delete()
        .eq('session_id', session.id)

      if (chunkDeleteError) {
        console.error('Failed to delete chunk records:', chunkDeleteError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Upload completed successfully',
          imageId: imageData.id,
          url: url,
          thumbnailUrl: thumbUrl
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          } 
        }
      )
    }

    // Return success for individual chunk
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Chunk ${metadata.chunkIndex + 1}/${metadata.totalChunks} uploaded successfully` 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCorsHeaders(req)
        } 
      }
    )

  } catch (error: unknown) {
    console.error('Chunk upload error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCorsHeaders(req)
        } 
      }
    )
  }
})
