import { createElement, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { CreditPackDialogContent } from '@/components/pricing/CreditPackDialogContent'
import styles from '@/components/pricing/SubscriptionDialogContent.module.css'

// Hook to show the credit pack dialog from any component
export function useOpenCreditPackDialog() {
  const { openDialog } = useDialogService()
  const { t } = useTranslation('pricing')

  return useCallback((requiredCredits?: number) => {
    openDialog(
      createElement(CreditPackDialogContent, { 
        requiredCredits, 
        fullscreen: true,
        dialogContentClassName: styles.subscriptionPlansContent
      }),
      { title: t('buyCredits.title'), description: t('buyCredits.description') }
    )
  }, [openDialog, t])
} 