import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TrainingRequest {
  user_id: string;
  face_model_id: string;
}

interface TrainingJob {
  id: string;
  user_id: string;
  face_model_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modal_job_id?: string;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const env = Deno.env.get('ENV') ?? 'prod';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TrainingRequest = await req.json();
    const { user_id, face_model_id } = body;

    // Validate required fields
    if (!user_id || !face_model_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, face_model_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the face model
    console.log(`🔍 Looking for face model: ${face_model_id}, user_id: ${user_id}`);
    
    const { data: faceModel, error: faceModelError } = await supabase
      .from('face_models')
      .select('id, user_id, status')
      .eq('id', face_model_id)
      .eq('user_id', user_id)
      .single();

    console.log(`👤 Face model query result:`, { faceModel, faceModelError });

    if (faceModelError || !faceModel) {
      console.error(`❌ Face model not found:`, { faceModelError, faceModel });
      return new Response(
        JSON.stringify({ error: 'Face model not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if face model is already being trained or completed
    if (faceModel.status === 'training' || faceModel.status === 'ready') {
      console.log(`⚠️ Face model already ${faceModel.status}`);
      return new Response(
        JSON.stringify({ error: `Face model is already ${faceModel.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate job ID 
    const jobId = crypto.randomUUID();
    console.log(`🆔 Generated job ID: ${jobId}`);

    // Create training job record - simple and minimal
    const trainingJob: Partial<TrainingJob> = {
      id: jobId,
      user_id,
      face_model_id,
      status: 'queued',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`💾 Inserting training job:`, trainingJob);

    // Debug: Check what columns exist in training_jobs table
    const { data: testQuery, error: testError } = await supabase
      .from('training_jobs')
      .select('*')
      .limit(1);
    
    const { error: insertError } = await supabase
      .from('training_jobs')
      .insert(trainingJob);

    if (insertError) {
      console.error('❌ Failed to create training job:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create training job',
          details: insertError.message,
          code: insertError.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Training job created successfully`);

    // Update face model status to training
    console.log(`🔄 Updating face model status to training`);
    await supabase
      .from('face_models')
      .update({ 
        status: 'training',
        updated_at: new Date().toISOString()
      })
      .eq('id', face_model_id);

    // Prepare Modal API call
    const modalPayload = {
      user_id,
      face_model_id,
      job_id: jobId,
      env: env
    };

    console.log('🚀 Starting real Modal training job:', modalPayload);

    try {
      // Call real Modal API - using HTTPS endpoint
      const trainingUrl = Deno.env.get('TRAINING_API_URL'); 

      if (!trainingUrl) {  
        throw new Error('TRAINING_API_URL env variable is not configured');  
      } 
      
      const modalResponse = await fetch(trainingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Modal-Key': Deno.env.get('MODAL_TOKEN_ID') || '',
          'Modal-Secret': Deno.env.get('MODAL_TOKEN_SECRET') || ''
        },
        body: JSON.stringify(modalPayload)
      });

      if (!modalResponse.ok) {
        const errorText = await modalResponse.text();
        throw new Error(`Modal API error: ${modalResponse.status} - ${errorText}`);
      }

      const modalResult = await modalResponse.json();
      console.log('✅ Modal training started:', modalResult);

      // Update job with Modal job ID if provided
      const modalJobId = modalResult.job_handle || modalResult.modal_job_id;
      if (modalJobId) {
        await supabase
          .from('training_jobs')
          .update({ 
            modal_job_id: modalJobId,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          ...modalResult
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      console.error('❌ Modal API call failed:', modalError);
      
      // Update job status to failed
      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Update face model status back to queued
      await supabase
        .from('face_models')
        .update({ 
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', face_model_id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start training on Modal',
          details: modalError.message,
          job_id: jobId
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Training start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 