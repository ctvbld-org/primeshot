import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization using custom header (x-cron-secret)
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

    console.log('🗑️ Starting purchased credits expiration job...');
    console.log('Purpose: Set remaining_credits = 0 for expired credit packs (data consistency)');

    // Call the expiration function
    const { data: result, error: expirationError } = await supabase
      .rpc('expire_old_purchased_credits')
      .returns<{ expired_count: number; total_credits_expired: number }>();

    if (expirationError) {
      console.error('Error expiring credits:', expirationError);
      throw new Error(`Failed to expire credits: ${expirationError.message}`);
    }

    const expiredCount = result?.expired_count || 0;
    const totalCreditsExpired = result?.total_credits_expired || 0;

    if (expiredCount === 0) {
      console.log('✅ No purchased credits expired - all credit packs are active or already expired');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No credits expired',
          expired_count: 0,
          total_credits_expired: 0,
          note: 'Credit packs expire after 90 days'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Expired ${expiredCount} credit pack(s) totaling ${totalCreditsExpired} credits`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credit expiration completed',
        expired_count: expiredCount,
        total_credits_expired: totalCreditsExpired,
        note: 'Expired credits logged to user_credits table for audit',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Critical error in credit expiration job:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Credit expiration failed',
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



