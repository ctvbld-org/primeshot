"use client"

import React from 'react'
import styles from './CreditsHeaderRight.module.css'
import { useAuth } from '@/contexts/auth-context'
import { SignInModal } from '@primeshot/common/web/SignInModal'
import { AccountDialog } from '@primeshot/common/web/AccountDialog'
import { Avatar } from '@primeshot/common/web/ui/avatar'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { ProgressCircle } from '@primeshot/common/web/ui/progress-circle'

export function CreditsHeaderRight() {
  const { isAuthenticated, user } = useAuth()
  const { data: creditBalance } = useCreditBalance()
  const { data: subscription } = useCurrentSubscription()

  if (!isAuthenticated) {
    return <SignInModal />
  }

  const remaining = typeof creditBalance === 'number' ? creditBalance : 0
  const included = subscription?.credits_included ?? 0
  const percent = included > 0
    ? Math.max(0, Math.min(100, (remaining / included) * 100))
    : 0

  return (
    <AccountDialog
      triggerSlot={
        <div className={styles.container}>
            {subscription?.status === 'active' && (
              <span className={styles.text}>
                {remaining.toLocaleString()} credits remaining
              </span>
            )}
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarInset}>
              <Avatar src={user?.avatar_url ?? undefined} alt={user?.email ?? 'avatar'} className={styles.avatar} />
            </div>
            <ProgressCircle percentage={percent} size={36} strokeWidth={1} trackColor="transparent" color="#2ADED8" />
          </div>
        </div>
      }
    />
  )
}

export default CreditsHeaderRight


