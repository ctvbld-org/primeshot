import { createElement, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { CreditPackDialogContent } from '@/components/pricing/CreditPackDialogContent'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import styles from '@/components/pricing/SubscriptionDialogContent.module.css'
import { toast } from 'sonner'

// Hook to show the credit pack dialog from any component
// Only allows paid subscription users to access credit packs
export function useOpenCreditPackDialog() {
  const { openDialog } = useDialogService()
  const { t } = useTranslation('pricing')
  const { data: currentSubscription } = useCurrentSubscription()

  return useCallback((requiredCredits?: number) => {
    // Check if user has a paid subscription (not Free plan)
    const isFreePlan = currentSubscription?.plan_name === 'free'

    if (isFreePlan || !currentSubscription) {
      toast.error(t('credits.errors.paidSubscriptionRequired', { 
        defaultValue: 'Credit packs are only available for paid subscription members. Please subscribe to a plan first.' 
      }))
      return
    }

    openDialog(
      createElement(CreditPackDialogContent, { 
        requiredCredits, 
        fullscreen: true,
        dialogContentClassName: styles.subscriptionPlansContent
      }),
      { title: t('buyCredits.title'), description: t('buyCredits.description') }
    )
  }, [openDialog, t, currentSubscription])
} 