import { useMemo } from 'react';
import { useCurrentSubscription } from './useCurrentSubscription';

export interface CharacterTrainingStatus {
  /** Remaining included trainings (accounting for active training) */
  remainingTrainings: number;
  /** Whether all included trainings have been used */
  allTrainingsUsed: boolean;
  /** Formatted status message */
  statusMessage: string;
  /** Usage percentage (0-100) */
  usagePercentage: number;
  /** Base remaining from subscription (before accounting for active training) */
  baseRemaining: number;
}

export function useCharacterTrainingStatus(activeTrainingCount: number = 0): CharacterTrainingStatus {
  const { data: subscription } = useCurrentSubscription();

  return useMemo(() => {
    if (!subscription) {
      return {
        remainingTrainings: 0,
        allTrainingsUsed: true,
        statusMessage: "No subscription",
        usagePercentage: 100,
        baseRemaining: 0
      };
    }

    const included = subscription.character_training_included ?? 0;
    const used = subscription.character_training_used ?? 0;
    const baseRemaining = Math.max(0, included - used);
    const remainingTrainings = Math.max(0, baseRemaining - activeTrainingCount);
    const allTrainingsUsed = used >= included;
    const usagePercentage = included > 0 ? Math.min(100, (used / included) * 100) : 100;

    const statusMessage = allTrainingsUsed
      ? "You've used all your monthly included trainings"
      : `You've used ${used} out of your ${included} included monthly training${included !== 1 ? 's' : ''}`;

    return {
      remainingTrainings,
      allTrainingsUsed,
      statusMessage,
      usagePercentage,
      baseRemaining
    };
  }, [subscription, activeTrainingCount]);
}