import { createClient } from '@/lib/supabase/client'
import { InsertStyle, Style, StyleStatus, UpdateStyle } from '@/lib/types'
import { calculatePricing } from '@/lib/pricing'

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
  await updateOrderAmount(style.user_id, style.order_id)
  
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
    await updateOrderAmount(userId, style.order_id)
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
 * Update order amount based on style count
 */
async function updateOrderAmount(userId: string, orderId: string): Promise<void> {
  console.log('Updating order amount for user:', userId, 'orderId:', orderId)
  
  // Add a small delay to ensure database operations have settled
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Query the database directly for the most current count instead of using the calculateHeadshots function
  const supabase = createClient()
  
  // First get the current count directly from the database
  const { count, error: countError } = await supabase
    .from('styles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'draft')
  
  if (countError) {
    console.error('Error counting styles:', countError)
    throw new Error(`Failed to count styles: ${countError.message}`)
  }
  
  const styleCount = count || 0
  console.log('Current style count from database:', styleCount)
  
  // Calculate pricing information based on the current style count
  let price = 0
  if (styleCount > 0) {
    const pricingInfo = calculatePricing(styleCount)
    price = pricingInfo.price
  }
  
  console.log('Calculated price based on count:', price)
  
  // Update the order with the new amount
  const { error } = await supabase
    .from('orders')
    .update({ amount: price })
    .eq('id', orderId)
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(`Failed to update order amount: ${error.message}`)
  }
  
  console.log('Order amount updated to:', price)
}

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