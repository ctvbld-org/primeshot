'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function SignIn() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const { signIn, signInWithGoogle, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('auth');
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get return URL from query params
  const returnUrlParam = searchParams.get('returnUrl') || '/app/shoot';
  // Validate that returnUrl is a relative path to prevent open redirect vulnerabilities
  const isValidUrl = returnUrlParam && !returnUrlParam.startsWith('http://') && !returnUrlParam.startsWith('https://');
  const returnUrl = isValidUrl ? returnUrlParam : '/app/shoot';

  // Redirect to return URL if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const decodedReturnUrl = decodeURIComponent(returnUrl);
      router.replace(decodedReturnUrl);
    }
  }, [isAuthenticated, returnUrl, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email);
    // Router will handle redirect via the useEffect above
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // Router will handle redirect via the useEffect above
  };

  // Show nothing until client-side rendering is ready
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>&nbsp;</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{t('signin.title')}</CardTitle>
          <CardDescription>{t('signin.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signin.email.placeholder')}
                required
              />
              {error && (
                <p className="text-sm text-red-500">{error.message || t('errors.generic')}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signin.email.loading') : t('signin.email.button')}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('signin.divider.text')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {t('signin.google.button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 