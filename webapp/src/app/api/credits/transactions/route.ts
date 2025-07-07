import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const transactionType = searchParams.get('type') // 'earned', 'spent', 'expired'

    // Validate parsed values
    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by transaction type if specified
    if (transactionType && ['earned', 'spent', 'expired'].includes(transactionType)) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching credit transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch credit transactions' },
        { status: 500 }
      )
    }

    // Format transactions for frontend
    const formattedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      credits: transaction.credits,
      transaction_type: transaction.transaction_type,
      source_type: transaction.source_type,
      description: transaction.description || `${transaction.transaction_type} ${transaction.credits} credits`,
      created_at: transaction.created_at,
      expires_at: transaction.expires_at || undefined,
      // Additional fields that might be useful
      source_id: transaction.source_id,
      metadata: transaction.metadata
    })) || []

    // Get total count for pagination
    let countQuery = supabase
      .from('user_credits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Apply the same transaction type filter to count query
    if (transactionType && ['earned', 'spent', 'expired'].includes(transactionType)) {
      countQuery = countQuery.eq('transaction_type', transactionType)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting credit transactions:', countError)
    }

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error in credits transactions API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 