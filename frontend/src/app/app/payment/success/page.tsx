'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/hooks/use-user-progress';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { updateProgress, clearProgress } = useUserProgress();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  // Use ref to prevent resetting on re-renders
  const isVerifyingRef = useRef(false);
  
  // Get session ID and order ID from URL
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  useEffect(() => {
    async function verifyPayment() {
      // Check verification flag with ref
      if (isVerifyingRef.current || verificationAttempted) return;
      isVerifyingRef.current = true;
      
      if (!user) {
        setError('You must be logged in to view this page.');
        setIsLoading(false);
        setVerificationAttempted(true);
        return;
      }
      
      if (!sessionId && !orderId) {
        setError('Missing payment or order information.');
        setIsLoading(false);
        setVerificationAttempted(true);
        return;
      }
      
      try {
        // Fetch order information
        const supabase = createClient();
        
        let query = supabase
          .from('orders')
          .select('*, styles(*)')
          .eq('user_id', user.id);
          
        // If we have a payment intent ID (session ID), use that first
        if (sessionId) {
          query = query.eq('payment_intent_id', sessionId);
        } 
        // Otherwise use the order ID
        else if (orderId) {
          query = query.eq('id', orderId);
        }
        
        const { data: orders, error: orderError } = await query.limit(1);
          
        if (orderError) throw orderError;
        
        if (!orders || orders.length === 0) {
          setError('Order not found.');
          setIsLoading(false);
          setVerificationAttempted(true);
          return;
        }
        
        const order = orders[0];
        setOrderDetails(order);
        
        // Check if payment status is already set to 'succeeded' or 'paid'
        // This prevents updating the status multiple times on page reloads
        if (order.status !== 'paid' || order.payment_status !== 'succeeded') {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_status: 'succeeded',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
            
          console.log(`Updated order ${order.id} status to paid`);
          
          // Update user progress and mark payment as completed
          await updateProgress('payment');
          
          // Update to clear progress after payment completion
          await clearProgress();
          
          // Update progress to next stage
          await updateProgress('upload');
        } else {
          console.log(`Order ${order.id} already marked as paid, skipping status update`);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('Failed to verify payment status.');
      } finally {
        setIsLoading(false);
        setVerificationAttempted(true);
        isVerifyingRef.current = false;
      }
    }
    
    verifyPayment();
  }, [user, sessionId, orderId, updateProgress, clearProgress, verificationAttempted]);
  
  const handleContinue = () => {
    router.push('/app/upload');
  };
  
  const handleRetry = () => {
    router.push('/app/payment');
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl">Confirming your payment...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Payment Error</CardTitle>
            </div>
            <CardDescription>
              There was a problem confirming your payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You have not been charged. If you believe this is an error, please try again or contact support.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              Return to Payment
            </Button>
            <Button variant="outline" onClick={() => router.push('/app/shoot')} className="w-full">
              Return to Styles
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
        <p className="text-muted-foreground mt-2">
          Your headshots are now being generated!
        </p>
      </div>
      
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>
            Your order has been confirmed and is being processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderDetails && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Shoot Number</p>
                  <p className="text-muted-foreground">
                    {orderDetails?.shoot_number 
                      ? `Shoot ${orderDetails.shoot_number.toString().padStart(3, '0')}` 
                      : 'Processing'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Order ID</p>
                  <p className="text-muted-foreground">{orderDetails?.id ? orderDetails.id.substring(0, 8) : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">
                    {orderDetails?.updated_at ? new Date(orderDetails.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-muted-foreground capitalize">{orderDetails?.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Amount</p>
                  <p className="text-muted-foreground">
                    ${((orderDetails?.amount || 0) / 100).toFixed(2)} USD
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Your Headshot Styles</h3>
                <ul className="space-y-1 text-sm">
                  {orderDetails?.styles && Array.isArray(orderDetails.styles) && orderDetails.styles.length > 0 ? orderDetails.styles.map((style: any) => (
                    <li key={style?.id || `style-${Math.random()}`} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {style?.name || 'Unknown Style'}
                    </li>
                  )) : (
                    <li className="text-muted-foreground">No styles selected</li>
                  )}
                </ul>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Next Steps</h3>
                <p className="text-sm text-muted-foreground">
                  Now that your payment is complete, you need to upload your photos so we can generate your professional headshots.
                  Click the button below to proceed to the photo upload step.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            Continue to Photo Upload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 