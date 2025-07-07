import { createElement, useCallback } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { SignInForm } from '@primeshot/common/web/SignInForm'

// Hook to show the signin modal from any component
export function useOpenSigninModal() {
  const { openDialog } = useDialogService()

  return useCallback(() => {
    openDialog(createElement(SignInForm))
  }, [openDialog])
} 