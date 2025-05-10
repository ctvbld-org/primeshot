'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Style } from '@/lib/types';

interface OrderDetails {
  id: string;
  shoot_number?: number;
  status: string;
  amount: number;
  updated_at: string;
  styles: Style[];
  payment_status: string;
}

export default function PaymentSuccessPage() {
  const { t } = useTranslation('payment');
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateProgress, clearProgress } = useUserProgress();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  // Use ref to prevent resetting on re-renders
  const isVerifyingRef = useRef(false);
  
  // Get session ID and order ID from URL
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  useEffect(() => {
    async function verifyPayment() {
      if (isVerifyingRef.current || verificationAttempted) return;
      isVerifyingRef.current = true;
      
      if (!user) {
        setError(t('errors.loginRequired'));
        setIsLoading(false);
        setVerificationAttempted(true);
        return;
      }
      
      if (!sessionId && !orderId) {
        setError(t('errors.missingInfo'));
        setIsLoading(false);
        setVerificationAttempted(true);
        return;
      }
      
      try {
        const supabase = createClient();
        
        // Get order details
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderError || !order) {
          throw new Error(t('errors.orderNotFound'));
        }
        
        // Verify payment status with Stripe session ID
        const { data: verifyData, error: verifyError } = await supabase
          .functions.invoke('verify-stripe-payment', {
            body: { sessionId, orderId }
          });
          
        if (verifyError || !verifyData?.success) {
          throw new Error(t('errors.verificationFailed'));
        }
        
        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
          
        if (updateError) {
          throw new Error('Failed to update order status');
        }
        
        // Update user progress
        await updateProgress('payment');
        await clearProgress(); // Clear progress after successful payment
        
        setOrderDetails(order);
        setIsLoading(false);
        setVerificationAttempted(true);
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error instanceof Error ? error.message : t('errors.unexpectedError'));
        setIsLoading(false);
        setVerificationAttempted(true);
      }
    }
    
    verifyPayment();
  }, [user, sessionId, orderId, t, updateProgress, clearProgress]);
  
  const handleContinue = () => {
    router.push('/app/upload');
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>{t('status.verifying')}</CardTitle>
          <CardDescription>{t('status.confirming')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('status.error')}
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push('/app/shoot')}>
            {t('buttons.returnToStyles')}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {t('status.completed')}
        </CardTitle>
        <CardDescription>
          {t('success.subtitle', {
            amount: ((orderDetails?.amount || 0) / 100).toFixed(2),
            styles: orderDetails?.styles?.length || 0
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>{t('success.nextSteps.description')}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleContinue} className="w-full">
          {t('buttons.continueToUpload')}
        </Button>
      </CardFooter>
    </Card>
  );
} 