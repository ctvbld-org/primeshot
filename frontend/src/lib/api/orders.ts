'use client'

import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export async function getOrCreateDraftOrder(userId: string): Promise<Order> {
  const supabase = createClient()

  // First try to find an existing draft order
  const { data: existingOrders, error: orderQueryError } = await supabase
    .from('orders')
    .select()
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)

  if (orderQueryError) {
    console.error('Error querying draft orders:', orderQueryError)
    throw new Error('Could not fetch draft orders.')
  }

  if (existingOrders && existingOrders.length > 0) {
    // Use existing draft order
    return existingOrders[0]
  } else {
    // Create new draft order if none exists
    // TODO: Change amount to a dynamic pricing once payment is implemented
    const { data: newOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'draft',
        amount: 2900, // Example amount
        currency: 'usd'
      })
      .select()
      .single()

    if (createOrderError || !newOrder) {
      console.error('Error creating new draft order:', createOrderError)
      throw new Error('Could not create a new draft order.')
    }
    return newOrder
  }
} 