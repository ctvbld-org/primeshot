"use client"

import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogBody } from './ui/dialog'
import { useAuth } from '../hooks/AuthContext'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import Image from 'next/image'
import { Button } from './ui/button'

interface AccountDialogProps {
  /** Optional custom trigger element. Must be a single element (use asChild). */
  triggerSlot?: React.ReactNode
}

export function AccountDialog({ triggerSlot }: AccountDialogProps) {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()

  if (!user) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerSlot ? (
          // Custom trigger provided by consumer
          triggerSlot as React.ReactElement
        ) : (
          <button className="h-8 w-8 rounded-full overflow-hidden border border-gray-200">
            <Image src={user.avatar_url ?? '/avatar-default.png'} alt="avatar" width={32} height={32} />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="w-72 p-0">
        <DialogHeader className="p-4">
          <DialogTitle>{t('account.title', { defaultValue: 'Account' })}</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-4 flex flex-col gap-4">
          <div className="text-sm">
            {user.email}
          </div>
          <LanguageSwitcher variant="popover" />
          <Button variant="ghost" onClick={() => signOut()}>
            {t('buttons.signOut', { defaultValue: 'Sign out' })}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
} 