'use client'

import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from '@/components/ui/loader';

export default function AppRoot() {
  const { user } = useAuth();
  const { progress, isLoading, isPaymentCompleted } = useUserProgress();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }

    // Check if profile is complete
    if (user.gender === null) {
      router.replace('/app/settings/profile');
      return;
    }

    if (!isLoading) {
      if (!progress) {
        // No progress means starting fresh - go to shoot page
        router.replace('/app/shoot');
      } else if (isPaymentCompleted) {
        // After payment completion, always go to current stage
        router.replace(`/app/${progress.current_stage}`);
      } else {
        // Before payment, allow going back to shoot or payment
        const allowedStages = ['shoot', 'payment'];
        const currentStage = progress.current_stage;
        if (allowedStages.includes(currentStage)) {
          router.replace(`/app/${currentStage}`);
        } else {
          router.replace('/app/shoot');
        }
      }
    }
  }, [isLoading, progress, router, user, isPaymentCompleted]);

  // Show loading state while redirecting
  return (
    <div className="h-[50vh] flex items-center justify-center">
      <Loader size="lg" />
    </div>
  );
} 