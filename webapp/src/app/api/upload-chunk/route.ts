import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

function sanitizePathSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
}

export function OPTIONS() {
  return new NextResponse('ok', { status: 200, headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const actionFromQuery = url.searchParams.get('action')
    const contentType = req.headers.get('content-type') || ''

    // Auth (cookie-based)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if ((actionFromQuery === 'init') || contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const action = (form.get('action') as string | null) || 'init'
      if (action !== 'init') return json({ error: 'Invalid action' }, 400)

      const metadataStr = form.get('metadata') as string | null
      if (!metadataStr) return json({ error: 'Missing metadata' }, 400)
      let metadata: any
      try { metadata = JSON.parse(metadataStr) } catch { return json({ error: 'Invalid metadata JSON' }, 400) }
      const { uploadId, fileName, fileType, fileSize, totalChunks, characterId } = metadata || {}
      if (!uploadId || !fileName || !fileType || !characterId) return json({ error: 'Missing fields' }, 400)

      const base = sanitizePathSegment(String(fileName).replace(/\.[^/.]+$/, ''))
      const ext = String(fileName).split('.').pop() || 'jpg'
      const key = `user-images/${user.id}/training/${characterId}/source/${uploadId}-${base}.${ext}`

      // Optional: simple size/chunk sanity
      if (Number(fileSize) > 100 * 1024 * 1024) return json({ error: 'File too large' }, 400)
      if (Number(totalChunks) > 1000) return json({ error: 'Too many chunks' }, 400)

      // Create MPU
      const createRes = await s3.send(new CreateMultipartUploadCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        ContentType: fileType || 'application/octet-stream'
      }))
      if (!createRes.UploadId) return json({ error: 'Failed to create multipart upload' }, 500)

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

      return json({ uploadId: createRes.UploadId, key, partSize: PART_SIZE, contentType: fileType || 'application/octet-stream', thumbnailUrl })
    }

    // JSON actions
    const body = await req.json().catch(() => ({}))
    const action = body?.action || actionFromQuery
    if (action !== 'sign-part' && action !== 'complete' && action !== 'abort') return json({ error: 'Invalid action' }, 400)

    if (action === 'sign-part') {
      const { uploadId, key, partNumber } = body || {}
      if (!uploadId || !key || !partNumber) return json({ error: 'Missing uploadId|key|partNumber' }, 400)
      const command = new UploadPartCommand({ Bucket: AWS_S3_BUCKET, Key: key, PartNumber: Number(partNumber), UploadId: String(uploadId) })
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_S })
      return json({ url: signedUrl, expiresIn: PRESIGN_EXPIRES_S })
    }

    if (action === 'complete') {
      const { uploadId, key, parts } = body || {}
      if (!uploadId || !key || !Array.isArray(parts) || parts.length === 0) return json({ error: 'Missing uploadId|key|parts' }, 400)
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
      return json({ success: true, url: finalUrl, thumbnailUrl: null })
    }

    if (action === 'abort') {
      const { uploadId, key } = body || {}
      if (!uploadId || !key) return json({ error: 'Missing uploadId|key' }, 400)
      await s3.send(new AbortMultipartUploadCommand({ Bucket: AWS_S3_BUCKET, Key: key, UploadId: String(uploadId) }))
      return json({ success: true })
    }

    return json({ error: 'Unsupported method or action' }, 405)
  } catch (error: any) {
    return json({ error: error?.message || 'Unknown error' }, 500)
  }
}


