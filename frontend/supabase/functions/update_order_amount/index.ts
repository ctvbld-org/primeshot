// Supabase Edge Function for updating order amount
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestParams {
  order_id: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders
    })
  }
  
  // Create Supabase client with the Supabase URL and anonymous key
  const supabaseClient = createClient(
    // Supabase API URL - env var injected by Supabase
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API ANON KEY - env var injected by Supabase
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Get request body
  const { order_id, user_id } = await req.json() as RequestParams
  
  if (!order_id || !user_id) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required parameters: order_id and user_id'
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  try {
    // Verify the order exists and belongs to the user
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ 
          error: 'Order not found or does not belong to this user' 
        }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Count styles for this order with status 'draft'
    const { count: styleCount, error: countError } = await supabaseClient
      .from('styles')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order_id)
      .eq('status', 'draft')

    if (countError) {
      throw new Error(`Failed to count styles: ${countError.message}`)
    }

    // Calculate the price based on style count
    let price = 0
    if (styleCount) {
      if (styleCount === 1) {
        // Individual tier (1 style)
        price = 2900
      } else if (styleCount <= 3) {
        // Professional tier (2-3 styles)
        price = 4900
      } else if (styleCount <= 6) {
        // Studio tier (4-6 styles)
        price = 7900
      } else {
        // Studio tier + add-ons (7+ styles)
        price = 7900 + (styleCount - 6) * 1500
      }
    }

    // Update the order with the calculated price
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        amount: price, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', order_id)
      .eq('user_id', user_id)

    if (updateError) {
      throw new Error(`Failed to update order amount: ${updateError.message}`)
    }

    // Return the result
    return new Response(
      JSON.stringify({
        order_id,
        style_count: styleCount,
        price,
        success: true
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}) 