import { createElement, useCallback } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { SubscriptionDialogContent, type SubscriptionDialogContentProps } from '@/components/pricing/SubscriptionDialogContent'

// Options for opening the subscription dialog (matches component props)
export type SubscriptionDialogOptions = SubscriptionDialogContentProps

// Simple convenience hook to show the subscription / pricing dialog from any component
export function useOpenSubscriptionDialog() {
  const { openDialog } = useDialogService()

  return useCallback((options?: SubscriptionDialogOptions) => {
    openDialog(createElement(SubscriptionDialogContent, options || {}))
  }, [openDialog])
} 