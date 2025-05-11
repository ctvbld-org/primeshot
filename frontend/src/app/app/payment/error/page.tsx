'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentErrorPage() {
  const { t } = useTranslation('payment');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const error = searchParams.get('error') || t('errors.verificationFailed');
  const sessionId = searchParams.get('session_id');
  
  const handleRetry = () => {
    // If we have a session ID, we can try to recover the checkout session
    if (sessionId) {
      // Redirect back to checkout with the same session
      router.push(`/api/payment/recover-session?session_id=${sessionId}`);
    } else {
      // Otherwise, just go back to payment page to start over
      router.push('/app/payment');
    }
  };
  
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