import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface MissedRefund {
  job_id: string;
  user_id: string;
  credits_spent: number;
  error_message: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Starting missed refunds check...');

    // Find failed training jobs that spent credits but have no refunds
    const { data: failedJobs, error: queryError } = await supabase
      .from('training_jobs')
      .select('id, user_id, credits_spent, error_message, created_at')
      .eq('status', 'failed')
      .gt('credits_spent', 0);

    if (queryError) {
      console.error('❌ Error querying failed jobs:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query training jobs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!failedJobs || failedJobs.length === 0) {
      console.log('✅ No failed jobs with credits spent found');
      return new Response(
        JSON.stringify({ 
          message: 'No failed jobs with credits spent found',
          processed: 0,
          refunds_issued: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${failedJobs.length} failed jobs with credits spent`);

    const missedRefunds: MissedRefund[] = [];
    let refundsIssued = 0;

    for (const job of failedJobs) {
      // Check if a refund already exists for this job
      const { data: existingRefunds, error: refundCheckError } = await supabase
        .from('user_credits')
        .select('id')
        .eq('source_type', 'refund')
        .eq('source_id', job.id);

      if (refundCheckError) {
        console.error(`❌ Error checking refunds for job ${job.id}:`, refundCheckError);
        continue;
      }

      if (existingRefunds && existingRefunds.length > 0) {
        console.log(`✅ Job ${job.id} already has a refund`);
        continue;
      }

      // This job needs a refund
      console.log(`💰 Job ${job.id} needs refund of ${job.credits_spent} credits`);
      missedRefunds.push(job);

      // Issue the refund
      const refundIdempotencyKey = `missed_refund_fix_${job.id}`;
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits_with_idempotency', {
          p_user_id: job.user_id,
          p_job_id: job.id,
          p_amount: job.credits_spent,
          p_reason: `Missed refund fix for failed training: ${job.error_message || 'Training failed'}`,
          p_idempotency_key: refundIdempotencyKey
        });

      if (refundError) {
        console.error(`❌ Failed to issue refund for job ${job.id}:`, refundError);
      } else if (refundResult?.[0]?.success) {
        console.log(`✅ Refund issued for job ${job.id}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund of ${job.credits_spent} credits`);
        if (refundResult[0].refund_created) {
          refundsIssued++;
        }
      } else {
        console.error(`❌ Unexpected refund result for job ${job.id}:`, refundResult);
      }
    }

    console.log(`✅ Missed refunds check complete. Processed ${failedJobs.length} jobs, issued ${refundsIssued} new refunds`);

    return new Response(
      JSON.stringify({
        message: 'Missed refunds check complete',
        processed: failedJobs.length,
        refunds_needed: missedRefunds.length,
        refunds_issued: refundsIssued,
        missed_refunds: missedRefunds.map(job => ({
          job_id: job.job_id,
          user_id: job.user_id,
          credits_spent: job.credits_spent,
          error_message: job.error_message,
          created_at: job.created_at
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Missed refunds check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});