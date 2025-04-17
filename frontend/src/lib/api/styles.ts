import { createClient } from '@/lib/supabase/client'
import { InsertStyle, Style, StyleStatus, UpdateStyle } from '@/lib/types'
import { calculatePricing } from '@/lib/pricing'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/**
 * Save a new style to the database
 */
export async function saveStyle(style: InsertStyle): Promise<Style> {
  const supabase = createClient()
  console.log('Saving style for user:', style.user_id)
  
  // Generate a sequential name (Style 001, Style 002, etc.)
  const { count, error: countError } = await supabase
    .from('styles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', style.user_id)
  
  if (countError) {
    console.error('Error counting styles:', countError)
    throw new Error(`Failed to count styles: ${countError.message}`)
  }
  
  // Format the number with leading zeros (001, 002, etc.)
  const nextNumber = ((count || 0) + 1).toString().padStart(3, '0')
  const sequentialName = `Style ${nextNumber}`
  
  // Override the name if it's not explicitly provided 
  const styleWithSequentialName = {
    ...style,
    name: style.name || sequentialName
  }
  
  // First save the style
  const { data, error } = await supabase
    .from('styles')
    .insert(styleWithSequentialName)
    .select()
    .single()
    
  if (error) {
    throw new Error(`Failed to save style: ${error.message}`)
  }
  
  console.log('Style saved successfully, updating order amount')
  // Now update the order amount based on the new style count
  await updateOrderAmount(style.order_id, supabase)
  
  return data as Style
}

/**
 * Delete a style from the database
 */
export async function deleteStyle(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  console.log('Deleting style:', id, 'for user:', userId)
  
  // First get the style to get the order ID
  const { data: style, error: getError } = await supabase
    .from('styles')
    .select('order_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
    
  if (getError) {
    throw new Error(`Failed to fetch style for deletion: ${getError.message}`)
  }
  
  console.log('Found style with order_id:', style?.order_id)
  
  // Delete the style
  const { error } = await supabase
    .from('styles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    
  if (error) {
    throw new Error(`Failed to delete style: ${error.message}`)
  }
  
  console.log('Style deleted successfully, updating order amount')
  // Update the order amount after deletion
  if (style) {
    await updateOrderAmount(style.order_id, supabase)
  }
}

/**
 * Get styles for a user with optional filtering
 */
export async function getStyles(
  userId: string, 
  options?: { 
    status?: StyleStatus, 
    orderId?: string,
    limit?: number
  }
): Promise<Style[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('styles')
    .select('*')
    .eq('user_id', userId)
  
  // Add filters if provided
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  
  if (options?.orderId) {
    query = query.eq('order_id', options.orderId)
  }
  
  // Add pagination if limit is provided
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  // Order by creation date, newest first
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch styles: ${error.message}`)
  }
  
  return data as Style[]
}

/**
 * Get a single style by ID
 */
export async function getStyle(id: string, userId: string): Promise<Style> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('styles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
    
  if (error) {
    throw new Error(`Failed to fetch style: ${error.message}`)
  }
  
  return data as Style
}

/**
 * Update an existing style
 */
export async function updateStyle(style: UpdateStyle): Promise<Style> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('styles')
    .update({
      name: style.name,
      settings: style.settings,
      status: style.status
    })
    .eq('id', style.id)
    .eq('user_id', style.user_id)
    .select()
    .single()
    
  if (error) {
    throw new Error(`Failed to update style: ${error.message}`)
  }
  
  return data as Style
}

/**
 * Calculate headshots based on style count
 */
export async function calculateHeadshots(userId: string): Promise<{
  styleCount: number,
  totalHeadshots: number,
  headshotsPerStyle: number,
  tier: string,
  price: number
}> {
  // Get only draft styles for pricing calculations
  const supabase = createClient()
  const { data: styles, error } = await supabase
    .from('styles')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'draft')
    
  if (error) {
    throw new Error(`Failed to fetch styles for headshot calculation: ${error.message}`)
  }
  
  const styleCount = styles.length
  
  // If no styles, return default values
  if (styleCount === 0) {
    return {
      styleCount: 0,
      totalHeadshots: 0,
      headshotsPerStyle: 0,
      tier: 'none',
      price: 0
    }
  }
  
  // Calculate pricing information based on style count
  const pricingInfo = calculatePricing(styleCount)
  
  return {
    styleCount,
    totalHeadshots: pricingInfo.totalHeadshots,
    headshotsPerStyle: pricingInfo.headshotsPerStyle,
    tier: pricingInfo.tier,
    price: pricingInfo.price
  }
}

/**
 * Updates the order amount based on the number of styles.
 * Uses direct database operations instead of Edge Functions to avoid CORS issues.
 */
export const updateOrderAmount = async (
  orderId: string,
  supabase: SupabaseClient,
  options?: { throwOnError?: boolean }
): Promise<void> => {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  if (!userId) {
    const errorMsg = 'User ID not found when updating order amount';
    logger.error(errorMsg);
    if (options?.throwOnError) {
      throw new Error(errorMsg);
    }
    return;
  }

  try {
    // Verify the order exists and belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or does not belong to this user');
    }

    // Count styles for this order with status 'draft'
    const { count: styleCount, error: countError } = await supabase
      .from('styles')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('status', 'draft');

    if (countError) {
      throw new Error(`Failed to count styles: ${countError.message}`);
    }

    // Calculate the price using the central pricing function
    let price = 0;
    if (styleCount) {
      // Use the shared pricing calculation function to ensure consistency
      const pricingInfo = calculatePricing(styleCount);
      price = pricingInfo.price;
    }

    // Update the order with the calculated price
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        amount: price,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update order amount: ${updateError.message}`);
    }

    logger.info('Order amount updated successfully', {
      orderId,
      styleCount,
      price
    });
  } catch (error) {
    // Log the error and potentially rethrow
    logger.error('Failed to update order amount', {
      error: error instanceof Error ? error.message : String(error),
      orderId
    });
    
    if (options?.throwOnError) {
      throw error;
    }
  }
};

/**
 * Bulk update styles status
 */
export async function updateStylesStatus(
  userId: string, 
  styleIds: string[], 
  status: StyleStatus
): Promise<void> {
  const supabase = createClient()
  
  // Update status for all specified styles
  const { error } = await supabase
    .from('styles')
    .update({ status })
    .eq('user_id', userId)
    .in('id', styleIds)
    
  if (error) {
    throw new Error(`Failed to update styles status: ${error.message}`)
  }
} 