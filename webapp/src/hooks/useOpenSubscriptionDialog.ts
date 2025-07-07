import { createElement, useCallback } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { SubscriptionDialogContent } from '@/components/pricing/SubscriptionDialogContent'

// Simple convenience hook to show the subscription / pricing dialog from any component
export function useOpenSubscriptionDialog() {
  const { openDialog } = useDialogService()

  return useCallback(() => {
    openDialog(createElement(SubscriptionDialogContent))
  }, [openDialog])
} 