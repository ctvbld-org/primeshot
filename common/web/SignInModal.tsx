"use client"

import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { SignInForm } from './SignInForm'
import { useTranslation } from 'react-i18next'
import styles from './SignInForm.module.css'

export function SignInModal() {
  const { t } = useTranslation('common')
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {t('buttons.signIn', { defaultValue: 'Sign in' })}
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.signinContent}>
        <SignInForm />
      </DialogContent>
    </Dialog>
  )
} 