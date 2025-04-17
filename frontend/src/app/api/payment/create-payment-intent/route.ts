import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Order } from '@/lib/types'; // Import Order type
import { verifyOrderPrice } from '@/lib/server/price-verification';
import { 
  getPaymentIntentIdempotencyKey, 
  getPaymentIntentUpdateIdempotencyKey,
  getRetryIdempotencyKey
} from '@/lib/server/idempotency';

// Check if STRIPE_SECRET_KEY is set
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('CRITICAL ERROR: STRIPE_SECRET_KEY is not set. Payment functionality will fail.');
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Initialize Stripe with latest API version
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    
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

    // Get the session after confirming user exists
    const { data: { session } } = await supabase.auth.getSession();

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

    // Verify order exists and belongs to user, select relevant fields
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, payment_intent_id, amount, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({ error: 'Error fetching order details' }, { status: 500 });
    }
    
    if (!orderResult) {
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
    
    const order = orderResult as Order; // Cast to Order type
    
    // Generate an appropriate idempotency key based on whether this is a retry
    const baseIdempotencyKey = retryAttempt > 0
      ? getRetryIdempotencyKey('payment_intent', orderId, user.id, verifiedAmount)
      : getPaymentIntentIdempotencyKey(orderId, user.id, verifiedAmount);
    
    // Add request info to metadata for tracking/debugging
    const enhancedMetadata = {
      ...metadata,
      idempotencyKey: baseIdempotencyKey,
      requestId: crypto.randomUUID(), // Unique ID for this specific request
      retryAttempt: retryAttempt.toString(),
    };

    let paymentIntent: Stripe.PaymentIntent;

    // Check if there's an existing, usable Payment Intent
    if (order.payment_intent_id && 
        (order.status === 'draft' || order.status === 'pending_payment')) {
      try {
        console.log(`Attempting to retrieve existing PI: ${order.payment_intent_id}`);
        const existingPI = await stripe.paymentIntents.retrieve(order.payment_intent_id);

        // Check if PI is in a state that allows updates (e.g., requires_payment_method)
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existingPI.status)) {
          if (existingPI.amount === verifiedAmount) {
            // Amount matches, reuse the existing PI
            console.log(`Reusing existing PI ${existingPI.id}, amount matches.`);
            paymentIntent = existingPI;
          } else {
            // Amount differs, update the existing PI
            console.log(`Updating existing PI ${existingPI.id} amount from ${existingPI.amount} to ${verifiedAmount}`);
            
            // Generate update-specific idempotency key
            const updateIdempotencyKey = getPaymentIntentUpdateIdempotencyKey(
              existingPI.id,
              orderId,
              user.id,
              verifiedAmount
            );
            
            paymentIntent = await stripe.paymentIntents.update(
              order.payment_intent_id,
              {
                amount: verifiedAmount, // Update amount with VERIFIED amount
                metadata: { 
                  ...existingPI.metadata, // Keep existing metadata
                  ...enhancedMetadata, // Merge new metadata
                  orderId: order.id, // Ensure orderId is present
                  userId: user.id, // Ensure userId is present
                  styleCount: verification.styleCount.toString(), // Add style count for reference
                  verifiedAmount: 'true', // Flag to indicate the amount was verified
                  lastUpdated: new Date().toISOString(),
                },
              },
              { 
                idempotencyKey: updateIdempotencyKey // Use idempotency key for update
              }
            );
            console.log(`PI ${paymentIntent.id} updated with idempotency key: ${updateIdempotencyKey}`);
          }
        } else {
          // PI is in a final state (succeeded, canceled, processing), cannot reuse/update
          console.log(`Existing PI ${existingPI.id} has status ${existingPI.status}, creating a new one.`);
          throw new Error('Existing Payment Intent cannot be updated.'); // Force creation of a new one
        }
      } catch (error) {
        // Handle errors during retrieval/update (e.g., PI not found, update failed)
        console.warn(`Failed to retrieve/update existing PI ${order.payment_intent_id}: ${error instanceof Error ? error.message : error}. Creating a new one.`);
        // Proceed to create a new Payment Intent below
        order.payment_intent_id = undefined; // Clear the ID so a new one is created
      }
    }

    // If no usable PI was found/updated, create a new one
    if (!paymentIntent!) { // Use definite assignment assertion (!) as we handle creation below
      console.log(`Creating new Payment Intent for order ${order.id} with idempotency key: ${baseIdempotencyKey}`);
      
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: verifiedAmount, // Use VERIFIED amount
          currency: 'usd',
          metadata: {
            orderId: order.id,
            userId: user.id,
            styleCount: verification.styleCount.toString(), // Add style count for reference
            verifiedAmount: 'true', // Flag to indicate the amount was verified
            ...enhancedMetadata, // Include all enhanced metadata
            createdAt: new Date().toISOString(),
          },
          // Consider adding setup_future_usage if relevant
        },
        {
          idempotencyKey: baseIdempotencyKey // Using idempotency key for creation
        }
      );
      
      console.log(`New PI ${paymentIntent.id} created with idempotency key: ${baseIdempotencyKey}`);
      
      // Update the order with the new payment intent ID
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_intent_id: paymentIntent.id, 
          amount: verifiedAmount, // Use VERIFIED amount
          status: 'pending_payment',
          payment_status: 'awaiting_payment',
          updated_at: new Date().toISOString(),
          idempotency_key: baseIdempotencyKey, // Store for reference
        })
        .eq('id', order.id)
        .eq('user_id', user.id); // Ensure we're only updating the user's own order
        
      // Handle database update failure
      if (updateError) {
        console.error(`Failed to update order with new payment intent: ${updateError.message}`, updateError);
        console.error(`Order context: id=${order.id}, paymentIntentId=${paymentIntent.id}`);
        
        return NextResponse.json(
          { 
            error: 'Failed to update order record',
            code: 'DB_UPDATE_ERROR',
            details: 'Payment intent created but order record update failed'
          },
          { status: 500 }
        );
      }
      
      console.log(`Order ${order.id} updated with new PI ${paymentIntent.id}`);
    } else {
       // If we reused/updated an existing PI, ensure the order amount matches
       if (order.amount !== verifiedAmount || order.status !== 'pending_payment') {
         const { error: updateError } = await supabase
           .from('orders')
           .update({ 
               amount: verifiedAmount, // Use VERIFIED amount
               status: 'pending_payment', 
               payment_status: 'awaiting_payment', // Reset payment status
               updated_at: new Date().toISOString(),
               idempotency_key: baseIdempotencyKey, // Store for reference
            })
           .eq('id', order.id);
           
         // Handle database update failure  
         if (updateError) {
           console.error(`Failed to update order for existing payment intent: ${updateError.message}`, updateError);
           console.error(`Order context: id=${order.id}, paymentIntentId=${paymentIntent.id}`);
           
           return NextResponse.json(
             { 
               error: 'Failed to update order record',
               code: 'DB_UPDATE_ERROR', 
               details: 'Payment intent found but order record update failed'
             },
             { status: 500 }
           );
         }
           
         console.log(`Order ${order.id} amount/status updated to match reused/updated PI ${paymentIntent.id}`);
       }
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      idempotencyKey: baseIdempotencyKey,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating/updating payment intent:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payment request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 