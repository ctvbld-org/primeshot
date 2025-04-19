'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, createPaymentIntent } from '@/lib/stripe';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { formatPrice, calculatePricing } from '@/lib/pricing';
import type { PricingInfo } from '@/lib/pricing';
import type { Order, Style } from '@/lib/types';
import { getOrCreateDraftOrder } from '@/lib/api/orders';
import { generateCacheKey, getCachedData, cacheData } from '@/lib/cache';

// Define types for payment-related stage data
interface PaymentStageData {
  orderId?: string
  attemptCount?: number
  lastAttemptAt?: string
  isRecovery?: boolean
}

// Define progress stage data structure
interface StageData {
  [key: string]: unknown
  payment?: PaymentStageData
}

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { updateProgress, progress, canModifyStyles } = useUserProgress();
  const hasUpdatedProgress = useRef(false);
  
  // Get resume parameter from URL if present
  const resumeOrderId = searchParams.get('resume');
  
  const [isLoading, setIsLoading] = useState(true);
  const [styles, setStyles] = useState<Style[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'summary' | 'payment'>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [isRecoveringPayment, setIsRecoveringPayment] = useState(false);

  // Load styles and order data
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const supabase = createClient();
        let currentOrder: Order | undefined;
        let pricing: PricingInfo | undefined;
        
        // Check cache first
        const orderCacheKey = generateCacheKey('draftOrder', { userId: user.id });
        const cachedOrder = getCachedData<Order>(orderCacheKey);
        
        // If order is cached and no resumeOrderId is specified, use the cached order
        if (cachedOrder && !resumeOrderId) {
          setOrder(cachedOrder);
          currentOrder = cachedOrder;
          
          // Try to get cached styles
          const stylesCacheKey = generateCacheKey('styles', { 
            userId: user.id, 
            orderId: cachedOrder.id, 
            status: 'draft' 
          });
          
          const cachedStyles = getCachedData<Style[]>(stylesCacheKey);
          if (cachedStyles) {
            setStyles(cachedStyles);
            
            // Calculate pricing info based on style count
            const styleCount = cachedStyles.length;
            if (styleCount > 0) {
              pricing = calculatePricing(styleCount);
              setPricingInfo(pricing);
            }
            setIsLoading(false);
            
            // Early return if everything is cached
            return { order: cachedOrder, styles: cachedStyles, pricing };
          }
        }
        
        // If we're here, we need to fetch at least some data
        let fetchedOrder = cachedOrder;
        
        // Fetch the current order if not cached or if resuming a specific order
        if (!fetchedOrder || resumeOrderId) {
          // Check if resuming a specific order or get/create draft order
          if (resumeOrderId) {
            const { data: resumeOrder, error: resumeError } = await supabase
              .from('orders')
              .select('*')
              .eq('id', resumeOrderId)
              .eq('user_id', user.id)
              .single();
            
            if (resumeError) {
              throw new Error(`Could not find the specified order: ${resumeError.message}`);
            }
            
            fetchedOrder = resumeOrder;
            setIsRecoveringPayment(true);
          } else {
            fetchedOrder = await getOrCreateDraftOrder(user.id);
          }
          
          if (!fetchedOrder) {
            throw new Error('Could not find or create a draft order.');
          }
          
          setOrder(fetchedOrder);
          currentOrder = fetchedOrder;
          
          // Cache the order
          cacheData(orderCacheKey, fetchedOrder, 5 * 60 * 1000); // 5 minutes
        }
        
        // Fetch styles for this order
        const { data: orderStyles } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', user.id)
          .eq('order_id', fetchedOrder.id)
          .eq('status', 'draft');
        
        setStyles(orderStyles || []);
        
        // Cache the styles
        if (orderStyles && orderStyles.length > 0) {
          const stylesCacheKey = generateCacheKey('styles', { 
            userId: user.id, 
            orderId: fetchedOrder.id, 
            status: 'draft' 
          });
          cacheData(stylesCacheKey, orderStyles, 5 * 60 * 1000); // 5 minutes
        }
        
        // Calculate pricing
        if (orderStyles) {
          const styleCount = orderStyles.length || 0;
          pricing = calculatePricing(styleCount);
          setPricingInfo(pricing);
        }
        
        // If this is a payment recovery, proceed directly to payment step
        // Also attempt to restore the payment intent
        if (resumeOrderId && currentOrder && currentOrder.payment_intent_id && pricing) {
          setPaymentStep('payment');
          
          try {
            // For recovery, we need to get the client secret from the existing payment intent
            const paymentInfo = await createPaymentIntent({
              orderId: currentOrder.id,
              amount: pricing.price,
              metadata: {
                isRecovery: 'true',
                recoveryTimestamp: new Date().toISOString()
              }
            });
            
            if (paymentInfo && paymentInfo.clientSecret) {
              setClientSecret(paymentInfo.clientSecret);
              console.log(`Successfully recovered payment intent for order ${currentOrder.id}`);
            }
          } catch (paymentError) {
            console.error('Error recovering payment intent:', paymentError);
            // Even if recovery fails, stay on payment page so user can try again
          }
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not load payment information. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [user, router, toast, resumeOrderId]);

  // Handle progress updates in a separate effect
  useEffect(() => {
    async function updatePaymentProgress() {
      if (!user || !order || hasUpdatedProgress.current) return;
      
      try {
        // Cast the stage_data to our defined type
        const stageData = progress?.stage_data as StageData | undefined;
        const paymentData = stageData?.payment || {};
        
        await updateProgress('payment', {
          orderId: order.id,
          attemptCount: (paymentData.attemptCount || 0) + 1,
          lastAttemptAt: new Date().toISOString(),
          isRecovery: !!resumeOrderId
        });
        hasUpdatedProgress.current = true;
      } catch (error) {
        console.error('Error updating payment progress:', error);
      }
    }
    
    updatePaymentProgress();
  }, [user, order, updateProgress, resumeOrderId, progress?.stage_data]);

  // Proceed to payment
  const handleContinueToPayment = async () => {
    if (!order || !pricingInfo) {
      toast({ title: 'Error', description: 'Order details or pricing info missing.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the backend endpoint which handles create/update logic
      const paymentInfo = await createPaymentIntent({
        orderId: order.id,
        amount: pricingInfo.price, // Pass the *current* calculated price
        metadata: {
          tier: pricingInfo.tier,
          styleCount: styles.length.toString(),
          totalHeadshots: pricingInfo.totalHeadshots.toString()
        }
      });
      
      if (!paymentInfo || !paymentInfo.clientSecret) {
        throw new Error('Failed to get payment client secret from server.');
      }
      
      // Save the entire response to allow access to idempotencyKey if needed
      setClientSecret(paymentInfo.clientSecret);
      
      // Log the idempotency key for debugging
      console.log(`Payment prepared with idempotency key: ${paymentInfo.idempotencyKey}`);
      
      setPaymentStep('payment');
    } catch (error) {
      console.error('Error preparing payment:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'There was an error preparing your payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    toast({
      title: 'Processing Payment',
      description: 'Please do not close this page while your payment is being processed.',
    });

    // Note: The actual payment processing is now handled by the PaymentForm component below
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading payment options...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRecoveringPayment ? 'Resume Payment' : 'Checkout'}
        </h1>
        <p className="text-muted-foreground">
          {isRecoveringPayment 
            ? 'Continue your payment to generate your professional headshots.'
            : 'Complete your purchase to generate your professional headshots.'}
          {canModifyStyles() && !isRecoveringPayment && (
            <span className="ml-1">You can still modify your styles before making payment.</span>
          )}
        </p>
      </div>

      {paymentStep === 'summary' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Headshot Package</CardTitle>
                <CardDescription>
                  Based on your selection of {styles.length} {styles.length === 1 ? 'style' : 'styles'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingInfo && (
                  <>
                    <div>
                      <h3 className="font-medium mb-2">{styles.length} Custom Headshot {styles.length === 1 ? 'Style' : 'Styles'}</h3>
                      <ul className="space-y-1 text-sm ml-6 list-disc">
                        {styles.map((style) => (
                          <li key={style.id}>{style.name}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-2">{pricingInfo.tier.charAt(0).toUpperCase() + pricingInfo.tier.slice(1)} Package Includes:</h3>
                      <ul className="space-y-1">
                        <li className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                          {pricingInfo.totalHeadshots} total professional headshots
                        </li>
                        {pricingInfo.headshotsPerStyle && (
                          <li className="flex items-center text-sm">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            {pricingInfo.headshotsPerStyle} variations per style
                          </li>
                        )}
                        <li className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                          Full rights to all images
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                          Download in web-ready format
                        </li>
                        {pricingInfo.isAddOn && (
                          <li className="flex items-center text-sm">
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Additional capacity (+{pricingInfo.totalHeadshots - 120} headshots)
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                {/* Button moved to Order Summary card */}
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {styles.length} {styles.length === 1 ? 'style' : 'styles'} in your order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingInfo && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{pricingInfo.tier} Package</span>
                        <span>{formatPrice(pricingInfo.price)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatPrice(pricingInfo.price)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  className="w-full"
                  onClick={handleContinueToPayment}
                  disabled={isSubmitting || !pricingInfo}
                >
                  {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/app/shoot')}
                  disabled={isSubmitting}
                >
                  Modify Styles
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter your payment information securely</CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && (
                  <Elements 
                    stripe={getStripe()} 
                    options={{ 
                      clientSecret,
                      appearance: { theme: 'stripe' }
                    }}
                  >
                    <PaymentForm 
                      orderId={order?.id || ''} 
                      isSubmitting={isSubmitting} 
                      setIsSubmitting={setIsSubmitting} 
                    />
                  </Elements>
                )}
                
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>You won't be charged until payment is confirmed</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setPaymentStep('summary')}
                disabled={isSubmitting}
              >
                Back to Order Summary
              </Button>
            </div>
          </div>
          
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {styles.length} {styles.length === 1 ? 'style' : 'styles'} in your order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingInfo && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{pricingInfo.tier} Package</span>
                        <span>{formatPrice(pricingInfo.price)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatPrice(pricingInfo.price)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Add a new component to handle the payment form and submission
function PaymentForm({ 
  orderId, 
  isSubmitting, 
  setIsSubmitting 
}: { 
  orderId: string, 
  isSubmitting: boolean, 
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>> 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    
    setIsSubmitting(true);
    
    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/app/payment/success?order_id=${orderId}`,
      },
      redirect: 'if_required',
    });
    
    if (error) {
      // Show error to your customer
      toast({
        title: 'Payment Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    } else if (paymentIntent) {
      // Handle different payment intent statuses explicitly
      switch (paymentIntent.status) {
        case 'succeeded': 
          // The payment has been processed successfully
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          });
          
          // Redirect to success page
          router.push(`/app/payment/success?session_id=${paymentIntent.id}&order_id=${orderId}`);
          break;
          
        case 'requires_action':
          // Strong Customer Authentication (SCA) requires additional action (3DS)
          toast({
            title: 'Authentication Required',
            description: 'Additional authentication is required to complete your payment.',
            variant: 'default',
          });
          
          // Don't reset isSubmitting as authentication is ongoing
          // Let the Stripe redirect happen automatically
          // StripeJS will handle the redirect for SCA when needed
          break;
          
        case 'processing':
          // Payment is being processed asynchronously
          toast({
            title: 'Payment Processing',
            description: 'Your payment is being processed. We\'ll notify you when it completes.',
          });
          
          // Redirect to a pending page or show processing UI
          router.push(`/app/payment/processing?payment_intent=${paymentIntent.id}&order_id=${orderId}`);
          break;
          
        case 'requires_payment_method':
          // Payment failed, customer needs to try another payment method
          toast({
            title: 'Payment Failed',
            description: 'Please try another payment method.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          break;
          
        default:
          // Fallback for other statuses
          toast({
            title: 'Payment Update',
            description: `Payment status: ${paymentIntent.status}. We'll update you when it completes.`,
          });
          
          // Redirect to status tracking page
          router.push(`/app/payment/status?payment_intent=${paymentIntent.id}&order_id=${orderId}&status=${paymentIntent.status}`);
      }
    } else {
      // No paymentIntent and no error - shouldn't happen but handle it
      toast({
        title: 'Unexpected Response',
        description: 'Received an unexpected response. Please contact support.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Pay Now'}
        {!isSubmitting && <CreditCard className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
} 