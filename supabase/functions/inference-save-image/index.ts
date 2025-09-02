import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ImageSaveRequest {
  job_id: string
  image_index: number
  user_id: string
  original_path: string
  web_path: string
  width: number
  height: number
  format: string
  bytes?: number
  seed?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      job_id, 
      image_index, 
      user_id, 
      original_path, 
      web_path, 
      width, 
      height, 
      format, 
      bytes = 0, 
      seed 
    }: ImageSaveRequest = await req.json()

    // Validate required fields
    if (!job_id || image_index === undefined || !user_id || !original_path || !web_path) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['job_id', 'image_index', 'user_id', 'original_path', 'web_path'] 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    // Insert into generated_images table
    const { data: imageData, error: imageError } = await supabase
      .from('generated_images')
      .insert({
        user_id,
        inference_id: job_id,
        image_index,
        original_path,
        web_path,
        width,
        height,
        format,
        bytes,
        seed
      })
      .select()
      .single()

    if (imageError) {
      console.error(`❌ Failed to save image ${image_index} for job ${job_id}:`, imageError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save image to database', 
          details: imageError.message 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully saved image ${image_index} for job ${job_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id, 
        image_index, 
        image_id: imageData?.id 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Image save error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
