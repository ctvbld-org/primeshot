"use client";

import { Button } from "@primeshot/common/web/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import styles from './verify.module.css';
import { useTranslation } from 'react-i18next';
import { Suspense } from "react";

const EmailIcon = () => (
  <svg width="64" height="65" viewBox="0 0 64 65" fill="none" xmlns="http://www.w3.org/2000/svg"> 
    <path d="M38 48.5H8L7.9932 18.3124L30.8614 34.1446C31.196 34.376 31.5932 34.5 32 34.5C32.4068 34.5 32.804 34.376 33.1386 34.1446L56 18.3174V36.5H60V16.5C59.9986 15.4396 59.5767 14.423 58.8269 13.6732C58.077 12.9233 57.0604 12.5014 56 12.5H8C6.93951 12.5012 5.9228 12.923 5.17292 13.6729C4.42304 14.4228 4.00122 15.4395 4 16.5V48.5C4.00143 49.5604 4.42332 50.577 5.17315 51.3269C5.92299 52.0767 6.93957 52.4986 8 52.5H38V48.5ZM51.5972 16.5L32 30.0674L12.4028 16.5H51.5972Z" fill="#44E3C9"/>
    <path d="M52 56.5C56.4183 56.5 60 52.9183 60 48.5C60 44.0817 56.4183 40.5 52 40.5C47.5817 40.5 44 44.0817 44 48.5C44 52.9183 47.5817 56.5 52 56.5Z" fill="#FF973C"/>
  </svg>
);

// OTP Input Component
function OtpInput({ value, onChange, onComplete }: { 
  value: string; 
  onChange: (value: string) => void; 
  onComplete: () => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    
    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('');
    
    onChange(updatedValue);
    
    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when complete
    if (updatedValue.length === 6) {
      onComplete();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pastedData);
    
    if (pastedData.length === 6) {
      onComplete();
    }
  };

  return (
    <div className={styles.otpContainer}>
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={styles.otpInput}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

function VerifyEmailContent() {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const supabase = createClient();
  const { t } = useTranslation('auth');
  
  const handleVerifyOtp = async () => {
    if (!email || otpCode.length !== 6) {
      toast.error(t('verify.otp.error.invalidCode'));
      return;
    }

    try {
      setIsVerifying(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });
      
      if (error) {
        if (error.message.includes('expired')) {
          toast.error(t('verify.otp.error.expired'));
        } else if (error.message.includes('invalid')) {
          toast.error(t('verify.otp.error.invalid'));
        } else {
          toast.error(t('verify.otp.error.generic'));
        }
        setOtpCode(''); // Clear the code on error
        return;
      }
      
      // Redirect to app root (basePath is handled automatically by Next.js)
      toast.success(t('verify.otp.success'));
      router.push('/');
    } catch (error) {
      toast.error(t('verify.otp.error.generic'));
      console.error("OTP verification error:", error);
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error(t('verify.resend.error.noEmail'));
      return;
    }

    try {
      setIsResending(true);
      // Use the same method as initial signup for consistency
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Don't include emailRedirectTo for resend to avoid confusion
          shouldCreateUser: true
        }
      });
      
      if (error) throw error;
      
      toast.success(t('verify.resend.success'));
      setOtpCode(''); // Clear current code
    } catch (error) {
      toast.error(t('verify.resend.error.failed'));
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
      <h2 className={styles.title}>{t('verify.otp.title')}</h2>
      <p className={styles.description}>
        {t('verify.otp.description')} {email && <strong>{email}</strong>}
      </p>
      
      <div className={styles.otpSection}>
        <OtpInput 
          value={otpCode}
          onChange={setOtpCode}
          onComplete={handleVerifyOtp}
        />
        
        {otpCode.length === 6 && (
          <Button
            className={styles.verifyButton}
            onClick={handleVerifyOtp}
            disabled={isVerifying}
            loading={isVerifying}
          >
            {isVerifying ? t('verify.otp.verifying') : t('verify.otp.verify')}
          </Button>
        )}
      </div>

      {email && (
        <p className={styles.resendText}>
          {t('verify.resend.text')} 
          <Button 
            className={styles.resendButton} 
            variant="link" 
            onClick={handleResend} 
            disabled={isResending || !email}
            loading={isResending}
          >
            {isResending ? t('verify.resend.buttonLoading') : t('verify.resend.button')}
          </Button>
        </p>
      )}
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