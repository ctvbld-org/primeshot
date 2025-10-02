import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'
import { logSecurityEvent } from '@/lib/security-monitoring'

// Configuration
const PART_SIZE = 6 * 1024 * 1024 // 6 MiB minimum safe size
const PRESIGN_EXPIRES_S = 15 * 60 // 15 minutes

function getEnv(name: string, fallback?: string) {
  const v = process.env[name]
  if (v) return v
  if (fallback !== undefined) return fallback
  throw new Error(`Missing env: ${name}`)
}

const AWS_REGION = getEnv('AWS_REGION', 'us-east-1')
const AWS_S3_BUCKET = getEnv('AWS_S3_BUCKET')

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  } : undefined
})

function json(body: any, status = 200, headers: Record<string,string> = {}) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(), ...headers }
  })
}

// Secured handlers with comprehensive security middleware
const securedOPTIONS = createSecuredHandler(
  async (req: NextRequest) => {
    return new NextResponse('ok', { status: 200 })
  },
  {
    ...SECURITY_PRESETS.IMAGE_UPLOAD,
    requireAuth: false, // OPTIONS requests don't need auth
    botProtection: false // Skip bot protection for preflight
  }
);

const securedPOST = createSecuredHandler(
  async (req: NextRequest) => {
    return await handleUploadRequest(req);
  },
  SECURITY_PRESETS.IMAGE_UPLOAD
);

// Upload metrics tracking
interface UploadMetrics {
  operation: 'init' | 'sign-part' | 'complete' | 'abort'
  userId: string
  characterId?: string
  fileSize?: number
  totalChunks?: number
  partNumber?: number
  duration: number
  success: boolean
  error?: string
  timestamp: string
}

const uploadMetrics: UploadMetrics[] = []

function recordMetric(metric: UploadMetrics) {
  uploadMetrics.push(metric)
  // Keep only last 1000 metrics in memory
  if (uploadMetrics.length > 1000) {
    uploadMetrics.shift()
  }

  // Log to console for debugging
  console.log(`[UPLOAD METRIC] ${metric.operation}: ${metric.duration}ms, success: ${metric.success}`, {
    userId: metric.userId,
    characterId: metric.characterId,
    fileSize: metric.fileSize,
    error: metric.error
  })
}

// Extract the upload logic into a separate function
async function handleUploadRequest(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  let success = false
  let operation = 'unknown'
  let errorMessage = ''

  try {
    const url = new URL(req.url)
    const actionFromQuery = url.searchParams.get('action')
    const contentType = req.headers.get('content-type') || ''

    // Auth (cookie-based) - now handled by security middleware
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((actionFromQuery === 'init') || contentType.includes('multipart/form-data')) {
      operation = 'init'
      const form = await req.formData()
      const action = (form.get('action') as string | null) || 'init'
      if (action !== 'init') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

      const metadataStr = form.get('metadata') as string | null
      if (!metadataStr) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      let metadata: any
      try { metadata = JSON.parse(metadataStr) } catch { return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 }) }
      const { uploadId, fileName, fileType, fileSize, totalChunks, characterId } = metadata || {}
      if (!uploadId || !fileName || !fileType || !characterId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

      const base = sanitizePathSegment(String(fileName).replace(/\.[^/.]+$/, ''))
      const ext = String(fileName).split('.').pop() || 'jpg'
      const key = `user-images/${user.id}/training/${characterId}/source/${uploadId}-${base}.${ext}`

      // Optional: simple size/chunk sanity
      if (Number(fileSize) > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 400 })
      if (Number(totalChunks) > 1000) return NextResponse.json({ error: 'Too many chunks' }, { status: 400 })

      // Create MPU
      const createRes = await s3.send(new CreateMultipartUploadCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        ContentType: fileType || 'application/octet-stream'
      }))
      if (!createRes.UploadId) return NextResponse.json({ error: 'Failed to create multipart upload' }, { status: 500 })

      // Optional thumbnail
      const thumb = form.get('thumbnail') as File | null
      let thumbnailUrl: string | null = null
      if (thumb) {
        try {
          const buf = Buffer.from(await thumb.arrayBuffer())
          const thumbKey = `user-images/${user.id}/training/${characterId}/thumbnail.webp`
          const contentType = thumb.type || 'image/webp'
          await s3.send(new PutObjectCommand({ Bucket: AWS_S3_BUCKET, Key: thumbKey, Body: buf, ContentType: contentType, CacheControl: 'public, max-age=600' }))
          thumbnailUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${thumbKey}`
          // Persist thumbnail_url for character (service client)
          const svc = createServiceClient()
          await svc.from('characters').update({ thumbnail_url: thumbnailUrl }).eq('id', characterId).eq('user_id', user.id)
        } catch {
          // best-effort
        }
      }

      success = true
      recordMetric({
        operation: 'init',
        userId: user.id,
        characterId,
        fileSize: Number(fileSize),
        totalChunks: Number(totalChunks),
        duration: Date.now() - startTime,
        success: true,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({ uploadId: createRes.UploadId, key, partSize: PART_SIZE, contentType: fileType || 'application/octet-stream', thumbnailUrl })
    }

    // JSON actions
    const body = await req.json().catch(() => ({}))
    const action = body?.action || actionFromQuery
    if (action !== 'sign-part' && action !== 'complete' && action !== 'abort') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    if (action === 'sign-part') {
      operation = 'sign-part'
      const { uploadId, key, partNumber } = body || {}
      if (!uploadId || !key || !partNumber) return NextResponse.json({ error: 'Missing uploadId|key|partNumber' }, { status: 400 })
      const command = new UploadPartCommand({ Bucket: AWS_S3_BUCKET, Key: key, PartNumber: Number(partNumber), UploadId: String(uploadId) })
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_S })
      success = true
      recordMetric({
        operation: 'sign-part',
        userId: user.id,
        partNumber: Number(partNumber),
        duration: Date.now() - startTime,
        success: true,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ url: signedUrl, expiresIn: PRESIGN_EXPIRES_S })
    }

    if (action === 'complete') {
      operation = 'complete'
      const { uploadId, key, parts } = body || {}
      if (!uploadId || !key || !Array.isArray(parts) || parts.length === 0) return NextResponse.json({ error: 'Missing uploadId|key|parts' }, { status: 400 })
      const command = new CompleteMultipartUploadCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        UploadId: String(uploadId),
        MultipartUpload: {
          Parts: (parts as Array<{ partNumber: number; etag: string }>).map(p => ({ PartNumber: Number(p.partNumber), ETag: String(p.etag) }))
        }
      })
      const res = await s3.send(command)
      const finalUrl = res.Location || `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
      // Persist uploaded image for character (for counts/progress)
      try {
        const svc = createServiceClient()
        const fileName = key.split('/').pop() || null
        await svc.from('uploaded_images').insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          character_id: key.split('/')[3] || null, // user-images/{uid}/training/{characterId}/...
          url: finalUrl,
          file_name: fileName,
          file_size: null,
          mime_type: null,
          dimensions: null,
          quality_score: null
        })
      } catch {
        // best-effort; do not fail completion
      }
      success = true
      recordMetric({
        operation: 'complete',
        userId: user.id,
        duration: Date.now() - startTime,
        success: true,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ success: true, url: finalUrl, thumbnailUrl: null })
    }

    if (action === 'abort') {
      operation = 'abort'
      const { uploadId, key } = body || {}
      if (!uploadId || !key) return NextResponse.json({ error: 'Missing uploadId|key' }, { status: 400 })
      await s3.send(new AbortMultipartUploadCommand({ Bucket: AWS_S3_BUCKET, Key: key, UploadId: String(uploadId) }))
      success = true
      recordMetric({
        operation: 'abort',
        userId: user.id,
        duration: Date.now() - startTime,
        success: true,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported method or action' }, { status: 405 })
  } catch (error: any) {
    errorMessage = error?.message || 'Unknown error'

    // Record failed operation
    recordMetric({
      operation,
      userId: user?.id || 'unknown',
      duration: Date.now() - startTime,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    // Log security event for suspicious failures
    if (user) {
      logSecurityEvent(
        'suspicious_request',
        'medium',
        `Upload operation failed: ${operation} - ${errorMessage}`,
        {
          request: req,
          userId: user.id,
          metadata: { operation, duration: Date.now() - startTime }
        }
      )
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

function sanitizePathSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
}

export async function OPTIONS() {
  return await securedOPTIONS(new NextRequest('http://localhost'));
}

export async function POST(req: NextRequest) {
  return await securedPOST(req);
}


