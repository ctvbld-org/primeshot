"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './CreditsHeaderRight.module.css'
import { useAuth } from '@/contexts/auth-context'
import { SignInModal } from '@primeshot/common/web/SignInModal'
import { AccountDialog } from '@primeshot/common/web/AccountDialog'
import { Avatar } from '@primeshot/common/web/ui/avatar'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { ProgressCircle } from '@primeshot/common/web/ui/progress-circle'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { Icon } from '@primeshot/common/web/Icon'
import { useFavouriteCount } from '@/hooks/useFavouriteCount'

export function CreditsHeaderRight() {
  const { isAuthenticated, user } = useAuth()
  const { data: creditBalance } = useCreditBalance()
  const { data: subscription } = useCurrentSubscription()
  const { data: favouriteCount } = useFavouriteCount()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const pathname = usePathname()
  const onFavourites = (pathname || '').startsWith('/favourites')

  if (!isAuthenticated) {
    return <SignInModal />
  }

  const remaining = typeof creditBalance === 'number' ? creditBalance : 0
  const included = subscription?.credits_included ?? 0
  const percent = included > 0
    ? Math.max(0, Math.min(100, (remaining / included) * 100))
    : 0

  // Compute user initials for avatar fallback
  const initials = (
    user?.full_name && user.full_name.trim().length > 0
      ? user.full_name
          .trim()
          .split(/\s+/)
          .map((n) => n[0])
          .join('')
      : (user?.email?.[0] ?? '?')
  ).toUpperCase()

  return (
    <AccountDialog
      triggerSlot={
        <div className={styles.container}>
          {(favouriteCount ?? 0) > 0 && (
            <Link href="/favourites" className={`${styles.favLink} ${onFavourites ? styles.favLinkActive : ''}`} aria-label="Favourites">
              <Icon variant={onFavourites ? 'heart' : 'heartOutline'} size={16} />
            </Link>
          )}
          {subscription?.status === 'active' && (
            <span className={styles.text}>
              {remaining.toLocaleString()} credits remaining
            </span>
          )}
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarInset}>
              <Avatar
                src={user?.avatar_url ?? undefined}
                alt={user?.full_name || user?.email || 'avatar'}
                fallback={<span style={{ color: '#FFF', fontSize: 12, fontWeight: 600 }}>{initials}</span>}
                className={styles.avatar}
              />
            </div>
            <ProgressCircle percentage={percent} size={36} strokeWidth={1} trackColor="transparent" color="#2ADED8" />
          </div>
        </div>
      }
      onBuyCredits={() => openCreditPackDialog()}
      onSubscribe={() => openSubscriptionDialog()}
    />
  )
}

export default CreditsHeaderRight


