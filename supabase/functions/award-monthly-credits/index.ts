import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface SubscriptionNeedingCredits {
  subscription_id: string;
  user_id: string;
  plan_name: string;
  credits_per_month: number;
  months_elapsed: number;
  last_awarded_month: number;
  months_due: number;
  subscription_start: string;
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

    console.log('Starting monthly credit allocation job...');

    // Get all subscriptions needing credits
    const { data: subscriptions, error: fetchError } = await supabase
      .rpc('get_subscriptions_needing_monthly_credits')
      .returns<SubscriptionNeedingCredits[]>();

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions need credit awards at this time');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions need credits',
          subscriptions_processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions needing credits`);

    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      credits_awarded: 0,
      errors: [] as Array<{ subscription_id: string; error: string }>,
    };

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        console.log(`Processing subscription ${sub.subscription_id}:`, {
          plan: sub.plan_name,
          months_due: sub.months_due,
          last_awarded: sub.last_awarded_month,
          months_elapsed: sub.months_elapsed,
        });

        // Award credits for each missing month
        for (let month = sub.last_awarded_month + 1; month <= sub.months_elapsed; month++) {
          try {
            const { data: result, error: awardError } = await supabase.rpc(
              'award_monthly_subscription_credits',
              {
                p_user_id: sub.user_id,
                p_subscription_id: sub.subscription_id,
                p_month_number: month,
                p_plan_name: sub.plan_name,
                // No p_credits parameter - function looks it up from subscriptions table!
              }
            );

            if (awardError) {
              console.error(`Error awarding month ${month}:`, awardError);
              results.failed++;
              results.errors.push({
                subscription_id: sub.subscription_id,
                error: `Month ${month}: ${awardError.message}`,
              });
              break; // Stop processing this subscription if a month fails
            }

            console.log(`Month ${month} result:`, result);

            if (result.status === 'awarded') {
              results.successful++;
              results.credits_awarded += sub.credits_per_month;
              console.log(
                `✓ Awarded ${sub.credits_per_month} credits for month ${month} to user ${sub.user_id}`
              );
            } else if (result.status === 'already_awarded') {
              results.skipped++;
              console.log(
                `⊙ Month ${month} already awarded for subscription ${sub.subscription_id}`
              );
            }

            // Small delay to avoid overwhelming the database
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (monthError) {
            const errorMessage = monthError instanceof Error ? monthError.message : 'Unknown error';
            console.error(`Exception awarding month ${month}:`, errorMessage);
            results.failed++;
            results.errors.push({
              subscription_id: sub.subscription_id,
              error: `Month ${month} exception: ${errorMessage}`,
            });
            break;
          }
        }
      } catch (subError) {
        const errorMessage = subError instanceof Error ? subError.message : 'Unknown error';
        console.error(`Error processing subscription ${sub.subscription_id}:`, errorMessage);
        results.failed++;
        results.errors.push({
          subscription_id: sub.subscription_id,
          error: errorMessage,
        });
      }
    }

    console.log('Monthly credit allocation job completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly credit allocation completed',
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Critical error in monthly credit allocation:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Monthly credit allocation failed',
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

