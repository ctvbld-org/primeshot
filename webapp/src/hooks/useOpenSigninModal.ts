import { createElement, useCallback } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { SignInForm } from '@primeshot/common/web/SignInForm'
import { useTranslation } from 'react-i18next'

// Hook to show the signin modal from any component
export function useOpenSigninModal() {
  const { openDialog } = useDialogService()
  const { t } = useTranslation('auth')
  
  return useCallback(() => {
    openDialog(createElement(SignInForm, {
      hideHeader: true
    } as any), { title: t('signin.title'), description: t('signin.description') })
  }, [openDialog])
} 
