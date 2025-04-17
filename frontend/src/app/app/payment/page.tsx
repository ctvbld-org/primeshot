'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/hooks/use-user-progress';
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
      if (isLoading === false) return; // Prevent re-loading once data is loaded
      
      const supabase = createClient();
      let currentOrder: Order;
      
      try {
        // If resuming a payment, get that specific order
        if (resumeOrderId) {
          setIsRecoveringPayment(true);
          console.log(`Attempting to recover payment for order: ${resumeOrderId}`);
          
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', resumeOrderId)
            .eq('user_id', user.id) // Security: ensure the order belongs to this user
            .eq('status', 'pending_payment')
            .single();
          
          if (error || !data) {
            throw new Error('Order not found or not in a recoverable state');
          }
          
          currentOrder = data;
          console.log(`Successfully found order ${currentOrder.id} for payment recovery`);
        } else {
          // Get the single draft or pending_payment order for the user
          currentOrder = await getOrCreateDraftOrder(user.id);
        }
        
        setOrder(currentOrder);

        // Get styles associated with this specific order
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', user.id)
          .eq('order_id', currentOrder.id) // Fetch styles ONLY for the retrieved order
          .order('created_at', { ascending: true });
          
        if (stylesError) throw stylesError;
        
        // It's possible the order exists but has no styles yet if user just created the order
        // and immediately navigated here.
        setStyles(stylesData || []); 
        
        // Check if there are actually styles before proceeding
        if (!stylesData || stylesData.length === 0) {
          // Allow loading the payment page even with 0 styles if the order exists
          // but maybe show a different state or disable payment button?
          // For now, let's calculate price based on 0 styles if needed.
          console.log('No styles found for order', currentOrder.id, 'calculating price for 0 styles.');
        }
        
        // Calculate pricing based on the actual style count for the order
        const styleCount = stylesData?.length || 0;
        const pricing = calculatePricing(styleCount);
        setPricingInfo(pricing);
        
        // If the order amount doesn't match the calculated price, update the order
        // This syncs the order amount if styles were changed on the shoot page
        if (currentOrder.amount !== pricing.price) {
          console.log(`Order ${currentOrder.id} amount (${currentOrder.amount}) differs from calculated price (${pricing.price}). Updating order.`);
          
          try {
            // Use the proxy endpoint instead of direct database updates
            const response = await fetch('/api/proxy/update-order-amount', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: currentOrder.id,
                newAmount: pricing.price,
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(errorData.error || `Failed with status ${response.status}`);
            }
            
            // Update local order state optimistically on success
            setOrder(prev => prev ? { ...prev, amount: pricing.price } : null);
          } catch (error) {
            console.error("Failed to update order amount via proxy:", error);
            // Non-critical error, proceed but log it
          }
        }

        // Update progress once per session
        if (!hasUpdatedProgress.current) {
          // Cast the stage_data to our defined type
          const stageData = progress?.stage_data as StageData | undefined;
          const paymentData = stageData?.payment || {};
          
          await updateProgress('payment', {
            orderId: currentOrder.id,
            attemptCount: (paymentData.attemptCount || 0) + 1,
            lastAttemptAt: new Date().toISOString(),
            isRecovery: !!resumeOrderId
          });
          hasUpdatedProgress.current = true;
        }
        
        // If this is a payment recovery, proceed directly to payment step
        // Also attempt to restore the payment intent
        if (resumeOrderId && currentOrder.payment_intent_id) {
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
        
        // Handle payment recovery errors specifically
        if (resumeOrderId && error instanceof Error) {
          toast({ 
            title: 'Payment Recovery Failed', 
            description: 'We couldn\'t restore your previous payment. Starting a new payment process.',
            variant: 'destructive'
          });
          // Redirect to regular payment flow
          router.replace('/app/payment');
          return;
        }
        
        // If error is about no styles, redirect slightly differently?
        if (error instanceof Error && error.message.includes('No styles found')) { 
           toast({ title: 'No Styles', description: 'Please add styles to your shoot first.', variant: 'destructive' });
           router.push('/app/shoot');
        } else {
          toast({ title: 'Error', description: 'Failed to load payment data.', variant: 'destructive' });
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [user, router, toast, updateProgress, resumeOrderId, progress?.stage_data]);

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