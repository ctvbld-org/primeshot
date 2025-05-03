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
        
        let query = supabase
          .from('orders')
          .select('*, styles(*)')
          .eq('user_id', user.id);
          
        if (sessionId) {
          query = query.eq('payment_intent_id', sessionId);
        } 
        else if (orderId) {
          query = query.eq('id', orderId);
        }
        
        const { data: orders, error: orderError } = await query.limit(1);
          
        if (orderError) throw orderError;
        
        if (!orders || orders.length === 0) {
          setError(t('errors.orderNotFound'));
          setIsLoading(false);
          setVerificationAttempted(true);
          return;
        }
        
        const order = orders[0];
        setOrderDetails(order);
        
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
          
          await updateProgress('payment');
          await clearProgress();
          await updateProgress('upload');
        } else {
          console.log(`Order ${order.id} already marked as paid, skipping status update`);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError(t('errors.verificationFailed'));
      } finally {
        setIsLoading(false);
        setVerificationAttempted(true);
        isVerifyingRef.current = false;
      }
    }
    
    verifyPayment();
  }, [user, sessionId, orderId, updateProgress, clearProgress, verificationAttempted, t]);
  
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
        <p className="text-xl">{t('status.confirming')}</p>
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
              <CardTitle className="text-destructive">{t('status.error')}</CardTitle>
            </div>
            <CardDescription>
              {t('errors.verificationFailed')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('security.noCharge')}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              {t('buttons.returnToPayment')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/app/shoot')} className="w-full">
              {t('buttons.returnToStyles')}
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
        <h1 className="text-3xl font-bold tracking-tight">{t('success.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('success.subtitle')}
        </p>
      </div>
      
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{t('success.orderSummary.title')}</CardTitle>
          <CardDescription>
            {t('success.orderSummary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderDetails && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">{t('fields.shootNumber')}</p>
                  <p className="text-muted-foreground">
                    {orderDetails?.shoot_number 
                      ? `Shoot ${orderDetails.shoot_number.toString().padStart(3, '0')}` 
                      : t('status.processing')}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{t('fields.orderId')}</p>
                  <p className="text-muted-foreground">{orderDetails?.id ? orderDetails.id.substring(0, 8) : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">{t('fields.date')}</p>
                  <p className="text-muted-foreground">
                    {orderDetails?.updated_at ? new Date(orderDetails.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{t('fields.status')}</p>
                  <p className="text-muted-foreground capitalize">{orderDetails?.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">{t('success.orderSummary.amount')}</p>
                  <p className="text-muted-foreground">
                    ${((orderDetails?.amount || 0) / 100).toFixed(2)} USD
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">{t('success.orderSummary.stylesTitle')}</h3>
                <ul className="space-y-1 text-sm">
                  {orderDetails?.styles && Array.isArray(orderDetails.styles) && orderDetails.styles.length > 0 ? orderDetails.styles.map((style: Style) => (
                    <li key={style?.id || `style-${Math.random()}`} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {style?.name || t('fields.styles')}
                    </li>
                  )) : (
                    <li className="text-muted-foreground">{t('errors.noStyles.description')}</li>
                  )}
                </ul>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">{t('success.nextSteps.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('success.nextSteps.description')}
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            {t('buttons.continueToUpload')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 