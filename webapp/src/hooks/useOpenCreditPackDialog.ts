import { createElement, useCallback } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { CreditPackDialogContent } from '@/components/pricing/CreditPackDialogContent'

// Hook to show the credit pack dialog from any component
export function useOpenCreditPackDialog() {
  const { openDialog } = useDialogService()

  return useCallback((requiredCredits?: number) => {
    openDialog(createElement(CreditPackDialogContent, { requiredCredits }))
  }, [openDialog])
} 