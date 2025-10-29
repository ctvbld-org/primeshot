import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(null)
    }

    // First try to get an active subscription
    let { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If no active subscription, fall back to most recent cancelled subscription
    // (useful for showing grace period or "cancelled" status in UI)
    if (!subscription && !subError) {
      const { data: cancelledSub, error: cancelledError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'canceled')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      subscription = cancelledSub
      subError = cancelledError
    }

    if (subError || !subscription) {
      // No subscription rows; return null so UI shows "no plan"
      return NextResponse.json(null)
    }

    // Get plan details from DB-backed pricing
    const { data: tier, error: tierError } = await supabase
      .from('subscriptions')
      .select('credits,max_quality,character_training_included,name,display_name,image_url,max_characters,concurrent_jobs')
      .eq('name', subscription.plan_name)
      .single()

    if (tierError) {
      console.error('Error fetching subscription tier:', tierError)
    }

    // Return subscription info with tier details
    return NextResponse.json({
      ...subscription,
      ...tier,
      plan_name: subscription.plan_name,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(null)
  }
}

