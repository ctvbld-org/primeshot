import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const isDev = process.env.NODE_ENV === 'development';

function devLog(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

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

    // Ensure service role key is configured for webhook operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.');
      return NextResponse.json(
        { error: 'Service role key not configured' },
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
      devLog(`Webhook: ${event.type} - ${event.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      
      // Return explicit 401 for authentication failures
      return NextResponse.json(
        { 
          error: 'Webhook signature verification failed',
          message: errorMessage 
        },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key for webhook operations
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleSubscriptionPaymentSucceeded(invoice, supabase);
          devLog(`Processed invoice.payment_succeeded: ${invoice.id}`);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionEvent(subscription, supabase);
          devLog(`Processed ${event.type}: ${subscription.id}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription, supabase);
          devLog(`Processed subscription deleted: ${subscription.id}`);
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handleCreditPackPurchase(paymentIntent, supabase);
          devLog(`Processed payment_intent.succeeded: ${paymentIntent.id}`);
          break;
        }

        case 'product.updated':
        case 'price.updated': {
          // Clear cache when Stripe data changes
          devLog(`Cache cleared due to ${event.type}`);
          // Note: CreditService.clearCache() would be called here if accessible
          break;
        }

        default:
          devLog(`Ignored unhandled event type: ${event.type}`);
      }
    } catch (eventError) {
      // Log the error but don't fail the webhook - this prevents Stripe from retrying
      const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
      console.error(`Error processing webhook event ${event.type}:`, errorMessage);
      
      if (eventError instanceof Error && eventError.stack) {
        console.error(eventError.stack);
      }
    }

    // Return a 200 success response to acknowledge receipt of the event
    return NextResponse.json({ 
      received: true, 
      eventId: event.id, 
      eventType: event.type 
    });
  } catch (error) {
    // This is for unexpected errors in the overall webhook handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Critical error handling webhook:', errorMessage);
    
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
 * Handle subscription payment succeeded (invoice.payment_succeeded)
 * Awards credits when subscription renews
 */
async function handleSubscriptionPaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient
) {
  const customerId = (invoice as any).customer as string;
  let subscriptionId = (invoice as any).subscription as string;

  if (!customerId) {
    console.error(`No customer ID in invoice ${invoice.id}`);
    return;
  }

  // Process subscription payments (both initial and renewal)
  const validBillingReasons = [
    'subscription_create',
    'subscription_cycle', 
    'subscription_update',
    'subscription_threshold',
    'subscription'
  ];

  if (!validBillingReasons.includes(invoice.billing_reason as string)) {
    devLog(`Skipping invoice ${invoice.id} - billing reason: ${invoice.billing_reason}`);
    return;
  }

  // If no subscription ID in invoice, try to find by customer
  if (!subscriptionId) {
    const { data: subscriptions, error: lookupError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, user_id, stripe_price_id, plan_name, status')
      .eq('stripe_customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lookupError || !subscriptions || subscriptions.length === 0) {
      console.error(`No active subscription found for customer ${customerId}:`, lookupError?.message);
      return;
    }

    subscriptionId = subscriptions[0].stripe_subscription_id;
  }

  // Get user ID from subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id, stripe_price_id, plan_name')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subError || !subscription) {
    console.error(`Error finding subscription ${subscriptionId}:`, subError?.message);
    return;
  }

  // Update subscription periods if they're missing
  if ((invoice as any).lines?.data?.[0]?.period) {
    const period = (invoice as any).lines.data[0].period;
    const periodStart = new Date(period.start * 1000).toISOString();
    const periodEnd = new Date(period.end * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error(`Failed to update subscription periods:`, updateError.message);
    }
  }

  // Get plan details from Stripe
  try {
    const price = await stripe.prices.retrieve(subscription.stripe_price_id, {
      expand: ['product']
    });

    const product = price.product as Stripe.Product;
    const creditsIncluded = parseInt(product.metadata.credits_included || '0');

    if (creditsIncluded > 0) {
      // Award credits that expire at the end of current billing period
      const expiresAt = (invoice as any).lines?.data?.[0]?.period?.end 
        ? new Date((invoice as any).lines.data[0].period.end * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

      const creditRecord = {
        user_id: subscription.user_id,
        credits: creditsIncluded,
        transaction_type: 'earned' as const,
        source_type: 'subscription' as const,
        source_id: subscriptionId,
        expires_at: expiresAt.toISOString(),
        description: `Credits from subscription ${invoice.billing_reason === 'subscription_create' ? 'activation' : 'renewal'} - ${subscription.plan_name}`,
        metadata: {
          invoice_id: invoice.id,
          billing_reason: invoice.billing_reason,
          billing_period_start: (invoice as any).lines?.data?.[0]?.period?.start 
            ? new Date((invoice as any).lines.data[0].period.start * 1000).toISOString()
            : null,
          billing_period_end: expiresAt.toISOString()
        }
      };

      const { error: creditError } = await supabase
        .from('user_credits')
        .insert(creditRecord);

      if (creditError) {
        console.error(`Error awarding subscription credits:`, creditError.message);
        throw new Error(`Failed to award subscription credits: ${creditError.message}`);
      }

      devLog(`Awarded ${creditsIncluded} credits to user ${subscription.user_id}`);
    }

  } catch (stripeError) {
    console.error('Error fetching plan details from Stripe:', stripeError);
    throw new Error('Failed to process subscription payment');
  }
}

/**
 * Handle subscription creation/update events
 */
async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  if (!subscription.customer) {
    console.error('Missing customer in subscription', subscription.id);
    return;
  }

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.user_id;

  if (!userId) {
    console.error(`No user_id found in customer metadata for customer: ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription items');
    return;
  }

  // Get plan name from Stripe
  const price = await stripe.prices.retrieve(priceId, {
    expand: ['product']
  });
  const product = price.product as Stripe.Product;

  const periodStartSec: number | undefined = (subscription as any).current_period_start
  const periodEndSec: number | undefined = (subscription as any).current_period_end

  const currentPeriodStart = typeof periodStartSec === 'number' && periodStartSec > 0 
    ? new Date(periodStartSec * 1000).toISOString() 
    : null

  const currentPeriodEnd = typeof periodEndSec === 'number' && periodEndSec > 0 
    ? new Date(periodEndSec * 1000).toISOString() 
    : null

  // Upsert subscription record
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_name: product.metadata.plan_name || '',
      status: subscription.status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error upserting subscription:', error.message);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  // Update subscription status to canceled
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating canceled subscription:', error.message);
    throw new Error(`Failed to update canceled subscription: ${error.message}`);
  }
}

/**
 * Handle credit pack purchase (payment_intent.succeeded)
 */
async function handleCreditPackPurchase(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  // Check if this is a credit pack purchase
  if (paymentIntent.metadata?.pack_type !== 'credit_pack') {
    devLog(`Skipping payment intent ${paymentIntent.id} - not a credit pack purchase`);
    return;
  }

  const userId = paymentIntent.metadata?.user_id;
  const credits = parseInt(paymentIntent.metadata?.credits || '0');
  const validityDays = parseInt(paymentIntent.metadata?.validity_days || '60');

  if (!userId || !credits) {
    console.error('Missing user_id or credits in payment intent metadata', paymentIntent.id);
    return;
  }

  // Calculate expiry date (60 days from purchase)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  // Record credit pack purchase
  const { error: purchaseError } = await supabase
    .from('credit_pack_purchases')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_price_id: paymentIntent.metadata?.price_id || '',
      credits_purchased: credits,
      amount_paid: paymentIntent.amount,
      status: 'completed',
      expires_at: expiresAt.toISOString()
    });

  if (purchaseError) {
    console.error('Error recording credit pack purchase:', purchaseError.message);
    throw new Error(`Failed to record credit pack purchase: ${purchaseError.message}`);
  }

  // Award credits
  const { error: creditError } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      credits: credits,
      transaction_type: 'earned',
      source_type: 'credit_pack',
      source_id: paymentIntent.id,
      expires_at: expiresAt.toISOString(),
      description: `Credits from credit pack purchase - ${credits} credits`,
      metadata: {
        payment_intent_id: paymentIntent.id,
        amount_paid: paymentIntent.amount,
        validity_days: validityDays
      }
    });

  if (creditError) {
    console.error('Error awarding credit pack credits:', creditError.message);
    throw new Error(`Failed to award credit pack credits: ${creditError.message}`);
  }

  devLog(`Awarded ${credits} credits to user ${userId} from credit pack purchase`);
} 