import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import { createSecuredHandler, SECURITY_CONFIGS } from '@/lib/security-middleware';

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

// Secured webhook handler with rate limiting for external services
const securedPOST = createSecuredHandler(
  async (req: any) => {
    return await handleWebhookRequest(req);
  },
  SECURITY_CONFIGS.WEBHOOK
);

// Extract webhook logic into a separate function
async function handleWebhookRequest(request: NextRequest): Promise<NextResponse> {
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

    // Check if we've already processed this event (deduplication)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('stripe_event_id', event.id)
      .single();
    
    if (existingEvent) {
      devLog(`Webhook ${event.id} already processed with status: ${existingEvent.status}`);
      return NextResponse.json({ 
        received: true, 
        status: 'duplicate',
        message: 'Event already processed' 
      });
    }
    
    // Record that we're processing this event
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: 'processing',
        received_at: new Date().toISOString()
      });
    
    if (insertError && insertError.code !== '23505') { // 23505 is unique violation
      console.error('Failed to insert webhook event:', insertError);
      // Continue processing anyway, but log the error
    }

    // Handle different event types
    let processingResult: any = null;
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          processingResult = await handleSubscriptionPaymentSucceeded(invoice, supabase, event.id);
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

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(session, supabase);
          devLog(`Processed checkout.session.completed: ${session.id}`);
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
      
      // Update webhook event status to completed
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          result: processingResult
        })
        .eq('stripe_event_id', event.id);
      
    } catch (eventError) {
      // Log the error but don't fail the webhook - this prevents Stripe from retrying
      const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
      console.error(`Error processing webhook event ${event.type}:`, errorMessage);
      
      if (eventError instanceof Error && eventError.stack) {
        console.error(eventError.stack);
      }
      
      // Update webhook event status to failed
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'failed',
          processed_at: new Date().toISOString(),
          error: errorMessage
        })
        .eq('stripe_event_id', event.id);
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

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}

// Configure POST route to not verify the request body
// This is important because we need the raw body to verify the webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
};



/**
 * Ensure a user exists in public.users table
 * This is a defensive measure in case the signup trigger failed
 */
async function ensureUserExists(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // Check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return true; // User already exists
    }

    // User doesn't exist - fetch from auth.users and create
    console.warn(`User ${userId} missing from public.users - attempting to create`);
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error(`Failed to fetch auth user ${userId}:`, authError);
      return false;
    }

    // Extract metadata same way as handle_new_user trigger
    const fullName = authUser.user.user_metadata?.full_name
      || authUser.user.user_metadata?.name
      || (authUser.user.user_metadata?.given_name && authUser.user.user_metadata?.family_name
        ? `${authUser.user.user_metadata.given_name} ${authUser.user.user_metadata.family_name}`.trim()
        : null)
      || authUser.user.user_metadata?.user_name
      || null;

    const avatarUrl = authUser.user.user_metadata?.avatar_url
      || authUser.user.user_metadata?.picture
      || null;

    // Insert into public.users
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: authUser.user.email || '',
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: authUser.user.created_at,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`Failed to create user ${userId} in public.users:`, insertError);
      return false;
    }

    console.log(`Successfully created missing user ${userId} in public.users`);
    return true;
  } catch (error) {
    console.error(`Error ensuring user exists for ${userId}:`, error);
    return false;
  }
}

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
        const currentPeriodStart = (subscription as any).current_period_start 
          ? new Date((subscription as any).current_period_start * 1000).toISOString() 
          : null;

        const currentPeriodEnd = (subscription as any).current_period_end 
          ? new Date((subscription as any).current_period_end * 1000).toISOString() 
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

    // CRITICAL: Ensure user exists in public.users before creating subscription
    // This prevents foreign key constraint violations if the signup trigger failed
    const userExists = await ensureUserExists(userId, supabase);
    if (!userExists) {
      console.error(`Failed to ensure user ${userId} exists in public.users - cannot create subscription`);
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
    const currentPeriodStart = (subscription as any).current_period_start 
      ? new Date((subscription as any).current_period_start * 1000).toISOString() 
      : null;

    const currentPeriodEnd = (subscription as any).current_period_end 
      ? new Date((subscription as any).current_period_end * 1000).toISOString() 
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
  supabase: SupabaseClient,
  eventId: string
) {
  const customerId = (invoice as any).customer as string;
  let subscriptionId = (invoice as any).subscription as string;

  if (!customerId) {
    console.error(`No customer ID in invoice ${invoice.id}`);
    return { success: false, error: 'No customer ID' };
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
    return { success: true, skipped: true, reason: 'invalid_billing_reason' };
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
        return { success: false, error: 'No active subscription' };
      }

      subscriptionId = subscriptions.data[0].id;
      devLog(`Found subscription ${subscriptionId} for customer ${customerId}`);
    } catch (error) {
      console.error(`Error fetching subscription from Stripe for customer ${customerId}:`, error);
      return { success: false, error: 'Failed to fetch subscription' };
    }
  }

  // Ensure subscription record exists (handles race condition)
  const subscription = await ensureSubscriptionRecord(subscriptionId, customerId, supabase);
  
  if (!subscription) {
    console.error(`Failed to ensure subscription record exists for: ${subscriptionId}`);
    return { success: false, error: 'Failed to ensure subscription record' };
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

    // Calculate which month this is (for tracking)
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('created_at, last_awarded_month')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    const monthsSinceStart = subData?.created_at 
      ? Math.floor((Date.now() - new Date(subData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25 / 12))
      : 0;

    // Check for existing earned credits from this subscription (potential upgrade scenario)
    const { data: existingCredits, error: existingCreditsError } = await supabase
      .from('user_credits')
      .select('id, credits, created_at, description, metadata')
      .eq('user_id', subscription.user_id)
      .eq('source_type', 'subscription')
      .eq('source_id', subscriptionId)
      .eq('transaction_type', 'earned')
      .is('invoice_id', null) // Only check old credits without invoice_id
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
        .eq('transaction_type', 'earned')
        .is('invoice_id', null); // Only expire old credits

      if (expireError) {
        console.error('Error expiring existing credits:', expireError.message);
        throw new Error(`Failed to expire existing credits: ${expireError.message}`);
      }

      const totalExistingCredits = existingCredits.reduce((sum, credit) => sum + credit.credits, 0);
      devLog(`Expired ${totalExistingCredits} credits from previous billing period`);
    } else if (isUpgrade) {
      devLog(`This is an upgrade - preserving existing credits from previous subscription`);
    }

    const isInitialSubscription = invoice.billing_reason === 'subscription_create';
    const description = `Credits from subscription ${isInitialSubscription ? (isUpgrade ? 'upgrade' : 'activation') : 'renewal'} - ${subscription.plan_name}`;
    
    if (creditsIncluded > 0) {
      if (isInitialSubscription) {
        // NEW SYSTEM: Initialize quota for new subscription
        devLog(`Initializing subscription quota: ${creditsIncluded} credits for ${subscriptionId}`);
        
        const { error: initError } = await supabase
          .from('user_subscriptions')
          .update({
            monthly_credits_quota: creditsIncluded,
            current_period_credits_used: 0,
            last_quota_reset_at: periodStartDate.toISOString(),
            current_period_start: periodStartDate.toISOString(),
            current_period_end: periodEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (initError) {
          console.error('Error initializing subscription quota:', initError.message);
          throw new Error(`Failed to initialize subscription quota: ${initError.message}`);
        }

        devLog(`Successfully initialized quota for subscription ${subscriptionId}: ${creditsIncluded} credits`);
        
        return { 
          success: true, 
          status: 'quota_initialized', 
          invoice_id: invoice.id,
          credits: creditsIncluded,
          subscription_id: subscriptionId
        };
      } else {
        // NEW SYSTEM: Reset quota for subscription renewal
        devLog(`Resetting subscription quota for renewal: ${subscriptionId}`);
        
        const { error: resetError } = await supabase.rpc('reset_subscription_quota', {
          p_subscription_id: subscriptionId
        });

        if (resetError) {
          console.error('Error resetting subscription quota:', resetError.message);
          throw new Error(`Failed to reset subscription quota: ${resetError.message}`);
        }

        devLog(`Successfully reset quota for subscription ${subscriptionId}`);
        
        return { 
          success: true, 
          status: 'quota_reset', 
          invoice_id: invoice.id,
          subscription_id: subscriptionId
        };
      }
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
      
      return { 
        success: true, 
        status: 'no_credits', 
        invoice_id: invoice.id 
      };
    }

  } catch (stripeError) {
    console.error('Error processing subscription payment:', stripeError);
    return { success: false, error: 'Failed to process subscription payment', details: stripeError };
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

  // NEW SYSTEM: Initialize quota for new active subscriptions
  if (subscription.status === 'active') {
    try {
      // Get credits from product metadata
      const stripeSub = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ['items.data.price.product']
      });
      
      const firstItem = stripeSub.items.data[0];
      const product = firstItem?.price?.product as Stripe.Product | undefined;
      const creditsIncluded = product ? parseInt(product.metadata?.credits_included || '0') : 0;
      
      if (creditsIncluded > 0) {
        // Initialize quota fields if not already set
        const { data: currentSub } = await supabase
          .from('user_subscriptions')
          .select('monthly_credits_quota')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (currentSub && !currentSub.monthly_credits_quota) {
          devLog(`Initializing quota for new subscription ${subscription.id}: ${creditsIncluded} credits`);
          
          const currentPeriodStart = (subscription as any).current_period_start 
            ? new Date((subscription as any).current_period_start * 1000).toISOString() 
            : new Date().toISOString();
          
          const currentPeriodEnd = (subscription as any).current_period_end 
            ? new Date((subscription as any).current_period_end * 1000).toISOString() 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          await supabase
            .from('user_subscriptions')
            .update({
              monthly_credits_quota: creditsIncluded,
              current_period_credits_used: 0,
              last_quota_reset_at: currentPeriodStart,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
          
          devLog(`Successfully initialized quota for ${subscription.id}`);
        }
      }
    } catch (error) {
      console.error('Error initializing subscription quota:', error);
      // Don't fail the webhook - this is not critical
    }

    // Handle duplicate subscriptions - atomically cancel old subscriptions in database
    try {
      // Use RPC to atomically cancel all other active subscriptions (including Free plans)
      const { data: cancellationResult, error: cancellationError } = await supabase.rpc(
        'handle_subscription_activation',
        {
          p_user_id: subscriptionRecord.user_id,
          p_new_stripe_subscription_id: subscription.id
        }
      );

      if (cancellationError) {
        console.error('Error calling handle_subscription_activation:', cancellationError);
        // Don't fail the webhook - log and continue
      } else if (cancellationResult) {
        devLog(`Subscription activation result:`, cancellationResult);
        
        // Now cancel the Stripe subscriptions for any paid plans that were canceled
        const canceledSubs = cancellationResult.canceled_subscriptions || [];
        
        for (const canceledSub of canceledSubs) {
          // Only cancel in Stripe if it's a paid plan (has stripe_subscription_id)
          if (!canceledSub.was_free_plan && canceledSub.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(canceledSub.stripe_subscription_id);
              devLog(`Canceled Stripe subscription: ${canceledSub.stripe_subscription_id} (${canceledSub.plan_name})`);
            } catch (stripeCancelError) {
              console.error(`Failed to cancel Stripe subscription ${canceledSub.stripe_subscription_id}:`, stripeCancelError);
              // Don't fail - database is already updated
            }
          } else {
            devLog(`Skipped Stripe cancellation for Free plan: ${canceledSub.plan_name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling subscription activation:', error);
      // Don't fail the webhook - this is a safety net operation
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
 * Handle checkout session completed (for 100% coupon credit packs ONLY)
 * This fires for ALL checkout completions, but we only process 100% coupon purchases here.
 * Regular paid purchases are handled by payment_intent.succeeded to avoid race conditions.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  // Only process credit pack purchases (mode: 'payment')
  if (session.mode !== 'payment' || session.metadata?.pack_type !== 'credit_pack') {
    devLog(`Skipping checkout session ${session.id} - not a credit pack purchase`);
    return;
  }

  // Skip if payment_intent exists - let payment_intent.succeeded handle regular payments
  // This event should ONLY process 100% coupon purchases (no payment_intent)
  if (session.payment_intent) {
    devLog(`Skipping checkout session ${session.id} - has payment_intent, will be handled by payment_intent.succeeded`);
    return;
  }

  const userId = session.metadata?.user_id;
  const credits = parseInt(session.metadata?.credits || '0');
  const validityDays = parseInt(session.metadata?.validity_days || '60');

  if (!userId || !credits) {
    console.error('Missing user_id or credits in checkout session metadata', session.id);
    return;
  }

  // For 100% coupon purchases, use session ID as the unique identifier
  const sourceId = session.id;

  // Amount is 0 for 100% coupon
  const amountPaid = session.amount_total || 0;

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  const description = `Credits from credit pack purchase (100% coupon) - ${credits} credits`;
  const metadata = {
    checkout_session_id: session.id,
    amount_paid: amountPaid,
    validity_days: validityDays,
    coupon_applied: true,
    payment_method: '100% coupon'
  };

  devLog(`Processing 100% coupon checkout session for credit pack: ${credits} credits for user ${userId}`);

  // Use atomic RPC function to record purchase and award credits
  const { error: atomicError } = await supabase.rpc('process_credit_pack_purchase', {
    p_user_id: userId,
    p_payment_intent_id: sourceId,
    p_price_id: session.metadata?.price_id || '',
    p_credits: credits,
    p_amount_paid: amountPaid,
    p_expires_at: expiresAt.toISOString(),
    p_description: description,
    p_metadata: metadata
  });

  if (atomicError) {
    console.error('Error in atomic credit pack purchase operation (100% coupon):', atomicError.message);
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`);
  }

  devLog(`Successfully processed 100% coupon credit pack: ${credits} credits awarded to user ${userId}`);
}

/**
 * Handle credit pack purchase (payment_intent.succeeded)
 * This fires for regular PAID purchases. For 100% coupon purchases, only checkout.session.completed fires.
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

  devLog(`Processing paid credit pack purchase: ${credits} credits for user ${userId}, amount: $${paymentIntent.amount / 100}`);

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  const description = `Credits from credit pack purchase - ${credits} credits`;
  const metadata = {
    payment_intent_id: paymentIntent.id,
    amount_paid: paymentIntent.amount,
    validity_days: validityDays,
    coupon_applied: false,
    payment_method: 'card'
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
    console.error('Error in atomic credit pack purchase operation (paid):', atomicError.message);
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`);
  }

  devLog(`Successfully processed paid credit pack purchase: ${credits} credits awarded to user ${userId}`);
} 