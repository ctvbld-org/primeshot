import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface ImageSaveRequest {
  job_id: string
  image_index: number
  original_path: string
  web_path: string
  width: number
  height: number
  format: string
  bytes?: number
  seed?: number
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405, headers: { ...dynamicCorsHeaders, 'Allow': 'POST, OPTIONS', 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate via shared service role key
    const authHeader = req.headers.get('authorization') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Unsupported Media Type, expected application/json' }),
        { status: 415, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { 
      job_id, 
      image_index, 
      original_path, 
      web_path, 
      width, 
      height, 
      format, 
      bytes = 0, 
      seed 
    }: ImageSaveRequest = await req.json()

    // Validate required fields
    if (!job_id || image_index === undefined || !original_path || !web_path) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['job_id', 'image_index', 'original_path', 'web_path'] 
        }), 
        { 
          status: 400, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📸 Saving image ${image_index} for job ${job_id}`)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Derive user_id from the job record rather than trusting client input
    const { data: job, error: jobError } = await supabase
      .from('inference_jobs')
      .select('id, user_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Inference job not found' }),
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resolvedUserId = job.user_id as string

    // Upsert into generated_images table (idempotent on inference_id + image_index)
    const { data: imageData, error: imageError } = await supabase
      .from('generated_images')
      .upsert({
        user_id: resolvedUserId,
        inference_id: job_id,
        image_index,
        original_path,
        web_path,
        width,
        height,
        format,
        bytes,
        seed
      }, { onConflict: 'inference_id,image_index' })
      .select()
      .single()

    if (imageError) {
      console.error(`❌ Failed to save image ${image_index} for job ${job_id}:`, imageError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upsert image to database', 
          details: imageError.message 
        }), 
        { 
          status: 500, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully upserted image ${image_index} for job ${job_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id, 
        image_index, 
        image_id: imageData?.id 
      }), 
      {
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Image save error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      {
        status: 500,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
