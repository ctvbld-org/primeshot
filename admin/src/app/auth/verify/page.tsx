"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@primeshot/common/web/ui/card";
import { Button } from "@primeshot/common/web/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import styles from './verify.module.css';
import { useTranslation } from 'react-i18next';
import { Suspense } from "react";

const EmailIcon = () => (
  <svg width="64" height="65" viewBox="0 0 64 65" fill="none" xmlns="http://www.w3.org/2000/svg"> 
    <path d="M38 48.5H8L7.9932 18.3124L30.8614 34.1446C31.196 34.376 31.5932 34.5 32 34.5C32.4068 34.5 32.804 34.376 33.1386 34.1446L56 18.3174V36.5H60V16.5C59.9986 15.4396 59.5767 14.423 58.8269 13.6732C58.077 12.9233 57.0604 12.5014 56 12.5H8C6.93951 12.5012 5.9228 12.923 5.17292 13.6729C4.42304 14.4228 4.00122 15.4395 4 16.5V48.5C4.00143 49.5604 4.42332 50.577 5.17315 51.3269C5.92299 52.0767 6.93957 52.4986 8 52.5H38V48.5ZM51.5972 16.5L32 30.0674L12.4028 16.5H51.5972Z" fill="#44E3C9"/>
    <path d="M52 56.5C56.4183 56.5 60 52.9183 60 48.5C60 44.0817 56.4183 40.5 52 40.5C47.5817 40.5 44 44.0817 44 48.5C44 52.9183 47.5817 56.5 52 56.5Z" fill="#FF973C"/>
  </svg>
);

function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const supabase = createClient();
  const { t } = useTranslation('auth');
  
  const handleResend = async () => {
    if (!email) {
      toast.error("Email address not found. Please try signing up again.");
      return;
    }

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      toast.success("Verification email resent successfully!");
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again.");
      console.error("Resend error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.iconContainer}>
        <EmailIcon />
      </div>
        <h2 className={styles.title}>{t('verify.title')}</h2>
        <p className={styles.description}>
          {t('verify.description')}
        </p>
        {email &&
          <p className={styles.resendText}>{t('verify.resend.text')} <Button 
            className={styles.resendButton} 
            variant="link" 
            onClick={handleResend} 
            disabled={isResending || !email}
            loading={isResending}
          >{isResending ? t('verify.resend.buttonLoading') : t('verify.resend.button')}</Button></p>
        }
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
} 