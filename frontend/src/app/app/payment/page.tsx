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
import { getStripe, createCheckoutSession } from '@/lib/stripe';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { formatPrice, calculatePricing } from '@/lib/pricing';
import type { PricingInfo } from '@/lib/pricing';
import type { Order, Style } from '@/lib/types';
import { getOrCreateDraftOrder } from '@/lib/api/orders';
import { useTranslation } from 'react-i18next';

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

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch user profile with retries
async function fetchUserProfile(supabase: any, userId: string, maxAttempts = RETRY_ATTEMPTS) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed to fetch user profile:`, error);
      
      if (attempt < maxAttempts) {
        await delay(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      }
    }
  }
  
  return { data: null, error: lastError };
}

export default function PaymentPage() {
  const { t } = useTranslation('payment');
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { updateProgress, progress, canModifyStyles } = useUserProgress();
  const hasUpdatedProgress = useRef(false);
  
  const resumeOrderId = searchParams.get('resume');
  
  const [isLoading, setIsLoading] = useState(true);
  const [styles, setStyles] = useState<Style[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [isRecoveringPayment, setIsRecoveringPayment] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!user) return;
      
      const supabase = createClient();
      let currentOrder: Order;
      
      try {
        // Fetch user profile data with retries
        const { data: profileData, error: profileError } = await fetchUserProfile(supabase, user.id);
        
        if (profileError) {
          console.error('Error fetching user profile after retries:', profileError);
          // Only show toast for critical errors
          toast({ 
            title: t('status.error'),
            description: t('errors.loadPaymentData'),
            variant: 'destructive'
          });
        }
        
        if (isMounted) {
          setUserProfile(profileData);
        }

        if (resumeOrderId) {
          setIsRecoveringPayment(true);
          console.log(`Attempting to recover payment for order: ${resumeOrderId}`);
          
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', resumeOrderId)
            .eq('user_id', user.id)
            .eq('status', 'pending_payment')
            .single();
          
          if (error || !data) {
            throw new Error(t('errors.orderNotFound'));
          }
          
          currentOrder = data;
          console.log(`Successfully found order ${currentOrder.id} for payment recovery`);
        } else {
          currentOrder = await getOrCreateDraftOrder(user.id);
        }
        
        setOrder(currentOrder);

        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', user.id)
          .eq('order_id', currentOrder.id)
          .order('created_at', { ascending: true });
          
        if (stylesError) throw stylesError;
        
        setStyles(stylesData || []);
        
        if (!stylesData || stylesData.length === 0) {
          console.log('No styles found for order', currentOrder.id, 'calculating price for 0 styles.');
        }
        
        const styleCount = stylesData?.length || 0;
        const pricing = calculatePricing(styleCount);
        setPricingInfo(pricing);
        
        if (currentOrder.amount !== pricing.price) {
          console.log(`Order ${currentOrder.id} amount (${currentOrder.amount}) differs from calculated price (${pricing.price}). Updating order.`);
          
          try {
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
              const errorData = await response.json().catch(() => ({ error: t('errors.unexpectedError') }));
              throw new Error(errorData.error || t('errors.unexpectedError'));
            }
            
            setOrder(prev => prev ? { ...prev, amount: pricing.price } : null);
          } catch (error) {
            console.error("Failed to update order amount via proxy:", error);
          }
        }

        if (!hasUpdatedProgress.current) {
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
      } catch (error) {
        console.error('Error loading payment data:', error);
        
        if (resumeOrderId && error instanceof Error) {
          toast({ 
            title: t('errors.paymentRecovery.title'), 
            description: t('errors.paymentRecovery.description'),
            variant: 'destructive'
          });
          router.replace('/app/payment');
          return;
        }
        
        if (error instanceof Error && error.message.includes('No styles found')) { 
           toast({ 
             title: t('errors.noStyles.title'), 
             description: t('errors.noStyles.description'), 
             variant: 'destructive' 
           });
           router.push('/app/shoot');
        } else {
          toast({ 
            title: t('status.error'), 
            description: t('errors.loadPaymentData'), 
            variant: 'destructive' 
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user, router, toast, updateProgress, resumeOrderId, progress?.stage_data, t]);

  const handleContinueToPayment = async () => {
    if (!order || !pricingInfo) {
      toast({ 
        title: t('status.error'), 
        description: t('errors.missingInfo'), 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const checkoutInfo = await createCheckoutSession({
        orderId: order.id,
        amount: pricingInfo.price,
        metadata: {
          tier: pricingInfo.tier,
          styleCount: styles.length.toString(),
          totalHeadshots: pricingInfo.totalHeadshots.toString()
        },
        customerEmail: user?.email,
        customerName: userProfile?.full_name || undefined
      });
      
      if (!checkoutInfo || !checkoutInfo.sessionId) {
        throw new Error(t('errors.paymentClientSecret'));
      }
      
      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutInfo.sessionId
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error preparing payment:', error);
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('errors.unexpectedError'),
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">{t('status.loadingPayment')}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRecoveringPayment ? t('common.resumePayment.title') : t('common.checkout.title')}
        </h1>
        <p className="text-muted-foreground">
          {isRecoveringPayment 
            ? t('common.resumePayment.description')
            : t('common.checkout.description')}
          {canModifyStyles() && !isRecoveringPayment && (
            <span className="ml-1">{t('common.checkout.canModifyNote')}</span>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('fields.package.title')}</CardTitle>
              <CardDescription>
                {t('fields.package.description', { 
                  count: styles.length,
                  style: styles.length === 1 ? t('_.style') : t('_.style_plural')
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingInfo && (
                <>
                  <div>
                    <h3 className="font-medium mb-2">
                      {t('pricing.package.description', { 
                        count: styles.length,
                        style: styles.length === 1 ? t('_.style') : t('_.style_plural')
                      })}
                    </h3>
                    <ul className="space-y-1 text-sm ml-6 list-disc">
                      {styles.map((style) => (
                        <li key={style.id}>{style.name}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">
                      {t('fields.package.includes', { tier: pricingInfo.tier.charAt(0).toUpperCase() + pricingInfo.tier.slice(1) })}
                    </h3>
                    <ul className="space-y-1">
                      <li className="flex items-center text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        {t('fields.package.features.totalHeadshots', { count: pricingInfo.totalHeadshots })}
                      </li>
                      {pricingInfo.headshotsPerStyle && (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                          {t('fields.package.features.variations', { count: pricingInfo.headshotsPerStyle })}
                        </li>
                      )}
                      <li className="flex items-center text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        {t('fields.package.features.fullRights')}
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        {t('fields.package.features.webFormat')}
                      </li>
                      {pricingInfo.isAddOn && (
                        <li className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                          {t('fields.package.features.additionalCapacity', { count: pricingInfo.totalHeadshots - 120 })}
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>{t('common.order.title')}</CardTitle>
              <CardDescription>
                {t('pricing.package.description', { 
                  count: styles.length,
                  style: styles.length === 1 ? t('_.style') : t('_.style_plural')
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingInfo && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {t('pricing.package.title', { tier: pricingInfo.tier })}
                      </span>
                      <span>{formatPrice(pricingInfo.price)}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>{t('pricing.total')}</span>
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
                {isSubmitting ? t('status.processing') : t('buttons.continueToPayment')}
                {!isSubmitting && <CreditCard className="ml-2 h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/app/shoot')}
                disabled={isSubmitting}
              >
                {t('buttons.modifyStyles')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 