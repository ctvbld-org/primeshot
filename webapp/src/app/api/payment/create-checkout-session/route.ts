import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyOrderPrice } from '@/lib/server/price-verification';
import { getCheckoutSessionIdempotencyKey, getRetryIdempotencyKey } from '@/lib/server/idempotency';
import { calculatePricing, getTierDisplayText } from '@/lib/pricing';
import { getOptionByCategory } from '@/lib/api/config';
import { PRICING } from '@/lib/constants/pricing';
import { generatePaymentHash } from '@/lib/server/hash-verification';

// Check if STRIPE_SECRET_KEY is set
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('CRITICAL ERROR: STRIPE_SECRET_KEY is not set. Payment functionality will fail.');
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Check if VERCEL_PROJECT_PRODUCTION_URL is set
const url_prefix = process.env.VERCEL_TARGET_ENV === 'local' ? 'http://' : 'https://'
const APP_URL = new URL(url_prefix + process.env.VERCEL_PROJECT_PRODUCTION_URL + process.env.NEXT_PUBLIC_POST_LOGIN_PATH);
  
if (!APP_URL) {
  console.error('CRITICAL ERROR: VERCEL_PROJECT_PRODUCTION_URL is not set. Payment redirects will fail.');
  throw new Error('Missing required environment variable: VERCEL_PROJECT_PRODUCTION_URL');
}

// Initialize Stripe with latest API version
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to make a payment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, amount, metadata = {}, retryAttempt = 0, customerEmail, customerName } = body;

    if (!orderId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: orderId and amount' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {  
      return NextResponse.json(  
        { error: 'Invalid amount supplied' },  
        { status: 400 }  
      );  
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to this user' },
        { status: 404 }
      );
    }

    // IMPORTANT: Verify the requested amount matches the calculated price based on style count
    const verification = await verifyOrderPrice(orderId, amount, supabase);
    
    if (!verification.isValid) {
      console.warn(`Payment amount verification failed: ${verification.reason}. Order ID: ${orderId}, User ID: ${user.id}`);
      return NextResponse.json(
        { 
          error: 'Invalid payment amount', 
          details: verification.reason,
          expectedAmount: verification.calculatedAmount
        },
        { status: 400 }
      );
    }
    
    // If verification passed, continue with the verified amount
    const verifiedAmount = verification.calculatedAmount;
    
    // Ensure amount is a non-negative integer (required by Stripe)
    if (typeof verifiedAmount !== 'number' || !Number.isInteger(verifiedAmount) || verifiedAmount < 0) {
      console.error(`Invalid verifiedAmount: ${verifiedAmount}. Must be a non-negative integer.`);
      return NextResponse.json(
        { error: 'Payment processing error: Invalid amount format' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Payment amount verified for order ${orderId}: ${verifiedAmount}`);

    // Generate an appropriate idempotency key based on whether this is a retry
    const idempotencyKey = retryAttempt > 0
      ? getRetryIdempotencyKey('checkout_session', orderId, user.id, verifiedAmount)
      : getCheckoutSessionIdempotencyKey(orderId, user.id, verifiedAmount);
    
    console.log(`Creating checkout session with idempotency key: ${idempotencyKey}`);

    // Add request info to metadata for tracking/debugging
    const enhancedMetadata = {
      ...metadata,
      idempotencyKey,
      requestId: crypto.randomUUID(), // Unique ID for this specific request
      retryAttempt: retryAttempt.toString(),
    };

    // Get styles for this order
    const { data: styles, error: stylesError } = await supabase
      .from('styles')
      .select('id, name, settings, status')
      .eq('order_id', orderId);

    console.log(`Querying styles for order ${orderId}:`, { styles, error: stylesError });

    if (stylesError) {
      console.error('Error fetching styles:', stylesError);
      return NextResponse.json(
        { error: 'Failed to fetch styles for order' },
        { status: 500 }
      );
    }

    if (!styles || styles.length === 0) {
      // Try to find any styles that might be associated with the user but not properly linked
      const { data: userStyles, error: userStylesError } = await supabase
        .from('styles')
        .select('id, name, settings, status')
        .eq('user_id', user.id)
        .eq('status', 'draft');

      console.log('Checking user styles as fallback:', { userStyles, error: userStylesError });

      return NextResponse.json(
        { 
          error: 'No styles found for this order',
          details: 'Please ensure styles are properly associated with the order',
          debug: {
            orderId,
            userStyles: userStyles || [],
            userStylesError
          }
        },
        { status: 400 }
      );
    }

    // Get option translations
    const [backgroundOptions, clothingOptions, colorOptions] = await Promise.all([
      getOptionByCategory('background'),
      getOptionByCategory('clothing'),
      getOptionByCategory('clothingColor')
    ]);

    // Calculate pricing info to get headshots per style
    const pricingInfo = calculatePricing(styles.length);
    
    // Create checkout session with idempotency key
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail,
        customer_creation: customerEmail ? 'always' : undefined,
        line_items: (() => {
          const baseStyleCount = styles.length;
          const baseAmount = pricingInfo.price; 

          return [
            // Base package price
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `📷 ${getTierDisplayText(pricingInfo.tier)} Package`,
                  description: `${baseStyleCount} Professional Style${baseStyleCount > 1 ? 's' : ''} • ${pricingInfo.headshotsPerStyle} Photos per Style`,
                },
                unit_amount: baseAmount,
              },
              quantity: 1,
            },
            // Individual styles
            ...styles.map((style, index) => {
              const background = backgroundOptions?.options.find(opt => opt.id === style.settings?.background)?.label || style.settings?.background;
              const clothing = clothingOptions?.options.find(opt => opt.id === style.settings?.clothing)?.label || style.settings?.clothing;
              const color = colorOptions?.options.find(opt => opt.id === style.settings?.clothingColor)?.label || style.settings?.clothingColor;
              
              const isAddon = index >= PRICING.studio.maxStyles;
              
              return {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `Style ${index + 1}: ${style.name}${isAddon ? ' (Addon)' : ''}`,
                    description: [
                      `🖼️  ${background}`,
                      `👔  ${clothing}`,
                      color ? `🎨  ${color}` : null
                    ].filter(Boolean).join('   '),
                  },
                  unit_amount: isAddon ? PRICING.addon.price : 0,
                },
                quantity: 1,
              };
            }),
          ];
        })(),
        metadata: {
          orderId,
          userId: user.id,
          styleCount: verification.styleCount.toString(),
          verifiedAmount: 'true',
          createdAt: new Date().toISOString(),
          customerName,
          ...enhancedMetadata,
        },
        success_url: `${APP_URL}/app/upload?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}&hash=${await generatePaymentHash('{CHECKOUT_SESSION_ID}', order.id)}`,
        cancel_url: `${APP_URL}/app/shoot`,
      },
      {
        idempotencyKey,
      }
    );

    console.log(`Checkout session created: ${checkoutSession.id} with idempotency key: ${idempotencyKey}`);

    // Update order with session ID and VERIFIED amount
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_intent_id: checkoutSession.payment_intent as string || null,
        checkout_session_id: checkoutSession.id,
        payment_status: 'checkout_started',
        status: 'pending_payment',
        amount: verifiedAmount, // Always use VERIFIED amount
        updated_at: new Date().toISOString(),
        idempotency_key: idempotencyKey, // Store the idempotency key for reference
      })
      .eq('id', orderId);

    // Handle database update failure
    if (updateError) {
      console.error(`Failed to update order record: ${updateError.message}`, updateError);
      
      // Log additional context for debugging
      console.error(`Order context: id=${orderId}, session=${checkoutSession.id}`);
      
      // Return error to client so they can handle it properly
      return NextResponse.json(
        { 
          error: 'Failed to update order record',
          code: 'DB_UPDATE_ERROR',
          details: 'Payment initiated but order record update failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 