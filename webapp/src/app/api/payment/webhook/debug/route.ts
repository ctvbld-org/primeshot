import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function GET() {
  try {
    console.log('🔍 Debug endpoint called - checking webhook functionality...')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`👤 Debug check for user: ${user.id}`)

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('📋 User subscription:', subscription)

    // Get user's credits
    const { data: credits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('💳 User credits:', credits)

    // If user has subscription, get Stripe details
    let stripeDetails = null
    if (subscription?.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
        const price = await stripe.prices.retrieve(subscription.stripe_price_id, { expand: ['product'] })
        const product = price.product as Stripe.Product

        stripeDetails = {
          subscription_status: stripeSubscription.status,
          current_period_start: (stripeSubscription as any).current_period_start,
          current_period_end: (stripeSubscription as any).current_period_end,
          price_id: subscription.stripe_price_id,
          product_metadata: product.metadata,
          credits_included: product.metadata.credits_included
        }
        console.log('🏪 Stripe details:', stripeDetails)
      } catch (error) {
        console.error('❌ Error fetching Stripe details:', error)
        stripeDetails = { error: 'Failed to fetch Stripe details' }
      }
    }

    // Recent webhook events for this customer
    let recentEvents = null
    if (subscription?.stripe_customer_id) {
      try {
        const events = await stripe.events.list({
          limit: 20,
          created: { gte: Math.floor(Date.now() / 1000) - (24 * 60 * 60) }, // Last 24 hours
          types: ['invoice.payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated']
        })

        recentEvents = events.data.filter(event => {
          if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice
            return invoice.customer === subscription.stripe_customer_id
          }
          if (event.type.startsWith('customer.subscription.')) {
            const sub = event.data.object as Stripe.Subscription
            return sub.customer === subscription.stripe_customer_id
          }
          return false
        }).map(event => ({
          id: event.id,
          type: event.type,
          created: event.created,
          billing_reason: event.type === 'invoice.payment_succeeded' ? (event.data.object as Stripe.Invoice).billing_reason : null
        }))

        console.log('📡 Recent webhook events:', recentEvents)
      } catch (error) {
        console.error('❌ Error fetching recent events:', error)
        recentEvents = { error: 'Failed to fetch recent events' }
      }
    }

    const debugInfo = {
      user_id: user.id,
      subscription: subscription || 'No subscription found',
      credits: credits || 'No credits found',
      stripe_details: stripeDetails,
      recent_webhook_events: recentEvents,
      timestamp: new Date().toISOString(),
      debug_notes: {
        expected_flow: [
          '1. customer.subscription.created → Creates subscription record',
          '2. invoice.payment_succeeded → Awards credits',
          '3. Credits should appear in user_credits table'
        ],
        common_issues: [
          'Missing invoice.payment_succeeded webhook',
          'Wrong billing_reason in invoice',
          'Missing product metadata (credits_included)',
          'Database permissions issues'
        ]
      }
    }

    console.log('📊 Complete debug info:', debugInfo)

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('🚨 Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()
    
    console.log(`🔧 Debug action: ${action}`)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'manual_credit_award': {
        // Manually award credits for testing using service role
        const { credits, description } = data

        console.log('🔑 Testing service role access for credit award...')
        
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return NextResponse.json({
            error: 'Service role key not configured',
            details: 'SUPABASE_SERVICE_ROLE_KEY environment variable is missing',
            fix: 'Set SUPABASE_SERVICE_ROLE_KEY in your environment variables'
          }, { status: 500 })
        }

        // Create service role client (same as webhook)
        const serviceSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await serviceSupabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            credits: credits,
            transaction_type: 'earned',
            source_type: 'admin',
            source_id: 'manual_debug',
            description: description || 'Manual credit award for debugging',
            metadata: {
              debug: true,
              service_role_test: true,
              timestamp: new Date().toISOString()
            }
          })

        if (error) {
          console.error('❌ Manual credit award failed:', error)
          return NextResponse.json({ 
            error: 'Failed to award credits', 
            details: error,
            troubleshooting: {
              message: 'RLS policy blocking service role - run migration fix',
              migration: '20250109000000_fix_credit_rls_policies.sql',
              common_causes: [
                'Service role RLS policies missing/incorrect',
                'SUPABASE_SERVICE_ROLE_KEY not set properly',
                'Database permissions not granted'
              ]
            }
          }, { status: 500 })
        }

        console.log(`✅ Manually awarded ${credits} credits to user ${user.id} via service role`)
        return NextResponse.json({ 
          success: true, 
          message: `Awarded ${credits} credits via service role`,
          note: 'Service role access working - webhook should work now'
        })
      }

      case 'simulate_subscription_webhook': {
        // Simulate the subscription webhook flow
        const { subscription_id, price_id } = data

        if (!subscription_id || !price_id) {
          return NextResponse.json({ error: 'Missing subscription_id or price_id' }, { status: 400 })
        }

        try {
          // Get plan details from Stripe
          const price = await stripe.prices.retrieve(price_id, { expand: ['product'] })
          const product = price.product as Stripe.Product
          const creditsIncluded = parseInt(product.metadata.credits_included || '0')

          if (creditsIncluded > 0) {
            // Use service role for webhook simulation (same as real webhook)
            const serviceSupabase = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const { error } = await serviceSupabase
              .from('user_credits')
              .insert({
                user_id: user.id,
                credits: creditsIncluded,
                transaction_type: 'earned',
                source_type: 'subscription',
                source_id: subscription_id,
                description: `Simulated subscription activation - ${product.metadata.plan_name}`,
                metadata: {
                  simulated: true,
                  service_role_test: true,
                  price_id: price_id,
                  timestamp: new Date().toISOString()
                }
              })

            if (error) {
              console.error('❌ Simulated credit award failed:', error)
              return NextResponse.json({ error: 'Failed to simulate credit award', details: error }, { status: 500 })
            }

            console.log(`✅ Simulated credit award: ${creditsIncluded} credits to user ${user.id}`)
            return NextResponse.json({ 
              success: true, 
              message: `Simulated: Awarded ${creditsIncluded} credits`,
              credits_awarded: creditsIncluded
            })
          } else {
            return NextResponse.json({ 
              success: false, 
              message: 'Plan has 0 credits_included in metadata' 
            })
          }
        } catch (error) {
          console.error('❌ Simulation failed:', error)
          return NextResponse.json({ error: 'Simulation failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (error) {
    console.error('🚨 Debug POST error:', error)
    return NextResponse.json(
      { error: 'Debug action failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 