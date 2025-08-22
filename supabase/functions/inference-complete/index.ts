import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ArtifactEntry { bucket: string; key: string; width?: number; height?: number; bytes?: number; format?: string; seed?: number }
interface InferenceCompleteRequest {
  job_id: string
  success?: boolean
  error_message?: string
  artifacts?: { web?: ArtifactEntry[]; orig?: ArtifactEntry[] }
}

// Helper function to extract image metadata from S3
async function extractImageMetadata(bucket: string, key: string): Promise<{ width: number; height: number; format: string; bytes: number }> {
  try {
    // Get AWS credentials from environment
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_REGION') || 'us-east-1'
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured')
    }

    // Create AWS signature for S3 HEAD request
    const now = new Date()
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    
    const service = 's3'
    const host = `${bucket}.s3.${region}.amazonaws.com`
    const canonicalUri = `/${key}`
    const canonicalQuerystring = ''
    const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-date'
    const payloadHash = 'UNSIGNED-PAYLOAD'
    
    const canonicalRequest = `HEAD\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))}`
    
    // Calculate signature
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey('raw', new TextEncoder().encode('AWS4' + key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kDateSigned = await crypto.subtle.sign('HMAC', kDate, new TextEncoder().encode(dateStamp))
      const kRegion = await crypto.subtle.importKey('raw', kDateSigned, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kRegionSigned = await crypto.subtle.sign('HMAC', kRegion, new TextEncoder().encode(regionName))
      const kService = await crypto.subtle.importKey('raw', kRegionSigned, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kServiceSigned = await crypto.subtle.sign('HMAC', kService, new TextEncoder().encode(serviceName))
      const kSigning = await crypto.subtle.importKey('raw', kServiceSigned, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      return kSigning
    }
    
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', signingKey, new TextEncoder().encode(stringToSign)))).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    // Make HEAD request to S3
    const s3Url = `https://${host}${canonicalUri}`
    const response = await fetch(s3Url, {
      method: 'HEAD',
      headers: {
        'Authorization': authorizationHeader,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash
      }
    })
    
    if (!response.ok) {
      throw new Error(`S3 HEAD request failed: ${response.status} ${response.statusText}`)
    }
    
    // Extract basic metadata from headers
    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type')
    const bytes = contentLength ? parseInt(contentLength, 10) : 0
    
    // Determine format from content type
    let format = 'unknown'
    if (contentType) {
      if (contentType.includes('png')) format = 'png'
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) format = 'jpeg'
      else if (contentType.includes('webp')) format = 'webp'
      else if (contentType.includes('gif')) format = 'gif'
    }
    
    // For width and height, we need to download and parse the image
    // For now, provide reasonable defaults based on our inference settings
    // This could be enhanced later to actually parse image dimensions
    let width = 1024
    let height = 1024
    
    // Try to infer dimensions from the key path or use common inference sizes
    if (key.includes('2K') || key.includes('2048')) {
      width = height = 2048
    } else if (key.includes('4K') || key.includes('4096')) {
      width = height = 4096
    } else if (key.includes('1K') || key.includes('1024')) {
      width = height = 1024
    }
    
    return { width, height, format, bytes }
    
  } catch (error) {
    console.error(`Failed to extract metadata for s3://${bucket}/${key}:`, error)
    // Return safe defaults that satisfy database constraints
    return {
      width: 1024,
      height: 1024,
      format: 'png',
      bytes: 1024000 // 1MB default
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { job_id, success, error_message, artifacts }: InferenceCompleteRequest = await req.json()
    if (!job_id) {
      return new Response(JSON.stringify({ error: 'Missing job_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: job } = await supabase
      .from('inference_jobs')
      .select('id, user_id, status')
      .eq('id', job_id)
      .single()

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return new Response(JSON.stringify({ ok: true, message: 'Already settled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If artifacts provided, upsert generated_images first
    if (artifacts && (artifacts.web?.length || artifacts.orig?.length)) {
      const web = artifacts.web || []
      const orig = artifacts.orig || []
      const rows: any[] = []
      const count = Math.max(web.length, orig.length)
      
      for (let i = 0; i < count; i++) {
        const w = web[i]
        const o = orig[i]
        
        // Extract metadata from artifacts or fetch from S3
        let width: number, height: number, format: string, bytes: number, seed: number | null
        
        // Try to get metadata from artifacts first (preferred method)
        if ((w?.width && w?.height && w?.format && w?.bytes) || 
            (o?.width && o?.height && o?.format && o?.bytes)) {
          width = w?.width ?? o?.width ?? 1024
          height = w?.height ?? o?.height ?? 1024
          format = w?.format ?? o?.format ?? 'png'
          bytes = w?.bytes ?? o?.bytes ?? 1024000
          seed = w?.seed ?? o?.seed ?? null
          console.log(`Using provided metadata: ${width}x${height}, ${format}, ${bytes} bytes, seed: ${seed}`)
        } else {
          // Skip expensive S3 metadata extraction - use safe defaults
          // The Modal inference pipeline should always provide complete metadata now
          const artifactToCheck = w || o
          seed = artifactToCheck?.seed ?? null
          
          console.log(`⚠️ Metadata missing from artifacts, using defaults (S3 extraction skipped for performance)`)
          console.log(`Artifact keys: web=${w?.key}, orig=${o?.key}`)
          
          // Use safe defaults that satisfy database constraints
          width = 1024
          height = 1024
          format = 'png'
          bytes = 1024000
          
          console.log(`Using default metadata: ${width}x${height}, ${format}, ${bytes} bytes, seed: ${seed}`)
        }
        
        // Ensure all required fields have valid values
        if (!width || width <= 0) width = 1024
        if (!height || height <= 0) height = 1024
        if (!format || format === 'unknown') format = 'png'
        if (!bytes || bytes <= 0) bytes = 1024000
        
        rows.push({
          user_id: job.user_id,
          inference_id: job_id,
          web_path: w ? `s3://${w.bucket}/${w.key}` : null,
          original_path: o ? `s3://${o.bucket}/${o.key}` : null,
          width,
          height,
          format,
          bytes,
          seed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      
      if (rows.length > 0) {
        console.log(`Inserting ${rows.length} generated_images records`)
        const { error: upsertErr } = await supabase
          .from('generated_images')
          // onConflict depends on your schema; if you have a unique constraint adjust accordingly
          .upsert(rows)
        if (upsertErr) {
          console.error('generated_images upsert failed:', upsertErr)
          // Log the problematic rows for debugging
          console.error('Problematic rows:', JSON.stringify(rows, null, 2))
        } else {
          console.log(`Successfully inserted ${rows.length} generated_images records`)
        }
      }
    }

    await supabase
      .from('inference_jobs')
      .update({
        status: success ?? (artifacts && ((artifacts.web?.length || 0) > 0 || (artifacts.orig?.length || 0) > 0)) ? 'completed' : 'failed',
        error_message: success ? null : (error_message ?? 'Unknown error'),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id)

    // Trigger queue processing to start next queued jobs for relevant users
    try {
      const queueResp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/inference-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ trigger: 'inference_completed', completed_job_id: job_id }),
      })
      if (!queueResp.ok) {
        console.error('Failed to trigger inference-queue:', await queueResp.text())
      }
    } catch (err) {
      console.error('Non-blocking: inference queue trigger failed', err)
    }

    return new Response(JSON.stringify({ success: true, job_id, status: success ? 'completed' : 'failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Inference completion error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


