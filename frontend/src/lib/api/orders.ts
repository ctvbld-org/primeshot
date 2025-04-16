'use client'

import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'
import { calculatePricing } from '@/lib/pricing'

// Track order creation to prevent duplicate requests
let orderCreationInProgress = false;
let lastCreatedOrderId: string | null = null;
let orderCreationDebounceTimeout: NodeJS.Timeout | null = null;

export async function getOrCreateDraftOrder(userId: string): Promise<Order> {
  // Debounce and prevent multiple simultaneous calls
  if (orderCreationInProgress) {
    console.log('Order creation already in progress, waiting...');
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!orderCreationInProgress && lastCreatedOrderId) {
          clearInterval(checkInterval);
          console.log(`Returning already created order: ${lastCreatedOrderId}`);
          // Fetch the last created order and return it
          const supabase = createClient();
          supabase
            .from('orders')
            .select('*')
            .eq('id', lastCreatedOrderId)
            .single()
            .then(({ data, error }) => {
              if (error || !data) {
                reject(new Error('Could not retrieve the recently created order.'));
              } else {
                resolve(data);
              }
            });
        }
      }, 200);
      
      // Set a timeout to reject the promise if it takes too long
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Order creation timeout.'));
      }, 5000);
    });
  }
  
  try {
    orderCreationInProgress = true;
    
    // Clear any existing timeout
    if (orderCreationDebounceTimeout) {
      clearTimeout(orderCreationDebounceTimeout);
    }
    
    const supabase = createClient()

    // 1. Find an existing order in 'draft' OR 'pending_payment' status
    const { data: existingOrders, error: orderQueryError } = await supabase
      .from('orders')
      .select('*') // Select all fields
      .eq('user_id', userId)
      .in('status', ['draft', 'pending_payment']) // Look for either status
      .order('created_at', { ascending: false })
      .limit(1)

    if (orderQueryError) {
      console.error('Error querying draft/pending orders:', orderQueryError)
      throw new Error('Could not fetch existing orders.')
    }

    // 2. If an existing draft or pending_payment order is found, return it
    if (existingOrders && existingOrders.length > 0) {
      const order = existingOrders[0];
      console.log(`Found existing order (ID: ${order.id}, Status: ${order.status})`)
      lastCreatedOrderId = order.id;
      return order;
    }
    
    // 3. If no suitable order exists, create a new 'draft' one
    console.log('No existing draft or pending_payment order found, creating a new draft order.')
    
    // Set initial amount to 0. 
    // The correct price will be updated by updateOrderAmount when styles are added/removed.
    const initialAmount = 0; 

    const { data: newOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'draft', // Always create as draft
        amount: initialAmount, 
        currency: 'usd',
        metadata: { initialCreation: true }
      })
      .select('*') 
      .single()

    if (createOrderError || !newOrder) {
      console.error('Error creating new draft order:', createOrderError)
      throw new Error('Could not create a new draft order.')
    }
    
    console.log('Created new draft order:', newOrder.id)
    lastCreatedOrderId = newOrder.id;
    return newOrder
  } finally {
    // Set a timeout before allowing new order creation
    orderCreationDebounceTimeout = setTimeout(() => {
      orderCreationInProgress = false;
    }, 2000); // 2 second debounce
  }
} 