'use client'

import { useAuth } from '@/contexts/auth-context';
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from '@/components/ui/loader';

export default function AppRoot() {
  const { user } = useAuth();
  const { progress, isLoading } = useUserProgress();
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
      } else if (!progress.completed_stages.includes('payment')) {
        // If payment not completed, go to current stage
        router.replace(`/app/${progress.current_stage}`);
      } else {
        // If payment completed, go to shoots page
        router.replace('/app/shoots');
      }
    }
  }, [isLoading, progress, router, user]);

  // Show loading state while redirecting
  return (
    <div className="h-[50vh] flex items-center justify-center">
      <Loader size="lg" text="Redirecting to your workspace..." />
    </div>
  );
} 