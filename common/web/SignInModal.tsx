"use client"

import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { SignInForm } from './SignInForm'
import { useTranslation } from 'react-i18next'

export function SignInModal() {
  const { t } = useTranslation()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t('buttons.signIn', { defaultValue: 'Sign in' })}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-transparent border-none p-0 max-w-none">
        <SignInForm />
      </DialogContent>
    </Dialog>
  )
} 