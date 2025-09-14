import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil' as any
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

    // Use centralized service client creation
    const supabase = createServiceClient();

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
 * Ensures subscription record exists by creating or updating it
 * Used to handle race conditions between webhook events
 */
async function ensureSubscriptionRecord(
  subscriptionId: string,
  customerId: string,
  supabase: SupabaseClient
): Promise<{ user_id: string; stripe_price_id: string; plan_name: string; was_upgrade?: boolean; old_plan_name?: string } | null> {
  try {
    // First, try to find existing subscription record
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, stripe_price_id, plan_name, cancel_at_period_end, current_period_start, current_period_end')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (existingSubscription) {
      devLog(`Found existing subscription record: ${subscriptionId}, checking for updates`);
      
      // Always fetch latest details from Stripe to check for updates
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product']
      });

      const latestPriceId = subscription.items.data[0]?.price.id;
      const firstItem = subscription.items.data[0];
      const product = firstItem?.price?.product as Stripe.Product;
      const latestPlanName = product?.metadata?.plan_name || '';

      // Check if subscription details have changed (price, plan, or cancellation status)
      const cancelAtPeriodEndChanged = subscription.cancel_at_period_end !== (existingSubscription as any).cancel_at_period_end;

      // Update if price ID, plan name, or cancellation status has changed
      if (latestPriceId !== existingSubscription.stripe_price_id || 
          latestPlanName !== existingSubscription.plan_name ||
          cancelAtPeriodEndChanged) {
        const isUpgrade = latestPlanName !== existingSubscription.plan_name;
        devLog(`Updating subscription record: ${subscriptionId} from ${existingSubscription.plan_name} to ${latestPlanName}`);
        
        // Use type-safe access to subscription period properties
        const subscriptionWithPeriods = subscription as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };

        const currentPeriodStart = subscriptionWithPeriods.current_period_start 
          ? new Date(subscriptionWithPeriods.current_period_start * 1000).toISOString() 
          : null;

        const currentPeriodEnd = subscriptionWithPeriods.current_period_end 
          ? new Date(subscriptionWithPeriods.current_period_end * 1000).toISOString() 
          : null;


        // Preserve existing period dates if new ones are null (common during cancellation)
        const preservedPeriodStart = currentPeriodStart || (existingSubscription as any).current_period_start;
        const preservedPeriodEnd = currentPeriodEnd || (existingSubscription as any).current_period_end;

        // Update subscription record with new details
        const rpcParams = {
          p_user_id: existingSubscription.user_id,
          p_stripe_subscription_id: subscription.id,
          p_stripe_customer_id: customerId,
          p_stripe_price_id: latestPriceId,
          p_plan_name: latestPlanName,
          p_status: subscription.status,
          p_current_period_start: preservedPeriodStart,
          p_current_period_end: preservedPeriodEnd,
          p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
        };
        
        const { error: updateError } = await supabase.rpc('upsert_subscription', rpcParams);

        if (updateError) {
          console.error('Error updating subscription record:', updateError.message);
        } else {
          devLog(`Successfully updated subscription record: ${subscriptionId} to ${latestPlanName}`);
        }

        // Return updated subscription info with upgrade information
        return {
          user_id: existingSubscription.user_id,
          stripe_price_id: latestPriceId,
          plan_name: latestPlanName,
          was_upgrade: isUpgrade,
          old_plan_name: isUpgrade ? existingSubscription.plan_name : undefined
        };
      }
      
      return existingSubscription;
    }

    // If no record exists, create it by fetching from Stripe
    devLog(`Creating missing subscription record for: ${subscriptionId}`);
    
    // Get user ID from customer metadata
    const customer = await stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.user_id;

    if (!userId) {
      console.error(`No user_id found in customer metadata for customer: ${customerId}`);
      return null;
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });

    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error(`No price ID found in subscription items for: ${subscriptionId}`);
      return null;
    }

    // Get plan name from product metadata
    const firstItem = subscription.items.data[0];
    const product = firstItem?.price?.product as Stripe.Product;
    const planName = product?.metadata?.plan_name || '';

    // Use type-safe access to subscription period properties
    const subscriptionWithPeriods = subscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };

    const currentPeriodStart = subscriptionWithPeriods.current_period_start 
      ? new Date(subscriptionWithPeriods.current_period_start * 1000).toISOString() 
      : null;

    const currentPeriodEnd = subscriptionWithPeriods.current_period_end 
      ? new Date(subscriptionWithPeriods.current_period_end * 1000).toISOString() 
      : null;

    // Create subscription record using atomic RPC function
    const { error } = await supabase.rpc('upsert_subscription', {
      p_user_id: userId,
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id: customerId,
      p_stripe_price_id: priceId,
      p_plan_name: planName,
      p_status: subscription.status,
      p_current_period_start: currentPeriodStart,
      p_current_period_end: currentPeriodEnd,
      p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
    });

    if (error) {
      console.error('Error creating subscription record:', error.message);
      return null;
    }

    devLog(`Successfully created subscription record: ${subscriptionId}`);
    return {
      user_id: userId,
      stripe_price_id: priceId,
      plan_name: planName
    };

  } catch (error) {
    console.error('Error ensuring subscription record:', error);
    return null;
  }
}

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

  // If no subscription ID in invoice, get it from Stripe by customer
  if (!subscriptionId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        console.error(`No active subscription found in Stripe for customer ${customerId}`);
        return;
      }

      subscriptionId = subscriptions.data[0].id;
      devLog(`Found subscription ${subscriptionId} for customer ${customerId}`);
    } catch (error) {
      console.error(`Error fetching subscription from Stripe for customer ${customerId}:`, error);
      return;
    }
  }

  // Ensure subscription record exists (handles race condition)
  const subscription = await ensureSubscriptionRecord(subscriptionId, customerId, supabase);
  
  if (!subscription) {
    console.error(`Failed to ensure subscription record exists for: ${subscriptionId}`);
    return;
  }

  // Get plan details from Stripe and process atomically
  try {
    // Retrieve full subscription to access reliable period dates and product metadata
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    }) as Stripe.Subscription;

    // Fallback to now / +30d if Stripe ever omits these (shouldn't happen)
    const currentPeriodStartUnix = (stripeSub as any).current_period_start as number | undefined;
    const currentPeriodEndUnix = (stripeSub as any).current_period_end as number | undefined;

    const periodStartDate = currentPeriodStartUnix
      ? new Date(currentPeriodStartUnix * 1000)
      : new Date();

    const periodEndDate = currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Get credits included from the product metadata (defaults to 0)
    const firstItem = stripeSub.items.data[0];
    const product = firstItem?.price?.product as Stripe.Product | undefined;
    const creditsIncluded = product ? parseInt(product.metadata?.credits_included || '0') : 0;

    devLog(`Processing invoice ${invoice.id} for subscription ${subscriptionId}: ${creditsIncluded} credits`);

    // Check for existing earned credits from this subscription (potential upgrade scenario)
    const { data: existingCredits, error: existingCreditsError } = await supabase
      .from('user_credits')
      .select('id, credits, created_at, description, metadata')
      .eq('user_id', subscription.user_id)
      .eq('source_type', 'subscription')
      .eq('source_id', subscriptionId)
      .eq('transaction_type', 'earned')
      .order('created_at', { ascending: false });

    if (existingCreditsError) {
      console.error('Error checking existing credits:', existingCreditsError.message);
      throw new Error(`Failed to check existing credits: ${existingCreditsError.message}`);
    }

    // Check if this is an upgrade - with new upgrade logic, we preserve existing credits
    const isUpgrade = stripeSub.metadata?.is_upgrade === 'true';
    
    // If there are existing earned credits from this subscription, this was the old pro-rated upgrade system
    // With the new upgrade system (cancel + create new), we don't expire credits anymore
    if (existingCredits && existingCredits.length > 0 && !isUpgrade) {
      devLog(`Found ${existingCredits.length} existing credit entries for subscription ${subscriptionId}`);
      
      // Only expire credits if this is NOT an upgrade (legacy behavior for subscription renewals)
      const { error: expireError } = await supabase
        .from('user_credits')
        .update({
          transaction_type: 'expired',
          description: `Subscription renewal - ${subscription.plan_name} plan credits replaced previous period`,
          metadata: {
            ...existingCredits[0].metadata,
            expired_reason: 'subscription_renewal',
            expired_at: new Date().toISOString(),
            invoice_id: invoice.id,
            new_plan_name: subscription.plan_name
          }
        })
        .eq('user_id', subscription.user_id)
        .eq('source_type', 'subscription')
        .eq('source_id', subscriptionId)
        .eq('transaction_type', 'earned');

      if (expireError) {
        console.error('Error expiring existing credits:', expireError.message);
        throw new Error(`Failed to expire existing credits: ${expireError.message}`);
      }

      const totalExistingCredits = existingCredits.reduce((sum, credit) => sum + credit.credits, 0);
      devLog(`Expired ${totalExistingCredits} credits from previous billing period`);
    } else if (isUpgrade) {
      devLog(`This is an upgrade - preserving existing credits from previous subscription`);
    }

    const description = `Credits from subscription ${invoice.billing_reason === 'subscription_create' ? (isUpgrade ? 'upgrade' : 'activation') : 'renewal'} - ${subscription.plan_name}`;
    const metadata = {
      invoice_id: invoice.id,
      billing_reason: invoice.billing_reason,
      billing_period_start: periodStartDate.toISOString(),
      billing_period_end: periodEndDate.toISOString(),
      is_upgrade: isUpgrade,
      was_upgrade: subscription.was_upgrade || false,
      old_plan_name: subscription.old_plan_name
    };

    if (creditsIncluded > 0) {
      // Atomically update periods and award credits
      const { error: atomicError } = await supabase.rpc('award_subscription_credits', {
        p_user_id: subscription.user_id,
        p_subscription_id: subscriptionId,
        p_credits: creditsIncluded,
        p_expires_at: periodEndDate.toISOString(),
        p_period_start: periodStartDate.toISOString(),
        p_period_end: periodEndDate.toISOString(),
        p_description: description,
        p_metadata: metadata
      });

      if (atomicError) {
        console.error('Error in atomic subscription credit operation:', atomicError.message);
        throw new Error(`Failed to process subscription credits atomically: ${atomicError.message}`);
      }

      devLog(`Atomically awarded ${creditsIncluded} credits to user ${subscription.user_id}`);
    } else {
      // No credits to award, but still keep subscription periods up-to-date
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          current_period_start: periodStartDate.toISOString(),
          current_period_end: periodEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Failed to update subscription periods:', updateError.message);
      } else {
        devLog(`Updated subscription periods for ${subscriptionId} (no credits included)`);
      }
    }

  } catch (stripeError) {
    console.error('Error processing subscription payment:', stripeError);
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

  // Use the centralized function to ensure subscription record exists
  const subscriptionRecord = await ensureSubscriptionRecord(subscription.id, customerId, supabase);
  
  if (!subscriptionRecord) {
    console.error(`Failed to create/update subscription record for: ${subscription.id}`);
    return;
  }

  // For active subscriptions, ensure this user only has one active subscription
  if (subscription.status === 'active') {
    try {
      // First, check if this is an upgrade with a specific previous subscription to cancel
      const previousSubscriptionId = subscription.metadata?.previous_subscription_id;
      
      if (previousSubscriptionId && previousSubscriptionId !== '') {
        devLog(`This is an upgrade subscription - canceling specific previous subscription: ${previousSubscriptionId}`);
        
        try {
          // First check if the subscription still exists and is active
          const previousSub = await stripe.subscriptions.retrieve(previousSubscriptionId);
          
          if (previousSub.status === 'active') {
            // Cancel the specific previous subscription in Stripe
            await stripe.subscriptions.cancel(previousSubscriptionId);
            devLog(`Successfully canceled previous subscription: ${previousSubscriptionId}`);
          } else {
            devLog(`Previous subscription ${previousSubscriptionId} is already ${previousSub.status} - no need to cancel`);
          }
        } catch (cancelError) {
          console.error(`Failed to cancel previous subscription ${previousSubscriptionId}:`, cancelError);
          // Log the error but don't fail the webhook - the subscription might already be canceled
        }
      }
      
      // Also check for any other active subscriptions for this user (safety net)
      const { data: userSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', subscriptionRecord.user_id)
        .eq('status', 'active')
        .neq('stripe_subscription_id', subscription.id); // Exclude the current subscription

      // If there are other active subscriptions, cancel them
      if (userSubscriptions && userSubscriptions.length > 0) {
        devLog(`Found ${userSubscriptions.length} other active subscriptions for user ${subscriptionRecord.user_id}, canceling them`);
        
        for (const oldSub of userSubscriptions) {
          // Skip if this is the same subscription we already canceled above
          if (oldSub.stripe_subscription_id === previousSubscriptionId) {
            devLog(`Skipping ${oldSub.stripe_subscription_id} - already canceled above`);
            continue;
          }
          
          try {
            // Cancel the old subscription in Stripe
            await stripe.subscriptions.cancel(oldSub.stripe_subscription_id);
            devLog(`Canceled old subscription: ${oldSub.stripe_subscription_id}`);
          } catch (cancelError) {
            console.error(`Failed to cancel old subscription ${oldSub.stripe_subscription_id}:`, cancelError);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for duplicate subscriptions:', error);
    }
  }

  devLog(`Successfully processed subscription event for: ${subscription.id}`);
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

  const description = `Credits from credit pack purchase - ${credits} credits`;
  const metadata = {
    payment_intent_id: paymentIntent.id,
    amount_paid: paymentIntent.amount,
    validity_days: validityDays
  };

  // Use atomic RPC function to record purchase and award credits
  const { error: atomicError } = await supabase.rpc('process_credit_pack_purchase', {
    p_user_id: userId,
    p_payment_intent_id: paymentIntent.id,
    p_price_id: paymentIntent.metadata?.price_id || '',
    p_credits: credits,
    p_amount_paid: paymentIntent.amount,
    p_expires_at: expiresAt.toISOString(),
    p_description: description,
    p_metadata: metadata
  });

  if (atomicError) {
    console.error('Error in atomic credit pack purchase operation:', atomicError.message);
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`);
  }

  devLog(`Atomically processed credit pack purchase: ${credits} credits awarded to user ${userId}`);
} 