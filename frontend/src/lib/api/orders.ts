'use client'

import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'
import { calculatePricing } from '@/lib/pricing'

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
    // Check if user has any draft styles that would affect the price
    const { count, error: countError } = await supabase
      .from('styles')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'draft');
    
    if (countError) {
      console.error('Error counting styles:', countError);
      throw new Error('Could not count existing styles.');
    }
    
    // Calculate price based on expected style count after creating a new one
    const styleCount = (count || 0) + 1; // Count existing styles plus the new one to be created
    let initialAmount = 2900; // Default to Individual Tier
    
    if (styleCount > 0) {
      const pricing = calculatePricing(styleCount);
      initialAmount = pricing.price;
    }
    
    // Create new draft order
    const { data: newOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'draft',
        amount: initialAmount,
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