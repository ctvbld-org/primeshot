import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts' 

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders })
  }

  try {
    console.log('🧹 Starting stuck inference jobs cleanup...')

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if cleanup is needed
    const { data: shouldCleanup, error: checkError } = await supabase
      .rpc('should_cleanup_stuck_inference_jobs')

    if (checkError) {
      console.error('❌ Error checking if cleanup needed:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check cleanup status', details: checkError.message }), 
        { 
          status: 500, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!shouldCleanup) {
      console.log('✅ No stuck jobs found, cleanup not needed')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stuck jobs found',
          cleaned_jobs: [],
          timestamp: new Date().toISOString()
        }),
        { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Run cleanup
    const { data: cleanedJobs, error: cleanupError } = await supabase
      .rpc('cleanup_stuck_inference_jobs')

    if (cleanupError) {
      console.error('❌ Error during cleanup:', cleanupError)
      return new Response(
        JSON.stringify({ error: 'Cleanup failed', details: cleanupError.message }), 
        { 
          status: 500, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const cleanedCount = cleanedJobs?.length || 0
    console.log(`✅ Cleanup completed. ${cleanedCount} stuck jobs processed.`)
    
    if (cleanedCount > 0) {
      console.log('🧹 Cleaned jobs:', cleanedJobs)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${cleanedCount} stuck jobs`,
        cleaned_jobs: cleanedJobs || [],
        timestamp: new Date().toISOString()
      }),
      { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Inference cleanup error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
