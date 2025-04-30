import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyOrderPrice } from '@/lib/server/price-verification';
import { getCheckoutSessionIdempotencyKey, getRetryIdempotencyKey } from '@/lib/server/idempotency';

// Check if STRIPE_SECRET_KEY is set
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('CRITICAL ERROR: STRIPE_SECRET_KEY is not set. Payment functionality will fail.');
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Check if NEXT_PUBLIC_APP_URL is set
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
if (!APP_URL) {
  console.error('CRITICAL ERROR: NEXT_PUBLIC_APP_URL is not set. Payment redirects will fail.');
  throw new Error('Missing required environment variable: NEXT_PUBLIC_APP_URL');
}

// Initialize Stripe with latest API version
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to make a payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, amount, metadata = {}, retryAttempt = 0 } = body;

    if (!orderId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: orderId and amount' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {  
      return NextResponse.json(  
        { error: 'Invalid amount supplied' },  
        { status: 400 }  
      );  
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to this user' },
        { status: 404 }
      );
    }

    // IMPORTANT: Verify the requested amount matches the calculated price based on style count
    const verification = await verifyOrderPrice(orderId, amount, supabase);
    
    if (!verification.isValid) {
      console.warn(`Payment amount verification failed: ${verification.reason}. Order ID: ${orderId}, User ID: ${user.id}`);
      return NextResponse.json(
        { 
          error: 'Invalid payment amount', 
          details: verification.reason,
          expectedAmount: verification.calculatedAmount
        },
        { status: 400 }
      );
    }
    
    // If verification passed, continue with the verified amount
    let verifiedAmount = verification.calculatedAmount;
    
    // Ensure amount is a non-negative integer (required by Stripe)
    if (typeof verifiedAmount !== 'number' || !Number.isInteger(verifiedAmount) || verifiedAmount < 0) {
      console.error(`Invalid verifiedAmount: ${verifiedAmount}. Must be a non-negative integer.`);
      return NextResponse.json(
        { error: 'Payment processing error: Invalid amount format' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Payment amount verified for order ${orderId}: ${verifiedAmount}`);

    // Generate an appropriate idempotency key based on whether this is a retry
    const idempotencyKey = retryAttempt > 0
      ? getRetryIdempotencyKey('checkout_session', orderId, user.id, verifiedAmount)
      : getCheckoutSessionIdempotencyKey(orderId, user.id, verifiedAmount);
    
    console.log(`Creating checkout session with idempotency key: ${idempotencyKey}`);

    // Add request info to metadata for tracking/debugging
    const enhancedMetadata = {
      ...metadata,
      idempotencyKey,
      requestId: crypto.randomUUID(), // Unique ID for this specific request
      retryAttempt: retryAttempt.toString(),
    };

    // Get styles for this order
    const { data: styles } = await supabase
      .from('styles')
      .select('id, name')
      .eq('order_id', orderId);

    // Create a readable list of styles
    const stylesList = styles?.map(style => style.name).join(', ') || 'Custom Headshots';
    
    // Create checkout session with idempotency key
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Professional Headshots',
                description: `Styles: ${stylesList}`,
              },
              unit_amount: verifiedAmount, // Use VERIFIED amount
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId,
          userId: user.id,
          styleCount: verification.styleCount.toString(), // Add style count for reference
          verifiedAmount: 'true', // Flag to indicate the amount was verified
          createdAt: new Date().toISOString(),
          ...enhancedMetadata,
        },
        success_url: `${APP_URL}/app/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/app/payment`,
      },
      {
        idempotencyKey, // Using idempotency key for creation
      }
    );

    console.log(`Checkout session created: ${checkoutSession.id} with idempotency key: ${idempotencyKey}`);

    // Update order with session ID and VERIFIED amount
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_intent_id: checkoutSession.payment_intent as string || null,
        checkout_session_id: checkoutSession.id,
        payment_status: 'checkout_started',
        status: 'pending_payment',
        amount: verifiedAmount, // Always use VERIFIED amount
        updated_at: new Date().toISOString(),
        idempotency_key: idempotencyKey, // Store the idempotency key for reference
      })
      .eq('id', orderId);

    // Handle database update failure
    if (updateError) {
      console.error(`Failed to update order record: ${updateError.message}`, updateError);
      
      // Log additional context for debugging
      console.error(`Order context: id=${orderId}, session=${checkoutSession.id}`);
      
      // Return error to client so they can handle it properly
      return NextResponse.json(
        { 
          error: 'Failed to update order record',
          code: 'DB_UPDATE_ERROR',
          details: 'Payment initiated but order record update failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      idempotencyKey
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 