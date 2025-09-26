"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  /** Optional handler to open credit purchase dialog from host app */
  onBuyCredits?: () => void
  /** Optional handler to open subscription dialog from host app */
  onSubscribe?: () => void
}

type TabKey = 'profile' | 'subscription' | 'settings2' | 'help'

type SubscriptionInfo = {
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  cancel_at_period_end?: boolean
  stripe_subscription_id?: string
  plan_image_url?: string | null
}

function getApiUrl(path: string): string {
  console.log('[AccountDialog getApiUrl] Called with path:', path)
  if (/^https?:\/\//.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  
  // Next.js basePath handling for client-side calls
  try {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      
      // Check for language prefixes first
      const langPrefixMatch = currentPath.match(/^\/(\w{2})\//)
      if (langPrefixMatch) {
        // Language prefix detected - construct absolute URL to bypass language routing
        const origin = window.location.origin
        
        // Use environment variable for base path, same as other implementations
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH
        
        console.log('[AccountDialog getApiUrl] DEBUG:', {
          currentPath,
          origin,
          basePath,
          normalized,
          env: process.env.NEXT_PUBLIC_BASE_PATH,
          langPrefixMatch: langPrefixMatch[1],
          finalUrl: `${origin}${basePath || ''}${normalized}`
        })
        
        return `${origin}${basePath || ''}${normalized}`
      }
      
      // Handle /create basePath (no language prefix)
      if (currentPath.startsWith('/create')) {
        return `/create${normalized}`
      }
    }
  } catch {}
  return normalized
}

export function AccountDialog({ triggerSlot, onBuyCredits, onSubscribe }: AccountDialogProps) {
  const { user, signOut } = useAuth()
  const { t } = useTranslation('account')
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [open, setOpen] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!user || !open) return
      
      setIsLoading(true)
      try {
        const [subRes, balRes] = await Promise.all([
          fetch(getApiUrl('api/subscription/current')),
          fetch(getApiUrl('api/credits/balance')),
        ])
        
        if (subRes.ok) {
          const sub = await subRes.json()
          setSubscription(sub)
        }
        
        if (balRes.ok) {
          const { balance } = await balRes.json()
          setCreditBalance(balance)
        }
      } catch (error) {
        console.error('Failed to load subscription data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSubscriptionData()
  }, [open, user])

  if (!user) return null

  const [firstName, lastName] = useMemo(() => {
    const full = user.full_name || ''
    if (!full) return ['', '']
    const parts = full.trim().split(/\s+/)
    return [parts[0] || '', parts.slice(1).join(' ')]
  }, [user.full_name])

  const providerVariant = useMemo(() => {
    const raw = (user as any)?.identities?.[0]?.provider || (user as any)?.app_metadata?.provider
    const p = String(raw || '').toLowerCase()
    if (p.includes('google')) return 'google' as const
    if (p.includes('linkedin')) return 'linkedin' as const
    if (p.includes('apple')) return 'apple' as const
    if (p.includes('azure') || p.includes('microsoft')) return 'microsoft' as const
    return undefined
  }, [user])

  // Edit state
  const [editFirstName, setEditFirstName] = useState<string>('')
  const [editLastName, setEditLastName] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setEditFirstName(firstName)
    setEditLastName(lastName)
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setIsDirty(false)
  }, [open, firstName, lastName])

  const handleCancel = () => {
    setEditFirstName(firstName)
    setEditLastName(lastName)
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setIsDirty(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      let avatarUrl: string | undefined
      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const up = await fetch(getApiUrl('api/account/avatar'), { method: 'POST', body: fd })
        if (!up.ok) throw new Error('Failed to upload avatar')
        const { key } = await up.json()
        // Store only the S3 key in DB (e.g., user-images/<id>/avatar.webp)
        avatarUrl = key
      }

      const res = await fetch(getApiUrl('api/account/profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName, avatarUrl })
      })
      if (!res.ok) throw new Error('Failed to update profile')

      // Optimistically update local UI
      setIsDirty(false)
      setAvatarFile(null)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)

      // Ask global auth context to refresh merged user data
      try {
        // optional chaining in case older context version lacks method
        ;(useAuth() as any)?.refreshUser?.()
      } catch {}
    } catch (e) {
      console.error(e)
      alert(t('errors.failedToSave'))
    } finally {
      setIsSaving(false)
    }
  }

  const openPortal = async (flow?: 'cancel') => {
    setIsActionLoading(true)
    try {
      const url = flow === 'cancel' 
        ? `api/subscription/customer-portal?flow=cancel&subscriptionId=${subscription?.stripe_subscription_id || ''}`
        : 'api/subscription/customer-portal'
        
      const res = await fetch(getApiUrl(url), { method: 'POST' })
      
      if (!res.ok) throw new Error('Failed to open customer portal')
      
      const { url: portalUrl } = await res.json()
      
      if (flow === 'cancel') {
        window.location.href = portalUrl
      } else {
        window.open(portalUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const isCanceled = subscription?.status === 'canceled' || subscription?.cancel_at_period_end === true
  const isFullyCanceled = subscription?.status === 'canceled'
  const periodEndText = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : undefined

  const sidebarItems: { key: TabKey; label: string }[] = [
    { key: 'profile', label: t('navigation.profile') },
    { key: 'subscription', label: t('navigation.subscription') },
    { key: 'settings2', label: t('navigation.settings') },
    { key: 'help', label: t('navigation.support') },
  ]

  const Trigger = triggerSlot ? (
    triggerSlot as React.ReactElement
  ) : (
    <button className={styles.avatarButton}>
      <Avatar
        className={styles.avatar}
        src={user.avatar_url ?? undefined}
        alt={user.email ?? t('accessibility.avatar')}
        fallback={(user.email || '?').slice(0, 1).toUpperCase()}
      />
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent className={styles.dialogRoot}>
        <DialogHeader className={styles.headerBar} hideClose={isDirty}>
          <div className={styles.headerCol}>
            {isDirty && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                className={styles.headerButton}
              >
                {t('buttons.cancel')}
              </Button>
            )}
          </div>
          <DialogTitle className={styles.headerCol + ' ' + styles.headerTitle}>{t('dialog.title')}</DialogTitle>
          <div className={styles.headerCol}>
            {isDirty && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className={styles.headerButton}
              >
                {isSaving ? t('buttons.saving') : t('buttons.save')}
              </Button>
            )}
          </div>
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
                    <span className={styles.navIcon}><Icon variant={item.key} size={18} /></span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <select
                className={styles.mobileSelect}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabKey)}
                aria-label={t('dialog.selectSection')}
              >
                {sidebarItems.map(item => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
              <div className={styles.sidebarFooter}>
                <Button variant="ghost" className={styles.signOut} onClick={() => signOut()}>
                  <Icon variant="logout" size={18} />
                  {t('buttons.signOut')}
                </Button>
              </div>
            </aside>

            <main className={styles.content}>
              {activeTab === 'profile' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.title}>{t('profile.title')}</h2>
                    <div style={{ position: 'relative' }}>
                      <Avatar
                        className={styles.profileAvatar}
                        src={(avatarPreview ?? user.avatar_url) ?? undefined}
                        alt={user.email ?? t('accessibility.avatar')}
                        fallback={(user.email || '?').slice(0, 1).toUpperCase()}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setAvatarFile(file)
                        const url = URL.createObjectURL(file)
                        setAvatarPreview(url)
                        setIsDirty(true)
                      }}
                    />
                  </div>

                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>{t('profile.firstName')}</span>
                    <input
                      className={styles.kvValue}
                      value={editFirstName}
                      onChange={(e) => { setEditFirstName(e.target.value); setIsDirty(true) }}
                    />
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>{t('profile.lastName')}</span>
                    <input
                      className={styles.kvValue}
                      value={editLastName}
                      onChange={(e) => { setEditLastName(e.target.value); setIsDirty(true) }}
                    />
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>{t('profile.email')}</span>
                    <span className={styles.kvValue}>
                      {user.email}
                      {providerVariant && (
                        <span className={styles.providerBadge} aria-label={providerVariant} title={providerVariant}>
                          <Icon variant={providerVariant} size={11} />
                        </span>
                      )}
                    </span>
                  </div>
                </section>
              )}

              {activeTab === 'subscription' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>{t('subscription.title')}</h2>

                  <div className={styles.planRow}>
                    <div className={styles.planLeft}>
                      <span className={styles.planDot}>
                        {subscription?.plan_image_url && (
                          <img src={subscription.plan_image_url} alt={t('accessibility.plan')} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                      </span>
                      <div className={styles.planTexts}>
                        <div className={styles.planName}>
                          {isLoading ? t('subscription.loading') : subscription ? `${subscription.plan_name}${t('subscription.planSuffix')}` : t('subscription.noPlan')}
                        </div>
                        {!isLoading && subscription && (
                          isCanceled ? (
                            <div className={styles.planSub}>
                              <span style={{ color: '#ff5e57', marginRight: 8 }}>{t('subscription.cancelled')}</span>
                              {!isFullyCanceled && periodEndText && <span>{t('subscription.expires', { date: periodEndText })}</span>}
                            </div>
                          ) : (
                            <div className={styles.planSub}>
                              {t('subscription.renews', { date: periodEndText })}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className={styles.planActions}>
                      {!isLoading && (
                        <>
                          {!subscription ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={onSubscribe ?? (() => openPortal())}
                            >
                              {t('buttons.subscribe')}
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openPortal()}
                                disabled={isActionLoading}
                              >
                                {isActionLoading ? t('buttons.opening') : t('buttons.manage')}
                              </Button>
                              {isCanceled ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openPortal()}
                                  disabled={isActionLoading}
                                >
                                  {t('buttons.renew')}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openPortal('cancel')}
                                  disabled={isActionLoading}
                                >
                                  {t('buttons.cancel')}
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Only show credit balance section when user has a subscription */}
                  {subscription && (
                    <div className={styles.creditsBlock}>
                      <div className={styles.creditsHeader}>
                        <span>{t('subscription.creditBalance')}</span>
                        <Button variant="ghost" size="sm" className={styles.buyCredits} onClick={onBuyCredits ?? (() => openPortal())}>
                          {t('buttons.buyCredits')}
                        </Button>
                      </div>
                      <div className={styles.creditsValue}>
                        {isLoading ? '—' : creditBalance ?? 0}
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
                          {t('subscription.resets', { date: new Date(subscription.current_period_end).toLocaleDateString() })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'settings2' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>{t('settings.title')}</h2>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>{t('settings.language')}</span>
                    <div className={styles.kvValue}>
                      <LanguageSwitcher variant="popover" className={styles.languageSwitcher} endIcon={<Icon variant="chevronDown" size={18} />} />
                    </div>
                  </div>

                  <div className={styles.deleteBlock}>
                    <div className={styles.deleteTexts}>
                      <div className={styles.deleteTitle}>{t('settings.deleteAccount.title')}</div>
                      <div className={styles.deleteSub}>
                        {t('settings.deleteAccount.description')}
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" disabled>
                      {t('buttons.deleteAccount')}
                    </Button>
                  </div>
                </section>
              )}

              {activeTab === 'help' && (
                <section className={styles.section}>
                  <h2 className={styles.title}>{t('support.title')}</h2>
                  <p className={styles.description}>{t('support.description')}</p>
                  <div className={styles.supportList}>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>{t('support.faq')}</div>
                      <p className={styles.supportDescription}>
                        {t('support.faqDescription', { 
                          helpCenter: <a className={styles.supportLink} href="https://help.primeshot.ai" target="_blank" rel="noreferrer">{t('support.helpCenter')}</a>
                        })}
                      </p>
                    </div>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>
                        <Icon variant="x" size={18} />
                        {t('support.dmUs')}
                      </div>
                      <a className={styles.supportLink} href="https://x.com/primeshotai" target="_blank" rel="noreferrer">
                        @primeshotai
                      </a>
                    </div>
                    <div className={styles.supportItem}>
                      <div className={styles.supportLabel}>
                        <Icon variant="email" size={18} />
                        {t('support.emailUs')}
                      </div>
                      <a className={styles.supportLink} href="mailto:support@primeshot.ai">support@primeshot.ai</a>
                    </div>
                  </div>
                </section>
              )}
            </main>
            <div className={styles.dialogFooter}>
              <Button variant="ghost" className={styles.signOut} onClick={() => signOut()}>
                <Icon variant="logout" size={18} />
                {t('buttons.signOut')}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}