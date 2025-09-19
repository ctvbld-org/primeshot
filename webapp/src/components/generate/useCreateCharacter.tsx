import React, { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionTiers, useCreditCosts, getCharacterTrainingCost, getCharacterLimit } from '@/hooks/usePricingConfig'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { CharacterTrainingDialog } from '@/components/character/CharacterTrainingDialog'
import { useCharactersApi } from '@/lib/api/characters'
import { useAuth } from '@/contexts/auth-context'

interface UseCreateCharacterProps {
  characters: any[]
  onSelectCharacter: (modelId: string) => void
  refreshCharacters: () => void
}

export function useCreateCharacter({ characters, onSelectCharacter, refreshCharacters }: UseCreateCharacterProps) {
  const { data: subscription } = useCurrentSubscription()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  const { data: creditCosts } = useCreditCosts()
  const { data: creditBalance } = useCreditBalance()
  const dialogService = useDialogService()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const queryClient = useQueryClient()
  const characterTrainingCost = getCharacterTrainingCost(creditCosts)
  const creditGuard = useCreditGuard(characterTrainingCost)
  const { getActiveCharacterCount } = useCharactersApi()
  const { user, isAuthenticated } = useAuth()

  const remainingCharacterTrainings = React.useMemo(() => {
    if (!subscription) return 0
    return Math.max(0, subscription.character_training_included - subscription.character_training_used)
  }, [subscription])

  const needsCreditsForTraining = React.useMemo(() => {
    if (!subscription) return true
    return remainingCharacterTrainings <= 0
  }, [subscription, remainingCharacterTrainings])

  const hasSufficientCredits = React.useMemo(() => {
    if (!needsCreditsForTraining) return true
    if (creditBalance === undefined) return false
    return creditBalance >= characterTrainingCost
  }, [needsCreditsForTraining, creditBalance, characterTrainingCost])

  const maxCharacters = React.useMemo(() => {
    if (!subscription || !subscriptionTiers) return 1
    return getCharacterLimit(subscription.plan_name, subscriptionTiers)
  }, [subscription, subscriptionTiers])

  const activeCharacterCount = React.useMemo(() => {
    return characters.filter((c: any) => c.status !== 'failed' && c.status !== 'deleted').length;
  }, [characters]);

  const hasReachedCharacterLimit = React.useMemo(() => {
    return activeCharacterCount >= maxCharacters;
  }, [activeCharacterCount, maxCharacters]);

  // Check if user is on the highest tier (Pro/Tier 3)
  const isOnHighestTier = useMemo(() => {
    if (!subscription?.plan_name || !subscriptionTiers) return false;
    const tier = subscriptionTiers.find(t => t.name === subscription.plan_name);
    // Pro tier has max_characters: 8, which is the highest
    return tier?.max_characters === 8;
  }, [subscription?.plan_name, subscriptionTiers]);

  // Determine what should happen when Create Character button is clicked
  const createCharacterAction = useMemo(() => {
    // If not authenticated, require sign in first
    if (!isAuthenticated) {
      return { type: 'auth', message: 'Create' }
    }
    // Require active subscription before any other gating (credits, limits)
    const hasActiveSubscription = !!subscription && subscription.status === 'active'
    if (!hasActiveSubscription) {
      return { type: 'subscription', message: 'Create' }
    }
    // Check character limits first
    if (hasReachedCharacterLimit) {
      if (isOnHighestTier) {
        return { type: 'limit_reached', message: 'Limit Reached' };
      } else {
        return { type: 'upgrade_subscription', message: 'Create'};
      }
    }
    
    // Check credits for paid training
    if (needsCreditsForTraining && !hasSufficientCredits) {
      // If user is on highest tier, they can only buy credits
      if (isOnHighestTier) {
        return { type: 'credit_pack', message: 'Create', credits: characterTrainingCost };
      } else {
        // If user can upgrade, show upgrade or buy credits option
        return { type: 'upgrade_or_credit_pack', message: 'Create', credits: characterTrainingCost };
      }
    }

    // All checks passed - allow creation
    return { type: 'create', message: 'Create' };
  }, [
    isAuthenticated,
    subscription,
    hasReachedCharacterLimit, 
    isOnHighestTier, 
    needsCreditsForTraining, 
    hasSufficientCredits, 
    characterTrainingCost
  ]);

   // Function to open face model upload dialog
   const openCharacterTrainingDialog = useCallback(() => {
    dialogService.openDialog(
        <CharacterTrainingDialog 
            wrapWithDialog={false} 
            onComplete={(id) => { 
                onSelectCharacter(id); 
                refreshCharacters() 
                // Invalidate subscription and credit queries to update training usage count and balance
                queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
                queryClient.invalidateQueries({ queryKey: ['creditBalance'] });
            }} 
        />
    )
  }, [dialogService, onSelectCharacter, refreshCharacters, queryClient]);

  // Handle Create Face Model button click with enhanced logic
  const handleCreateCharacterClick = useCallback(() => {
    switch (createCharacterAction.type) {
      case 'auth':
        // Use credit guard to handle authentication flow
        creditGuard(() => {
          // After authentication, the useMemo will recalculate and we'll get here again
          openCharacterTrainingDialog();
        })();
        break;
      
      case 'subscription':
        openSubscriptionDialog();
        break;
      
      case 'upgrade_subscription':
        // Use enhanced subscription dialog with character limit context
        openSubscriptionDialog({
          context: 'character-limit',
          currentPlan: subscription?.plan_name,
          showOnlyUpgrades: true,
          requiredFeature: 'max_characters'
        });
        break;
      
      case 'credit_pack':
        openCreditPackDialog(createCharacterAction.credits);
        break;
      
      case 'upgrade_or_credit_pack':
        openCreditPackDialog(createCharacterAction.credits);
        break;
      
      case 'limit_reached':
        // Do nothing - button should be disabled
        break;
      
      case 'create':
        // Final server-side limit check to avoid stale client list issues
        ;(async () => {
          try {
            const uid = user?.id
            if (uid && subscription?.plan_name && subscriptionTiers) {
              const latestCount = await getActiveCharacterCount(uid)
              const limit = getCharacterLimit(subscription.plan_name, subscriptionTiers)
              if (latestCount >= limit) {
                openSubscriptionDialog({
                  context: 'character-limit',
                  currentPlan: subscription.plan_name,
                  showOnlyUpgrades: true,
                  requiredFeature: 'max_characters'
                })
                return
              }
            }
          } catch {}
          openCharacterTrainingDialog()
        })()
        break;
    }
  }, [createCharacterAction, creditGuard, openCharacterTrainingDialog, openSubscriptionDialog, openCreditPackDialog, subscription?.plan_name, subscriptionTiers, getActiveCharacterCount, user?.id]);

  return {
    createCharacterAction,
    handleCreateCharacterClick,
    requiresCreditsForTraining: needsCreditsForTraining,
    trainingCost: characterTrainingCost,
    remainingIncludedTrainings: remainingCharacterTrainings,
    isOnHighestTier
  }
}
