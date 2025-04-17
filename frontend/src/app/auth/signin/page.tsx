'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const { signIn, signInWithGoogle, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get return URL from query params
  const returnUrl = searchParams.get('returnUrl') || '/app/shoot';

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to Primeshot</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              {error && (
                <p className="text-sm text-red-500">{error.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Continue with Email"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
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
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 