import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

async function handleGET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use new quota-based credit system
    const { data: creditData, error: creditError } = await supabase
      .rpc('get_available_credits', { p_user_id: user.id })

    if (creditError) {
      console.error('Error getting available credits:', creditError)
      
      // Fallback to calculate_user_credit_balance (also uses new system via wrapper)
      const { data: fallbackBalance, error: fallbackError } = await supabase
        .rpc('calculate_user_credit_balance', { p_user_id: user.id })

      if (fallbackError) {
        console.error('Error in fallback balance calculation:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to calculate credit balance' },
          { status: 500 }
        )
      }

      return NextResponse.json({ balance: Math.max(0, fallbackBalance || 0) })
    }

    // Extract total from JSONB result
    const balance = creditData?.total || 0
    return NextResponse.json({ 
      balance: Math.max(0, balance),
      // Optional: include breakdown for debugging
      breakdown: {
        subscription: creditData?.subscription || 0,
        purchased: creditData?.purchased || 0,
        bonus: creditData?.bonus || 0
      }
    })

  } catch (error) {
    console.error('Error in credits balance API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

// Secured handler with authentication and rate limiting
const securedGET = createSecuredHandler(
  handleGET,
  SECURITY_PRESETS.PUBLIC
);

export async function GET(request: NextRequest) {
  return await securedGET(request);
}