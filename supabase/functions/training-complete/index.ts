import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getCharacterTrainingCost } from "../_shared/pricing.ts";

interface TrainingCompleteRequest {
  job_id: string;
  success: boolean;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
    const { job_id, success, error_message }: TrainingCompleteRequest = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: job_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🏁 Completing training job: ${job_id}, success: ${success}`);

    // Get the training job details to access user_id and credits_spent
    const { data: trainingJob, error: jobError } = await supabase
      .from('training_jobs')
      .select('user_id, character_id, credits_spent, status')
      .eq('id', job_id)
      .single();

    if (jobError || !trainingJob) {
      console.error(`❌ Training job not found: ${job_id}`, jobError);
      return new Response(
        JSON.stringify({ error: 'Training job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if job is already completed/failed to prevent duplicate processing
    if (trainingJob.status === 'completed' || trainingJob.status === 'failed') {
      console.log(`⚠️ Training job ${job_id} already ${trainingJob.status}, skipping completion`);
      return new Response(
        JSON.stringify({ 
          message: `Training job already ${trainingJob.status}`,
          job_id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update training job status. completed_at is managed by DB trigger.
    const updateData: any = {
      status: success ? 'completed' : 'failed',
      updated_at: new Date().toISOString()
    };

    if (error_message) {
      updateData.error_message = error_message;
    }

    const { error: updateError } = await supabase
      .from('training_jobs')
      .update(updateData)
      .eq('id', job_id);

    if (updateError) {
      console.error(`❌ Failed to update training job status:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update training job status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update character status
    const characterStatus = success ? 'ready' : 'failed';
    await supabase
      .from('characters')
      .update({ 
        status: characterStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingJob.character_id);

    console.log(`✅ Updated training job ${job_id} to ${success ? 'completed' : 'failed'}`);
    console.log(`✅ Updated character ${trainingJob.character_id} to ${characterStatus}`);

    // Refund credits if training failed and credits were spent
    if (!success && trainingJob.credits_spent > 0) {
      console.log(`💰 Refunding ${trainingJob.credits_spent} credits for failed training job: ${job_id}`);
      
      const refundIdempotencyKey = `training_failure_refund_${job_id}`;
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits_with_idempotency', {
          p_user_id: trainingJob.user_id,
          p_job_id: job_id,
          p_amount: trainingJob.credits_spent,
          p_reason: `Refund for failed training: ${error_message || 'Training execution failed'}`,
          p_idempotency_key: refundIdempotencyKey
        });

      if (refundError) {
        console.error('❌ Failed to process credit refund:', refundError);
        // Continue with success response - refund failure shouldn't fail the completion
      } else if (refundResult?.[0]?.success) {
        console.log(`✅ Refund processed for training job ${job_id}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund of ${trainingJob.credits_spent} credits`);
      }
    }

    // Process training queue after job completion
    let queueProcessingResult = null;
    try {
      console.log('🔄 Training job completed, processing queue...');
      
      // Call training-queue function directly
      const queueResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/training-queue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            trigger: 'training_completed',
            completed_job_id: job_id
          })
        }
      );

      if (queueResponse.ok) {
        queueProcessingResult = await queueResponse.json();
        console.log('✅ Queue processing completed:', queueProcessingResult);
      } else {
        console.error('❌ Queue processing failed:', await queueResponse.text());
      }
    } catch (queueError) {
      console.error('Warning: Queue processing error (non-blocking):', queueError);
      // Don't block training completion for queue processing errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        status: success ? 'completed' : 'failed',
        credits_refunded: (!success && trainingJob.credits_spent > 0) ? trainingJob.credits_spent : 0,
        message: success 
          ? 'Training completed successfully' 
          : `Training failed: ${error_message || 'Unknown error'}`,
        queue_processing: queueProcessingResult ? {
          triggered: true,
          jobs_started: queueProcessingResult.jobs_started || 0,
          available_slots: queueProcessingResult.available_slots || 0
        } : { triggered: false }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Training completion error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 