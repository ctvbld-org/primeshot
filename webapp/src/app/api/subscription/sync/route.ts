import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription from database
    const { data: subRow } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subRow?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Get latest subscription data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id)

    // Update database with latest Stripe data
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_start: (stripeSubscription as any).current_period_start 
          ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (stripeSubscription as any).current_period_end 
          ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subRow.stripe_subscription_id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Subscription synced successfully',
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: (stripeSubscription as any).current_period_end
      }
    })

  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 })
  }
}
