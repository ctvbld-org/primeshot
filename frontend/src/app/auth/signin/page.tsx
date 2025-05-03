'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AnimatedBackground } from "@/components/auth/animated-background";
import { TiltCard } from "@/components/animations/TiltCard";
import { LoadingContent } from "@/components/ui/loading-content";
import Image from "next/image";
import Link from "next/link";
import styles from './signin.module.css';
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/use-toast";

export default function SignIn() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { signIn, signInWithGoogle, signInWithLinkedIn, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('auth');
  const { toast } = useToast();
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track image loading
  useEffect(() => {
    if (!mounted) return;

    const images = document.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      setImagesLoaded(true);
      return;
    }

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    images.forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad); // Count errors as loaded to prevent hanging
      }
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [mounted]);

  // Create a stable showToast function
  const showToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  // Check for social sign-in cancellation from URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    if (error === 'user_cancelled_login' || error === 'access_denied') {
      showToast(
        "Sign in cancelled",
        "You cancelled the sign in process"
      );
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    } else if (error && errorDescription) {
      showToast(
        "Sign in error",
        decodeURIComponent(errorDescription).replace(/\+/g, ' ')
      );
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [showToast]);

  // Get return URL from query params
  const returnUrlParam = searchParams.get('returnUrl') || '/app/shoot';
  // Validate that returnUrl is a relative path to prevent open redirect vulnerabilities
  const isValidUrl = returnUrlParam && !returnUrlParam.startsWith('http://') && !returnUrlParam.startsWith('https://');
  const returnUrl = isValidUrl ? returnUrlParam : '/app/shoot';

  // Redirect to return URL if already authenticated
  if (isAuthenticated) {
    const decodedReturnUrl = decodeURIComponent(returnUrl);
    router.replace(decodedReturnUrl);
    return null;
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email);
  };

  // Show nothing until client-side rendering is ready
  if (!mounted) {
    return null;
  }

  return (
    <LoadingContent
      className="min-h-screen"
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      }
    >
      <AnimatedBackground />
      <div className={styles.container}>
        <TiltCard className={styles.card}>
          <CardContent className={styles.cardContent}>
            {/* Logo */}
            <div className={styles.logoContainer}>
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={48} 
                height={48} 
                className={styles.logo}
              />
            </div>

            <div className={styles.headingContainer}>
              {/* Heading */}
              <h1 className={styles.heading}>
                {t('signin.getStarted.title')}
              </h1>
              <p className={styles.subheading}>
                {t('signin.getStarted.description')}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className={styles.socialButtons}>
              <Button 
                variant="ghost"
                onClick={() => signInWithGoogle()}
                className={styles.socialButton}
                disabled={isLoading}
              >
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.52 12.7729C23.52 11.922 23.4436 11.1038 23.3018 10.3184H12V14.9602H18.4582C18.18 16.4602 17.3345 17.7311 16.0636 18.582V21.5929H19.9418C22.2109 19.5038 23.52 16.4275 23.52 12.7729Z" fill="#4285F4"/>
                  <path d="M12.0049 24.5C15.2449 24.5 17.9613 23.4255 19.9467 21.5928L16.0685 18.5818C14.994 19.3018 13.6194 19.7273 12.0049 19.7273C8.87943 19.7273 6.23398 17.6164 5.29034 14.78H1.28125V17.8891C3.2558 21.8109 7.31398 24.5 12.0049 24.5Z" fill="#34A853"/>
                  <path d="M5.28545 14.7802C5.04545 14.0602 4.90909 13.2911 4.90909 12.5002C4.90909 11.7093 5.04545 10.9402 5.28545 10.2202V7.11108H1.27636C0.463636 8.73108 0 10.5638 0 12.5002C0 14.4365 0.463636 16.2693 1.27636 17.8893L5.28545 14.7802Z" fill="#FBBC05"/>
                  <path d="M12.0049 5.27273C13.7667 5.27273 15.3485 5.87818 16.5922 7.06727L20.034 3.62545C17.9558 1.68909 15.2394 0.5 12.0049 0.5C7.31398 0.5 3.2558 3.18909 1.28125 7.11091L5.29034 10.22C6.23398 7.38364 8.87943 5.27273 12.0049 5.27273Z" fill="#EA4335"/>
                </svg>
              </Button>
              <Button 
                variant="ghost"
                onClick={() => signInWithLinkedIn()}
                className={styles.socialButton}
                disabled={isLoading}
              >
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 2.21919C0 1.27025 0.794438 0.5 1.77375 0.5H22.2262C23.2059 0.5 24 1.27025 24 2.21919V22.7811C24 23.7303 23.2059 24.5 22.2262 24.5H1.77375C0.794531 24.5 0 23.7304 0 22.7814V2.21891V2.21919Z" fill="#0A66C2"/>
                <path d="M7.29525 20.5847V9.77985H3.70387V20.5847H7.29563H7.29525ZM5.50031 8.30488C6.75244 8.30488 7.53197 7.4752 7.53197 6.43832C7.50853 5.37782 6.75244 4.57129 5.52413 4.57129C4.29497 4.57129 3.49219 5.37782 3.49219 6.43823C3.49219 7.4751 4.27144 8.30479 5.47678 8.30479H5.50003L5.50031 8.30488ZM9.28312 20.5847H12.8742V14.5514C12.8742 14.2289 12.8977 13.9056 12.9925 13.6753C13.252 13.0298 13.8429 12.3616 14.8353 12.3616C16.1345 12.3616 16.6545 13.3524 16.6545 14.805V20.5847H20.2455V14.3895C20.2455 11.0709 18.474 9.52654 16.1112 9.52654C14.1741 9.52654 13.3233 10.6093 12.8506 11.3467H12.8745V9.78023H9.28331C9.33019 10.7939 9.28303 20.5851 9.28303 20.5851L9.28312 20.5847Z" fill="white"/>
              </svg>
              </Button>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.dividerLine}></span>
              <span className={styles.dividerText}>{t('signin.divider.text')}</span>
              <span className={styles.dividerLine}></span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className={styles.form}>
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('signin.emailInput.placeholder')}
                  className={styles.input}
                  required
                />
                {error && (
                  <p className={styles.errorMessage}>{error.message || t('errors.generic')}</p>
                )}
              </div>
              <Button 
                variant="primary"
                size="lg"
                type="submit" 
                className={styles.submitButton}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? t('signin.emailInput.sendingButton') : t('signin.emailInput.sendButton')}
                <Icon variant="arrowRight" className={styles.arrowRight} />
              </Button>
            </form>

            {/* Terms */}
            <p className={styles.terms}>
              {t('signin.terms.text')} <br />
              <Link href="/terms" className={styles.termsLink}>
                {t('signin.terms.termsLink')}
              </Link>
              &nbsp;{t('signin.terms.and')}&nbsp;
              <Link href="/privacy" className={styles.termsLink}>
                {t('signin.terms.privacyLink')}
              </Link>
            </p>
          </CardContent>
        </TiltCard>
      </div>
    </LoadingContent>
  );
} 