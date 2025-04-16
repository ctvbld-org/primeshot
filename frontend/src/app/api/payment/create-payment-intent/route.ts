import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Order } from '@/lib/types'; // Import Order type

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
    const { orderId, amount, metadata = {} } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: orderId and amount' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user, select relevant fields
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, payment_intent_id, amount, status')
      .eq('id', orderId)
      .eq('user_id', session.user.id)
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
    
    const order = orderResult as Order; // Cast to Order type

    let paymentIntent: Stripe.PaymentIntent;

    // Check if there's an existing, usable Payment Intent
    if (order.payment_intent_id && 
        (order.status === 'draft' || order.status === 'pending_payment')) {
      try {
        console.log(`Attempting to retrieve existing PI: ${order.payment_intent_id}`);
        const existingPI = await stripe.paymentIntents.retrieve(order.payment_intent_id);

        // Check if PI is in a state that allows updates (e.g., requires_payment_method)
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existingPI.status)) {
          if (existingPI.amount === amount) {
            // Amount matches, reuse the existing PI
            console.log(`Reusing existing PI ${existingPI.id}, amount matches.`);
            paymentIntent = existingPI;
          } else {
            // Amount differs, update the existing PI
            console.log(`Updating existing PI ${existingPI.id} amount from ${existingPI.amount} to ${amount}`);
            paymentIntent = await stripe.paymentIntents.update(order.payment_intent_id, {
              amount: amount, // Update amount
              metadata: { 
                ...existingPI.metadata, // Keep existing metadata
                ...metadata, // Merge new metadata
                orderId: order.id, // Ensure orderId is present
                userId: session.user.id // Ensure userId is present
              },
            });
            console.log(`PI ${paymentIntent.id} updated.`);
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
      console.log(`Creating new Payment Intent for order ${order.id}`);
      paymentIntent = await stripe.paymentIntents.create({
        amount, // amount in cents
        currency: 'usd',
        metadata: {
          orderId: order.id,
          userId: session.user.id,
          ...metadata,
        },
        // Consider adding setup_future_usage if relevant
      });
      console.log(`New PI ${paymentIntent.id} created.`);

      // Update order with the NEW payment intent ID and reset status
      await supabase
        .from('orders')
        .update({
          payment_intent_id: paymentIntent.id,
          payment_status: 'awaiting_payment',
          status: 'pending_payment',
          amount: amount, // Ensure order amount matches PI amount
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
      console.log(`Order ${order.id} updated with new PI ${paymentIntent.id}`);
    } else {
       // If we reused/updated an existing PI, ensure the order amount matches
       if (order.amount !== amount || order.status !== 'pending_payment') {
         await supabase
           .from('orders')
           .update({ 
               amount: amount, 
               status: 'pending_payment', 
               payment_status: 'awaiting_payment', // Reset payment status
               updated_at: new Date().toISOString() 
            })
           .eq('id', order.id);
         console.log(`Order ${order.id} amount/status updated to match reused/updated PI ${paymentIntent.id}`);
       }
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating/updating payment intent:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payment request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 