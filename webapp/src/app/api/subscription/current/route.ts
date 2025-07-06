import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function GET() {
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

    // Get current active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      // User doesn't have an active subscription
      return NextResponse.json(null)
    }

    // Get plan details from Stripe
    const price = await stripe.prices.retrieve(subscription.stripe_price_id, {
      expand: ['product']
    })
    const product = price.product as Stripe.Product

    // Calculate credits used in current billing period
    const periodStart = new Date(subscription.current_period_start)
    const periodEnd = new Date(subscription.current_period_end)

    const { data: creditsUsed, error: usageError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .eq('transaction_type', 'spent')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString())

    if (usageError) {
      console.error('Error fetching credit usage:', usageError)
    }

    const creditsUsedThisPeriod = creditsUsed?.reduce((total, credit) => total + credit.credits, 0) || 0

    // Calculate LoRA training usage in current billing period
    const { data: loraTraining, error: loraError } = await supabase
      .from('training_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString())

    if (loraError) {
      console.error('Error fetching LoRA training usage:', loraError)
    }

    const loraTrainingUsed = loraTraining?.length || 0

    // Build subscription info response
    const subscriptionInfo = {
      plan_name: subscription.plan_name,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      credits_included: parseInt(product.metadata.credits_included || '0'),
      credits_used_this_period: creditsUsedThisPeriod,
      max_resolution: product.metadata.max_resolution || '1K',
      lora_training_included: parseInt(product.metadata.lora_training_included || '0'),
      lora_training_used: loraTrainingUsed,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      // Additional useful fields
      current_period_start: subscription.current_period_start,
      stripe_subscription_id: subscription.stripe_subscription_id,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    }

    return NextResponse.json(subscriptionInfo)

  } catch (error) {
    console.error('Error in subscription current API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 