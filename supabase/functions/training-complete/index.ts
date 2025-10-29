import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getCharacterTrainingCost } from "../_shared/pricing.ts";

// AI Job Monitoring
async function reportTrainingFailure(
  jobId: string,
  userId: string,
  characterId: string,
  errorMessage: string,
  retryCount?: number,
  creditsSpent?: number
): Promise<void> {
  // Use AI_MONITORING_SLACK_WEBHOOK if available, otherwise fall back to SECURITY_SLACK_WEBHOOK
  const webhookUrl = Deno.env.get('AI_MONITORING_SLACK_WEBHOOK') || Deno.env.get('SECURITY_SLACK_WEBHOOK');
  if (!webhookUrl) return;

  const payload = {
    channel: '#ai-gen-monitoring',
    username: 'AI Job Monitor',  
    icon_emoji: ':robot_face:',
    attachments: [{
      color: 'danger',
      title: '🚨🚨 Training Job Failed',
      text: `Training job failed: ${errorMessage}`,
      fields: [
        {
          title: 'Job Type',
          value: '🎓 Training',
          short: true
        },
        {
          title: 'Job ID', 
          value: jobId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'User ID',
          value: userId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'Character ID',
          value: characterId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'Error Message',
          value: errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''),
          short: false
        },
        ...(retryCount ? [{
          title: 'Retry Count',
          value: retryCount.toString(),
          short: true
        }] : []),
        ...(creditsSpent ? [{
          title: 'Credits Spent',
          value: creditsSpent.toString(),
          short: true
        }] : []),
        {
          title: 'Timestamp',
          value: new Date().toLocaleString(),
          short: true
        }
      ],
      footer: 'PrimeShot AI Job Monitor',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Training failure Slack alert failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending training failure Slack alert:', error);
  }
}

interface TrainingCompleteRequest {
  job_id: string;
  success: boolean;
  lora_path?: string; // required when success === true
  error_message?: string;
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
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
        { status: 405, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: service role only (consistent with inference EFs)
    const auth = req.headers.get('authorization') || '';
    const expected = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`;
    if (!expected.trim() || auth !== expected) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { job_id, success, error_message, lora_path }: TrainingCompleteRequest = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: job_id' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate full UUID format to prevent truncated IDs
    const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!UUID_V4_REGEX.test(job_id)) {
      console.error(`❌ Invalid job_id format (expected UUID): ${job_id}`)
      return new Response(
        JSON.stringify({ error: 'Invalid job_id format: expected UUID' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      )
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
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate presence of lora_path when success is true
    if (success && (!lora_path || typeof lora_path !== 'string' || lora_path.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: lora_path for successful training' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
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
      .update({ ...updateData, retry_after: null })
      .eq('id', job_id);

    if (updateError) {
      console.error(`❌ Failed to update training job status:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update training job status' }),
        { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update character status (+ lora_path when successful) atomically
    const characterStatus = success ? 'ready' : 'failed';
    const characterUpdate: Record<string, any> = {
      status: characterStatus,
      updated_at: new Date().toISOString()
    };
    if (success && lora_path) {
      characterUpdate.lora_path = lora_path;
    }
    await supabase
      .from('characters')
      .update(characterUpdate)
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

    // If training failed, fail and refund any queued/pending/running inference jobs for this character
    if (!success) {
      // Report training failure to monitoring system
      await reportTrainingFailure(
        job_id,
        trainingJob.user_id,
        trainingJob.character_id,
        error_message || 'Training failed',
        trainingJob.retry_count,
        trainingJob.credits_spent
      );

      try {
        const { data: impacted } = await supabase
          .from('inference_jobs')
          .select('id, user_id, credits_spent')
          .eq('character_id', trainingJob.character_id)
          .in('status', ['queued','initializing','pending','running'])
        if (Array.isArray(impacted) && impacted.length > 0) {
          // Mark failed
          await supabase
            .from('inference_jobs')
            .update({ status: 'failed', error_message: 'Training failed for this character', updated_at: new Date().toISOString() })
            .eq('character_id', trainingJob.character_id)
            .in('status', ['queued','initializing','pending','running'])
          // Refund each
          for (const j of impacted) {
            if ((j as any)?.credits_spent > 0) {
              const key = `inference_refund_${(j as any).id}`
              await supabase.rpc('refund_credits_with_idempotency', {
                p_user_id: (j as any).user_id,
                p_job_id: (j as any).id,
                p_amount: (j as any).credits_spent,
                p_reason: 'Refund: training failed before inference could run',
                p_idempotency_key: key
              })
            }
          }
        }
      } catch (e) {
        console.error('Warning: failed to refund/close queued inference jobs:', e)
      }
    }

    // Process training and inference queues after job completion
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

      // Trigger inference queue in case jobs were waiting for this character
      try {
        const infRes = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/inference-queue`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ trigger: 'training_completed' })
          }
        );
        if (!infRes.ok) {
          console.error('❌ Inference queue trigger failed:', await infRes.text());
        }
      } catch (e) {
        console.error('Warning: inference queue trigger error (non-blocking):', e);
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
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Training completion error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 