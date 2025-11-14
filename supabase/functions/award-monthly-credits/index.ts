import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface SubscriptionNeedingReset {
  subscription_id: string;
  user_id: string;
  plan_name: string;
  monthly_credits_quota: number;
  current_period_end: string;
  last_quota_reset_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization using custom header (x-cron-secret)
    // Using service role authentication at gateway level + custom secret for extra security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedToken = Deno.env.get('CRON_SECRET_TOKEN');
    
    if (!cronSecret || !expectedToken || cronSecret !== expectedToken) {
      console.error('Unauthorized access attempt - invalid or missing x-cron-secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing x-cron-secret header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting quota reset safety check...');
    console.log('Note: Primary quota resets happen via Stripe webhooks. This is a safety net for edge cases.');

    // Find subscriptions that might have missed quota resets
    // This happens if webhook failed or was missed
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('subscription_id:stripe_subscription_id, user_id, plan_name, monthly_credits_quota, current_period_end, current_period_start, last_quota_reset_at')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())
      .returns<SubscriptionNeedingReset[]>();

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ All subscriptions are up to date - no quota resets needed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All quotas up to date',
          subscriptions_processed: 0,
          note: 'Primary resets happen via webhooks'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚠️ Found ${subscriptions.length} subscriptions with expired periods - resetting quotas as safety measure`);

    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ subscription_id: string; error: string }>,
    };

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        console.log(`Processing subscription ${sub.subscription_id}:`, {
          plan: sub.plan_name,
          quota: sub.monthly_credits_quota,
          period_end: sub.current_period_end,
          last_reset: sub.last_quota_reset_at,
        });

        // Reset the quota using the new system
        const { error: resetError } = await supabase.rpc(
          'reset_subscription_quota',
          {
            p_subscription_id: sub.subscription_id,
          }
        );

        if (resetError) {
          console.error(`❌ Error resetting quota for ${sub.subscription_id}:`, resetError);
          results.failed++;
          results.errors.push({
            subscription_id: sub.subscription_id,
            error: resetError.message,
          });
        } else {
          results.successful++;
          console.log(
            `✅ Reset quota for subscription ${sub.subscription_id} (${sub.plan_name} - ${sub.monthly_credits_quota} credits)`
          );
        }

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (subError) {
        const errorMessage = subError instanceof Error ? subError.message : 'Unknown error';
        console.error(`Exception processing subscription ${sub.subscription_id}:`, errorMessage);
        results.failed++;
        results.errors.push({
          subscription_id: sub.subscription_id,
          error: errorMessage,
        });
      }
    }

    console.log('Quota reset safety check completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quota reset safety check completed',
        results,
        note: 'Primary resets happen via Stripe webhooks - this catches edge cases',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Critical error in quota reset safety check:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Quota reset safety check failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

