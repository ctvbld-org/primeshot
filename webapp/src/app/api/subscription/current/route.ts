import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any
})

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
      return NextResponse.json(  
        { error: 'Failed to fetch usage data' },  
        { status: 500 }  
      )  
    }

    // Fix: Spent credits are stored as negative values, so we need to use absolute values
    const creditsUsedThisPeriod = creditsUsed?.reduce((total, credit) => total + Math.abs(credit.credits), 0) || 0

    // Calculate Face Model training usage in current billing period
    // Count all training jobs that have started (queued, running, completed)
    // since the user has consumed their included quota once training begins
    const { data: faceModelTraining, error: loraError } = await supabase
      .from('training_jobs')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['queued', 'running', 'completed'])
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString())

    if (loraError) {
      console.error('Error fetching LoRA training usage:', loraError)
    }

    const faceModelTrainingUsed = faceModelTraining?.length || 0

    // Build subscription info response
    const subscriptionInfo = {
      plan_name: subscription.plan_name,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      credits_included: parseInt(product.metadata.credits_included || '0'),
      credits_used_this_period: creditsUsedThisPeriod,
      max_resolution: product.metadata.max_resolution || '1K',
      face_model_training_included: parseInt(product.metadata.face_model_training_included || '0'),
      face_model_training_used: faceModelTrainingUsed,
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