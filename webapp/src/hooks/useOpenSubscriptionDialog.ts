import { createElement, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { SubscriptionDialogContent, type SubscriptionDialogContentProps } from '@/components/pricing/SubscriptionDialogContent'
import styles from '@/components/pricing/SubscriptionDialogContent.module.css'

// Options for opening the subscription dialog (matches component props)
export type SubscriptionDialogOptions = SubscriptionDialogContentProps

// Simple convenience hook to show the subscription / pricing dialog from any component
export function useOpenSubscriptionDialog() {
  const { openDialog } = useDialogService()
  const { t } = useTranslation('pricing')

  return useCallback((options?: SubscriptionDialogOptions) => {
    openDialog(
      createElement(SubscriptionDialogContent, {
        ...(options || {}),
        fullscreen: true,
        dialogContentClassName: styles.subscriptionPlansContent
      } as any),
      { title: t('upgradePlan.title'), description: t('upgradePlan.description') }
    )
  }, [openDialog, t])
} 