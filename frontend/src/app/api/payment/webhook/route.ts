import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Create Supabase client for database operations
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

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, supabase);
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(failedPaymentIntent, supabase);
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 success response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
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
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createServerClient>
) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.error('No orderId found in payment intent metadata');
    return;
  }

  // Update order status to paid
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Update styles in this order to processing
  await supabase
    .from('styles')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  // Get user ID from the order
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single();

  if (order) {
    // Update user progress to mark payment as completed
    await supabase
      .from('user_progress')
      .update({
        completed_stages: supabase.sql`array_append(completed_stages, 'payment')`,
        current_stage: 'dashboard',
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', order.user_id);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createServerClient>
) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.error('No orderId found in payment intent metadata');
    return;
  }

  // Update order status to payment_failed
  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
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
    console.error('No orderId found in checkout session metadata');
    return;
  }

  // Update order status to paid
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Update styles in this order to processing
  await supabase
    .from('styles')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  // Get user ID from the order
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single();

  if (order) {
    // Update user progress to mark payment as completed
    await supabase
      .from('user_progress')
      .update({
        completed_stages: supabase.sql`array_append(completed_stages, 'payment')`,
        current_stage: 'dashboard',
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', order.user_id);
  }
} 