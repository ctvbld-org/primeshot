import React, { useCallback, useMemo, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionTiers, useCreditCosts, getCharacterTrainingCost, getCharacterLimit } from '@/hooks/usePricingConfig'
import type { SubscriptionTier } from '@primeshot/common/lib/pricing/types'
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
  const charactersApiLocal = useCharactersApi() as any
  const getActiveCharacterCount = charactersApiLocal.getActiveCharacterCount as (userId: string) => Promise<number>
  const { user, isAuthenticated } = useAuth()
  const isAdmin = !!user?.admin

  // Use real database count instead of stale client array
  const [dbCharacterCount, setDbCharacterCount] = useState<number>(0)
  const [isLoadingCount, setIsLoadingCount] = useState(false)

  // Fetch real character count from database
  useEffect(() => {
    if (!user?.id || isAdmin) return

    let isCancelled = false
    setIsLoadingCount(true)

    getActiveCharacterCount(user.id)
      .then(count => {
        if (!isCancelled) {
          setDbCharacterCount(count)
        }
      })
      .catch(err => {
        console.error('Failed to fetch character count:', err)
        // Fallback to client-side count on error
        if (!isCancelled) {
          setDbCharacterCount(characters.filter((c: any) => c.status !== 'failed' && c.status !== 'deleted').length)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingCount(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [user?.id, characters.length, getActiveCharacterCount, isAdmin, characters])

  const remainingCharacterTrainings = React.useMemo(() => {
    if (!subscription) return 0
    return Math.max(0, (subscription as any).character_training_included - (subscription as any).character_training_used)
  }, [subscription])

  const needsCreditsForTraining = React.useMemo(() => {
    if (!subscription) return true
    return remainingCharacterTrainings <= 0
  }, [subscription, remainingCharacterTrainings])

  const hasSufficientCredits = React.useMemo(() => {
    if (!needsCreditsForTraining) return true
    if (creditBalance === undefined) return false
    return (creditBalance as any) >= characterTrainingCost
  }, [needsCreditsForTraining, creditBalance, characterTrainingCost])

  const maxCharacters = React.useMemo(() => {
    if (!subscription) return 1
    // Prefer API-provided limit; fallback to tier lookup for safety
    if (typeof (subscription as any).max_characters === 'number') {
      return (subscription as any).max_characters as number
    }
    if (!subscriptionTiers) return 1
    return (getCharacterLimit as any)((subscription as any).plan_name, subscriptionTiers)
  }, [subscription, subscriptionTiers])

  // Use database count instead of client array count
  const activeCharacterCount = dbCharacterCount

  const hasReachedCharacterLimit = React.useMemo(() => {
    if (isAdmin) return false
    // Use the database count for accurate limit checking
    return activeCharacterCount >= maxCharacters;
  }, [activeCharacterCount, maxCharacters, isAdmin]);

  // Check if user is on the highest tier (Pro/Tier 3)
  const isOnHighestTier = useMemo(() => {
    // Determine highest based on max_characters across tiers
    const maxAcrossTiers = (subscriptionTiers as SubscriptionTier[] | undefined)?.reduce((m, t) => Math.max(m, t.max_characters || 0), 0) || 0
    return maxCharacters >= maxAcrossTiers && maxAcrossTiers > 0
  }, [subscriptionTiers, maxCharacters]);

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

    // Admins bypass character limit. Credits rules still apply below.
    if (isAdmin) {
      if (needsCreditsForTraining && !hasSufficientCredits) {
        // Allow admins to buy credits if needed
        return { type: isOnHighestTier ? 'credit_pack' : 'upgrade_or_credit_pack', message: 'Create', credits: characterTrainingCost }
      }
      return { type: 'create', message: 'Create' }
    }
    
    // Check character storage limits FIRST (before credits)
    // This ensures users can't bypass storage limits even if they have training credits
    if (hasReachedCharacterLimit && !isAdmin) {
      if (isOnHighestTier) {
        return { type: 'limit_reached', message: 'Limit Reached' };
      } else {
        return { type: 'upgrade_subscription', message: 'Create'};
      }
    }
    
    // Check credits for paid training (only after storage check passes)
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
    characterTrainingCost,
    isAdmin
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
        // User is not on highest tier, show upgrade dialog
        openSubscriptionDialog({
          context: 'credit-upgrade',
          currentPlan: subscription?.plan_name,
          showOnlyUpgrades: true
        });
        break;
      
      case 'limit_reached':
        // Do nothing - button should be disabled
        break;
      
      case 'create':
        if (isAdmin) {
          openCharacterTrainingDialog()
          break;
        }
        // Final server-side limit check to avoid stale client list issues
        ;(async () => {
          try {
            const uid = user?.id
            if (uid && subscription?.plan_name) {
              const latestCount = await getActiveCharacterCount(uid)
              const limit = maxCharacters
              if (latestCount >= limit) {
                console.warn(`Character limit reached: ${latestCount}/${limit}`)
                openSubscriptionDialog({
                  context: 'character-limit',
                  currentPlan: subscription.plan_name,
                  showOnlyUpgrades: true,
                  requiredFeature: 'max_characters'
                })
                return
              }
            }
          } catch (error) {
            console.error('Error checking character limit:', error)
            // Don't open dialog on error - fail safely by blocking creation
            return
          }
          openCharacterTrainingDialog()
        })()
        break;
    }
  }, [createCharacterAction, creditGuard, openCharacterTrainingDialog, openSubscriptionDialog, openCreditPackDialog, subscription?.plan_name, subscriptionTiers, getActiveCharacterCount, user?.id, isAdmin]);

  return {
    createCharacterAction,
    handleCreateCharacterClick,
    requiresCreditsForTraining: needsCreditsForTraining,
    trainingCost: characterTrainingCost,
    remainingIncludedTrainings: remainingCharacterTrainings,
    isOnHighestTier
  }
}
