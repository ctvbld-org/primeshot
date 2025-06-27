import { createServerClient } from "@supabase/ssr";
import { calculatePricing } from "../pricing";

/**
 * Verify that the requested payment amount matches the calculated price based on the order's styles
 * This is a critical security function to prevent client-side price manipulation
 * 
 * @param orderId The ID of the order to verify
 * @param requestedAmount The payment amount requested by the client
 * @param supabase A Supabase client instance
 * @returns An object with verification result and calculated correct amount
 */
export async function verifyOrderPrice(
  orderId: string,
  requestedAmount: number,
  supabase: ReturnType<typeof createServerClient>
): Promise<{
  isValid: boolean;
  calculatedAmount: number;
  reason?: string;
  styleCount: number;
}> {
  try {
    // Count styles for this order
    const { count, error } = await supabase
      .from('styles')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId);
    
    if (error) {
      throw new Error(`Error counting styles: ${error.message}`);
    }
    
    const styleCount = count || 0;
    
    // If no styles, price should be 0 or minimum tier price
    if (styleCount === 0) {
      // If client is trying to pay for an order with no styles, it's invalid
      return {
        isValid: false,
        calculatedAmount: 0,
        reason: 'No styles found for this order',
        styleCount: 0
      };
    }
    
    // Calculate the correct price based on style count
    const pricingInfo = calculatePricing(styleCount);
    const correctAmount = pricingInfo.price;
    
    // Check if requested amount matches calculated amount
    // Using exact match for security, tolerance could be added if needed
    const isValid = requestedAmount === correctAmount;
    
    return {
      isValid,
      calculatedAmount: correctAmount,
      reason: isValid ? undefined : `Price mismatch: expected ${correctAmount}, got ${requestedAmount}`,
      styleCount
    };
  } catch (error) {
    // For any error, return invalid with 0 as safe default
    const message = error instanceof Error ? error.message : 'Unknown error during price verification';
    return {
      isValid: false,
      calculatedAmount: 0,
      reason: `Verification error: ${message}`,
      styleCount: 0
    };
  }
} 