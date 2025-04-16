import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyOrderPrice } from '@/lib/server/price-verification';
import { getCheckoutSessionIdempotencyKey, getRetryIdempotencyKey } from '@/lib/server/idempotency';

// Initialize Stripe with latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookies().get(name)?.value,
          set: () => {}, // We don't need to set cookies in this route handler
          remove: () => {}, // We don't need to remove cookies in this route handler
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to make a payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, amount, metadata = {}, retryAttempt = 0 } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: orderId and amount' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', session.user.id)
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
      console.warn(`Payment amount verification failed: ${verification.reason}. Order ID: ${orderId}, User ID: ${session.user.id}`);
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
    const verifiedAmount = verification.calculatedAmount;
    console.log(`✅ Payment amount verified for order ${orderId}: ${verifiedAmount}`);

    // Generate an appropriate idempotency key based on whether this is a retry
    const idempotencyKey = retryAttempt > 0
      ? getRetryIdempotencyKey('checkout_session', orderId, session.user.id, verifiedAmount)
      : getCheckoutSessionIdempotencyKey(orderId, session.user.id, verifiedAmount);
    
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
          userId: session.user.id,
          styleCount: verification.styleCount.toString(), // Add style count for reference
          verifiedAmount: 'true', // Flag to indicate the amount was verified
          createdAt: new Date().toISOString(),
          ...enhancedMetadata,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/payment`,
      },
      {
        idempotencyKey, // Using idempotency key for creation
      }
    );

    console.log(`Checkout session created: ${checkoutSession.id} with idempotency key: ${idempotencyKey}`);

    // Update order with session ID and VERIFIED amount
    await supabase
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