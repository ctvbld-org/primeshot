"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogBody } from './ui/dialog'
import { useAuth } from '../hooks/AuthContext'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/button'
import { Avatar } from './ui/avatar'
import { Icon } from './Icon'
import styles from './AccountDialog.module.css'

interface AccountDialogProps {
  /** Optional custom trigger element. Must be a single element (use asChild). */
  triggerSlot?: React.ReactNode
}

type TabKey = 'profile' | 'subscription' | 'settings' | 'support'

type SubscriptionInfo = {
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
}

function getApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  // Next.js basePath handling for client-side calls (see memory rule)
  try {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/create')) {
      return `/create${normalized}`
    }
  } catch {}
  return normalized
}

export function AccountDialog({ triggerSlot }: AccountDialogProps) {
  const { user, signOut } = useAuth()
  const { t } = useTranslation('account')
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [open, setOpen] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isSubLoading, setIsSubLoading] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user || !open) return
      setIsSubLoading(true)
      try {
        const [subRes, balRes, portalRes] = await Promise.all([
          fetch(getApiUrl('api/subscription/current')),
          fetch(getApiUrl('api/credits/balance')),
          fetch(getApiUrl('api/subscription/customer-portal'), { method: 'POST' }),
        ])
        if (subRes.ok) setSubscription(await subRes.json())
        if (balRes.ok) {
          const { balance } = await balRes.json()
          setCreditBalance(balance)
        }
        if (portalRes.ok) {
          const { url } = await portalRes.json()
          setPortalUrl(url)
        } else {
          setPortalUrl(null)
        }
      } finally {
        setIsSubLoading(false)
      }
    }
    load()
  }, [open, user])

  if (!user) return null

  const [firstName, lastName] = useMemo(() => {
    const full = user.full_name || ''
    if (!full) return ['', '']
    const parts = full.trim().split(/\s+/)
    return [parts[0] || '', parts.slice(1).join(' ')]
  }, [user.full_name])

  const handleOpenPortal = async () => {
    try {
      setIsPortalLoading(true)
      if (!portalUrl) {
        // Fallback: fetch once if not available
        const res = await fetch(getApiUrl('api/subscription/customer-portal'), { method: 'POST' })
        if (res.ok) {
          const { url } = await res.json()
          setPortalUrl(url)
          window.open(url, '_blank', 'noopener,noreferrer')
          return
        }
      }
      if (portalUrl) window.open(portalUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsPortalLoading(false)
    }
  }

  const sidebarItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <Icon variant="smilyFace" size={18} /> },
    { key: 'subscription', label: 'Subscription', icon: <Icon variant="basket" size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Icon variant="idea" size={18} /> },
    { key: 'support', label: 'Support', icon: <Icon variant="insights" size={18} /> },
  ]

  const Trigger = triggerSlot ? (
    triggerSlot as React.ReactElement
  ) : (
    <button className={styles.avatarButton}>
      <Avatar
        className={styles.avatar}
        src={user.avatar_url ?? undefined}
        alt={user.email ?? 'avatar'}
        fallback={(user.email || '?').slice(0, 1).toUpperCase()}
      />
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent className={styles.dialogRoot}>
        <DialogHeader className={styles.headerBar}>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        <DialogBody className={styles.bodyRoot}>
          <div className={styles.container}>
            <aside className={styles.sidebar}>
              <nav className={styles.nav}>
                {sidebarItems.map(item => (
                  <button
                    key={item.key}
                    className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className={styles.sidebarFooter}>
                <Button variant="ghost" className={styles.signOut} onClick={() => signOut()}>
                  Sign out
                </Button>
              </div>
            </aside>

            <main className={styles.content}>
              {activeTab === 'profile' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.title}>Profile</h2>
                    <Avatar
                      className={styles.profileAvatar}
                      src={user.avatar_url ?? undefined}
                      alt={user.email ?? 'avatar'}
                      fallback={(user.email || '?').slice(0, 1).toUpperCase()}
                    />
                  </div>

                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>First name</span>
                    <span className={styles.kvValue}>{firstName || '—'}</span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Last name</span>
                    <span className={styles.kvValue}>{lastName || '—'}</span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Email</span>
                    <span className={styles.kvValue}>
                      {user.email}
                      <span className={styles.providerBadge}>G</span>
                    </span>
                  </div>
                </section>
              )}

              {activeTab === 'subscription' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>Subscription</h2>

                  <div className={styles.planRow}>
                    <div className={styles.planLeft}>
                      <span className={styles.planDot} />
                      <div className={styles.planTexts}>
                        <div className={styles.planName}>{subscription?.plan_name ?? 'No plan'}</div>
                        {subscription?.current_period_end && (
                          <div className={styles.planSub}>
                            Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.planActions}>
                      <Button size="sm" variant="secondary" onClick={handleOpenPortal} disabled={isPortalLoading}>
                        {isPortalLoading ? 'Opening…' : 'Manage'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleOpenPortal} disabled={isPortalLoading}>
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className={styles.creditsBlock}>
                    <div className={styles.creditsHeader}>
                      <span>Credit Balance</span>
                      <button className={styles.buyCredits} onClick={handleOpenPortal}>Buy credits</button>
                    </div>
                    <div className={styles.creditsValue}>
                      {isSubLoading ? '—' : creditBalance ?? 0}
                      <span className={styles.creditsTotal}>
                        /{subscription?.credits_included ?? 0}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.max(0, Math.min(100, ((creditBalance ?? 0) / (subscription?.credits_included || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    {subscription?.current_period_end && (
                      <div className={styles.creditsReset}>
                        Resets {new Date(subscription.current_period_end).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'settings' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>Settings</h2>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Language</span>
                    <div className={styles.kvValue}>
                      <LanguageSwitcher variant="popover" />
                    </div>
                  </div>

                  <div className={styles.deleteBlock}>
                    <div className={styles.deleteTexts}>
                      <div className={styles.deleteTitle}>Delete account?</div>
                      <div className={styles.deleteSub}>
                        This will erase all your data, settings, and history. This action cannot be undone.
                      </div>
                    </div>
                    <Button variant="destructive" disabled>
                      Delete Account (coming soon)
                    </Button>
                  </div>
                </section>
              )}

              {activeTab === 'support' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>We’re here to help</h2>
                  <div className={styles.supportList}>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>FAQ’s</div>
                      <a className={styles.supportLink} href="https://help.primeshot.ai" target="_blank" rel="noreferrer">
                        Check out our Help Center
                      </a>
                    </div>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>DM us</div>
                      <a className={styles.supportLink} href="https://x.com/primeshotai" target="_blank" rel="noreferrer">
                        @primeshotai
                      </a>
                    </div>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>Email us</div>
                      <a className={styles.supportLink} href="mailto:support@primeshot.ai">support@primeshot.ai</a>
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}