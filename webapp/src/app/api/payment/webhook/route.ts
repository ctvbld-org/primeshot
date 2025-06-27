import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // Ensure webhook secret is configured
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret. Please set STRIPE_WEBHOOK_SECRET environment variable.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      console.error('No Stripe signature found in the request headers');
      return NextResponse.json(
        { error: 'Missing Stripe signature in headers' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      console.log(`✅ Webhook signature verified for event type: ${event.type}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('⚠️ Webhook signature verification failed:', errorMessage);
      
      // Return explicit 401 for authentication failures
      return NextResponse.json(
        { 
          error: 'Webhook signature verification failed',
          message: errorMessage 
        },
        { status: 401 }
      );
    }

    // Create Supabase client for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: async name => (await cookies()).get(name)?.value,
          set: () => {}, // We don't need to set cookies in this route handler
          remove: () => {}, // We don't need to remove cookies in this route handler
        },
      }
    );

    // Log event information for debugging
    console.log(`Processing webhook event: ${event.id}, type: ${event.type}`);

    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(paymentIntent, supabase);
          console.log(`✅ Successfully processed payment_intent.succeeded for intent: ${paymentIntent.id}`);
          break;
        }

        case 'payment_intent.payment_failed': {
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(failedPaymentIntent, supabase);
          console.log(`✅ Successfully processed payment_intent.payment_failed for intent: ${failedPaymentIntent.id}`);
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(session, supabase);
          console.log(`✅ Successfully processed checkout.session.completed for session: ${session.id}`);
          break;
        }

        default:
          console.log(`Ignored unhandled event type: ${event.type}`);
      }
    } catch (eventError) {
      // Log the error but don't fail the webhook - this prevents Stripe from retrying
      // Ideally, this should be sent to an error monitoring service
      const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
      console.error(`⚠️ Error processing webhook event ${event.type}:`, errorMessage);
      
      if (eventError instanceof Error && eventError.stack) {
        console.error(eventError.stack);
      }
      
      // Consider adding custom error tracking here
      // await logErrorToMonitoringService(event.id, event.type, errorMessage);
    }

    // Return a 200 success response to acknowledge receipt of the event
    // We do this even if processing failed to prevent Stripe from retrying valid but unprocessable webhooks
    return NextResponse.json({ 
      received: true, 
      eventId: event.id, 
      eventType: event.type 
    });
  } catch (error) {
    // This is for unexpected errors in the overall webhook handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🚨 Critical error handling webhook:', errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    
    return NextResponse.json(
      { error: 'Webhook handler failed', message: errorMessage },
      { status: 500 }
    );
  }
}

// Configure POST route to not verify the request body
// This is important because we need the raw body to verify the webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Unified function to update payment status to succeeded
 * This eliminates duplicate code between different webhook handlers
 */
async function updatePaymentToSucceeded(
  orderId: string,
  eventSourceId: string,
  eventType: string,
  supabase: ReturnType<typeof createServerClient>
) {
  console.log(`Processing successful payment for order: ${orderId}, event: ${eventType}, id: ${eventSourceId}`);

  // Update order status to paid
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'succeeded',
      updated_at: new Date().toISOString(),
      metadata: {
        last_payment_event: eventType,
        payment_event_id: eventSourceId,
        payment_processed_at: new Date().toISOString()
      }
    })
    .eq('id', orderId);

  if (orderError) {
    console.error(`Error updating order status for order ${orderId}:`, orderError.message);
    throw new Error(`Failed to update order status: ${orderError.message}`);
  }

  // Update styles in this order to processing
  const { error: stylesError } = await supabase
    .from('styles')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  if (stylesError) {
    console.error(`Error updating styles for order ${orderId}:`, stylesError.message);
    // Continue despite style update error - it's less critical than the order status
  }

  // Get user ID from the order
  const { data: order, error: fetchOrderError } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single();

  if (fetchOrderError) {
    console.error(`Error fetching user_id for order ${orderId}:`, fetchOrderError.message);
    return; // Skip user progress update if we can't get the user ID
  }

  if (order) {
    // Update user progress to mark payment as completed
    const { error: progressError } = await supabase
      .from('user_progress')
      .update({
        completed_stages: supabase.sql`array_append(completed_stages, 'payment')`,
        current_stage: 'albums',
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', order.user_id);
      
    if (progressError) {
      console.error(`Error updating user progress for user ${order.user_id}:`, progressError.message);
    }
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createServerClient>
) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.error('No orderId found in payment intent metadata', paymentIntent.id);
    return;
  }

  await updatePaymentToSucceeded(
    orderId, 
    paymentIntent.id, 
    'payment_intent.succeeded',
    supabase
  );
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createServerClient>
) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.error('No orderId found in failed payment intent metadata', paymentIntent.id);
    return;
  }

  console.log(`Processing failed payment for order: ${orderId}, payment intent: ${paymentIntent.id}`);

  // Get the error information
  const lastPaymentError = paymentIntent.last_payment_error;
  const errorMessage = lastPaymentError ? lastPaymentError.message : 'Unknown payment failure';
  const errorCode = lastPaymentError?.code || 'unknown';

  // Update order status to payment_failed
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
      metadata: {
        ...paymentIntent.metadata,
        payment_error: errorMessage,
        payment_error_code: errorCode,
        payment_failure_timestamp: new Date().toISOString()
      }
    })
    .eq('id', orderId);
    
  if (updateError) {
    console.error(`Error updating order status for failed payment ${orderId}:`, updateError.message);
  }
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServerClient>
) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error('No orderId found in checkout session metadata', session.id);
    return;
  }

  await updatePaymentToSucceeded(
    orderId,
    session.id,
    'checkout.session.completed',
    supabase
  );
} 