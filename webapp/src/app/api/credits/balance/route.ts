import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Calculate credit balance by summing all non-expired transactions
    const { data: creditSummary, error: creditError } = await supabase
      .rpc('calculate_user_credit_balance', { user_uuid: user.id })

    if (creditError) {
      console.error('Error calculating credit balance:', creditError)
      
      // Fallback: calculate manually if RPC function doesn't exist
      const { data: transactions, error: fallbackError } = await supabase
        .from('user_credits')
        .select('credits, transaction_type')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      if (fallbackError) {
        console.error('Error fetching credit transactions:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to calculate credit balance' },
          { status: 500 }
        )
      }

      // Calculate balance manually
      const balance = transactions?.reduce((total, transaction) => {
        return transaction.transaction_type === 'earned' 
          ? total + transaction.credits
          : total - transaction.credits
      }, 0) || 0

      return NextResponse.json({ balance: Math.max(0, balance) })
    }

    // Return balance from RPC function
    const balance = creditSummary || 0
    return NextResponse.json({ balance: Math.max(0, balance) })

  } catch (error) {
    console.error('Error in credits balance API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 