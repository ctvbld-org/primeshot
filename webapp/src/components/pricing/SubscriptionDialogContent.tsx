import { useState, useMemo } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip'
import { SegmentedControl } from '@primeshot/common/web/ui/segmented-control'
import { useSubscriptionTiers, type SubscriptionTier } from '@/hooks/usePricingConfig'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { STRIPE_REFERENCE } from '@primeshot/common/lib/stripe/stripe-reference'
import { getStripeEnv } from '@primeshot/common/lib/stripe/env'
import { toast } from 'sonner'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { getApiUrl } from '@/lib/api/client'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './SubscriptionDialogContent.module.css'
import { useInferenceSettings } from '@/hooks/useInferenceSettings'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { useTranslation } from 'react-i18next'

// Context types for different upgrade scenarios
export type SubscriptionDialogContext = 
  | 'character-limit' 
  | 'quality-upgrade' 
  | 'credit-upgrade' 
  | 'general'

export interface SubscriptionDialogContentProps {
  context?: SubscriptionDialogContext
  currentPlan?: string
  showOnlyUpgrades?: boolean
  requiredFeature?: 'max_characters' | 'max_quality' | 'credits'
}

function formatPrice(price: number) { 
  return `$${price.toFixed(2)}` 
}

// Get environment for Stripe reference
const getEnvironment = getStripeEnv

// Get Stripe price ID for a subscription tier
function getStripePriceId(tierName: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const env = getEnvironment()
  const stripeConfig = STRIPE_REFERENCE[env]

  console.log('ENV FOR STRIPE PRICE ID', env)
  
  const tierConfig = stripeConfig.subscriptions[tierName as keyof typeof stripeConfig.subscriptions]
  if (!tierConfig) return null
  
  return billingCycle === 'yearly' ? tierConfig.yearly || tierConfig.monthly : tierConfig.monthly
}

// (All context-specific UI copy is sourced from pricing.json via i18n)

export function SubscriptionDialogContent({
  context,
  currentPlan,
  showOnlyUpgrades = false,
  requiredFeature
}: SubscriptionDialogContentProps = {}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { closeDialog } = useDialogService()
  const { data: subscriptionTiers, isLoading: tiersLoading } = useSubscriptionTiers()
  const { data: currentSubscription } = useCurrentSubscription()
  const { data: inferenceSettings } = useInferenceSettings()
  const isSpecialOffer = true // TODO: Remove this when special offer is over
  const { t } = useTranslation('pricing')
  const tp = (k: string, o?: any) => String((t as any)(k, o))

  // Determine current plan from props or subscription data
  // Only consider it a current plan if the subscription is active or pending cancellation
  const hasActivePlan = currentSubscription && 
    (currentSubscription.status === 'active' || (currentSubscription as any).cancel_at_period_end === true)
  // Use canonical key for comparisons; use display name for UI
  const effectiveCurrentPlan = currentPlan || (hasActivePlan ? currentSubscription?.plan_name : null)

  // Filter tiers based on upgrade requirements
  const filteredTiers = useMemo(() => {
    if (!subscriptionTiers) return []

    // When showing upgrades for an existing subscriber, include the current plan
    // card as well (button will be disabled) and then all higher tiers.
    if (showOnlyUpgrades && effectiveCurrentPlan) {
      const currentTier = subscriptionTiers.find(t => t.name === effectiveCurrentPlan)
      if (!currentTier) return subscriptionTiers
      // Consider an upgrade if its price for the current cycle is higher
      const currentPriceMonthly = currentTier.monthly_price
      const currentPriceYearly = currentTier.yearly_price
      const upgradeTiers = subscriptionTiers.filter(tier =>
        tier.monthly_price > currentPriceMonthly || tier.yearly_price > currentPriceYearly
      )
      return currentTier ? [currentTier, ...upgradeTiers] : upgradeTiers
    }

    return subscriptionTiers
  }, [subscriptionTiers, showOnlyUpgrades, effectiveCurrentPlan])

  // Set default selected tier (first available tier or recommended)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)

  // Update selected tier when filtered tiers change
  useMemo(() => {
    if (filteredTiers.length > 0 && !selectedTier) {
      // For upgrades, prefer the first actual upgrade (skip current plan if present)
      // For new users, select the recommended tier or standard
      const defaultTier = showOnlyUpgrades 
        ? (filteredTiers.find(t => t.name !== effectiveCurrentPlan) || filteredTiers[0])
        : filteredTiers.find(t => t.popular) || filteredTiers[0]

      setSelectedTier(defaultTier)
    }
  }, [filteredTiers, selectedTier, showOnlyUpgrades, effectiveCurrentPlan])

  const handlePurchase = async (passedTier?: SubscriptionTier | null) => {
    if (!user) {
      toast.error(tp('subscription.toasts.loginRequired'))
      return
    }
    
    const tierToPurchase = passedTier ?? selectedTier

    if (!tierToPurchase) {
      toast.error(tp('subscription.toasts.selectPlan'))
      return
    }

    // Get Stripe price ID based on tier name and billing cycle
    const priceId = getStripePriceId(tierToPurchase.name, billingCycle)
    
    if (!priceId) {
      toast.error(tp('subscription.toasts.invalidPlan'))
      return
    }

    // If this is an upgrade (user has current subscription), show confirmation dialog
    if (showOnlyUpgrades && currentSubscription) {
      await handleUpgradePreview(priceId)
    } else {
      await handleDirectPurchase(priceId)
    }
  }

  const handleUpgradePreview = async (priceId: string) => {
    setLoading(true)
    try {
      toast.info(tp('subscription.toasts.openingPortal'))
      
      // Get current subscription ID for the portal flow
      const subscriptionId = (currentSubscription as any)?.stripe_subscription_id
      
      // Create portal session with subscription update confirm flow
      const portalUrl = `api/subscription/customer-portal?flow=subscription_update_confirm&priceId=${encodeURIComponent(priceId)}${subscriptionId ? `&subscriptionId=${encodeURIComponent(subscriptionId)}` : ''}`
      
      const portalRes = await fetch(getApiUrl(portalUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!portalRes.ok) {
        throw new Error(tp('subscription.toasts.customerPortalFailed'))
      }
      
      const portalData = await portalRes.json()
      window.location.href = portalData.url
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tp('subscription.toasts.upgradePreviewFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDirectPurchase = async (priceId: string) => {
    setLoading(true)
    try {
      const successPath = process.env.NEXT_PUBLIC_BASE_PATH || '/'
      const res = await fetch(getApiUrl('/api/payment/subscription-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}${successPath}?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || tp('subscription.toasts.checkoutFailed'))
      }
      
      const result = await res.json()
      
      // Handle direct upgrade response (new upgrade system)
      if (result.success && result.subscription_id) {
        toast.success(tp('subscription.toasts.upgraded'))
        // Redirect to success page or reload to refresh subscription data
        if (result.redirect_url) {
          window.location.href = result.redirect_url
        } else {
          window.location.reload()
        }
      } else if (result.url) {
        // Handle regular checkout session response (for new subscriptions or users without payment methods)
        window.location.href = result.url
      } else {
        throw new Error(tp('subscription.toasts.invalidCheckout'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tp('subscription.toasts.checkoutFailed'))
    } finally {
      setLoading(false)
    }
  }


  // UI strings pulled from translation keys below

  // Pricing helpers + derived values
  const getCyclePrice = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly') =>
    cycle === 'yearly' ? tier.yearly_price : tier.monthly_price

  const getPerCredit = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly') => {
    const credits = tier.credits || 0
    if (!credits) return null
    const price = getCyclePrice(tier, cycle)
    return Math.round((price / credits) * 100) / 100
  }

  const getDiscountPct = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly') => {
    const price = getCyclePrice(tier, cycle)
    const base = tier.original_price || 0
    if (!base || base <= price) return 0
    return Math.floor(((base - price) / base) * 100)
  }

  const overallAnnualSavePct = useMemo(() => {
    if (!subscriptionTiers || subscriptionTiers.length === 0) return 0
    // Use median-priced tier as reference to avoid depending on specific names
    const sorted = [...subscriptionTiers].sort((a, b) => a.monthly_price - b.monthly_price)
    const reference = sorted[Math.floor(sorted.length / 2)] || sorted[0]
    const monthlyTotal = reference.monthly_price * 12
    const yearlyTotal = reference.yearly_price * 12
    if (yearlyTotal >= monthlyTotal) return 0
    return Math.floor(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100)
  }, [subscriptionTiers])

  const toQualityLabel = (code: string) => (inferenceSettings?.quality_labels?.[code] || code)

  // Loading state (styled)
  if (tiersLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingTitle}>{tp('subscription.loading')}</div>
      </div>
    )
  }

  // Show empty state if no tiers available
  if (filteredTiers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">{tp('subscription.empty.title')}</h2>
          <p className="text-muted-foreground mt-2">
            {tp('subscription.empty.description')}
          </p>
        </div>
      </div>
    )
  }

  // Build context header using translations
  const contextTitleKey = context === 'character-limit'
    ? 'subscription.context.characterLimit.title'
    : context === 'quality-upgrade'
    ? 'subscription.context.qualityUpgrade.title'
    : context === 'credit-upgrade'
    ? 'subscription.context.creditUpgrade.title'
    : context === 'general'
    ? 'subscription.context.general.title'
    : 'subscription.context.default.title'

  const contextDescKey = isSpecialOffer
    ? 'subscription.headers.chooseYourPlan'
    : context === 'character-limit'
    ? 'subscription.context.characterLimit.description'
    : context === 'quality-upgrade'
    ? 'subscription.context.qualityUpgrade.description'
    : context === 'credit-upgrade'
    ? 'subscription.context.creditUpgrade.description'
    : context === 'general'
    ? 'subscription.context.general.description'
    : 'subscription.context.default.description'

  return (
    <>
      {isSpecialOffer && (
        <div className={styles.specialOfferBanner}>
          <div className={styles.bannerContainer}>
            <div className={styles.bannerLeft}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.6523 3.78577C30.1446 1.61562 33.8554 1.61563 36.3477 3.78577L41.4884 8.26203C42.3846 9.04238 43.4743 9.56714 44.6432 9.78127L51.348 11.0095C54.5986 11.605 56.9123 14.5063 56.7695 17.8079L56.475 24.618C56.4237 25.8052 56.6928 26.9843 57.2542 28.0317L60.4743 34.0396C62.0354 36.9522 61.2097 40.5701 58.5394 42.517L53.0314 46.5327C52.0712 47.2328 51.3171 48.1784 50.8483 49.2703L48.1589 55.5337C46.855 58.5703 43.5116 60.1804 40.3245 59.3065L33.7507 57.504C32.6047 57.1898 31.3953 57.1898 30.2493 57.504L23.6755 59.3065C20.4884 60.1804 17.145 58.5703 15.8411 55.5337L13.1517 49.2703C12.6829 48.1784 11.9288 47.2328 10.9686 46.5327L5.46061 42.517C2.7903 40.5701 1.96455 36.9522 3.5257 34.0395L6.74582 28.0317C7.30718 26.9843 7.57631 25.8052 7.52497 24.618L7.23047 17.8079C7.08769 14.5063 9.40139 11.605 12.652 11.0095L19.3568 9.78127C20.5257 9.56714 21.6154 9.04238 22.5116 8.26203L27.6523 3.78577Z" fill="#FF491C"/>
                <path d="M45.2445 22.0684L27.0376 40.2753L18.7617 31.9994" stroke="white" stroke-width="4.41379" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h2 className={styles.bannerTitle}><span>{tp('subscription.banner.titleStart')}</span> <span className={styles.bannerTitleBold}>{tp('subscription.banner.titleNumber')}</span></h2>
            </div>
            <div className={styles.bannerRight}>
              <p className={styles.bannerDescription}>{tp('subscription.banner.description.start')}  <span style={{ backgroundColor: '#FF491C', color: '#fff', padding: '4px 6px', borderRadius: '3px 0 0 3px' }}>{tp('subscription.banner.description.lifetime')}</span><span style={{ backgroundColor: '#FFF', color: '#FF491C', padding: '4px 6px', borderRadius: '0 3px 3px 0' }}> {tp('subscription.banner.description.annualDiscount')}</span>  {tp('subscription.banner.description.annualWord')} {tp('subscription.banner.description.or')} <span style={{ backgroundColor: '#FFF', color: '#FF491C', padding: '4px 6px', borderRadius: '3px' }}>{tp('subscription.banner.description.monthlyDiscount')}</span> {tp('subscription.banner.description.monthlyWord')}, {tp('subscription.banner.description.end')}</p>
              <small className={styles.bannerSmall}>{tp('subscription.banner.small')}</small>
            </div>
          </div>
        </div>
      )}
    <div className={styles.pricingContainer}>
      {/* Context-specific header */}
      <div className={styles.headerWrap + ' ' + styles.headerWrapRow}>
        <div className={styles.headerSubWrap}>
          {!isSpecialOffer && (
            <span className={styles.headerSub}>
              <Button variant="ghost" size="sm" iconOnly onClick={closeDialog}>
                <Icon variant="arrowLeft" size={16} className="text-[#2ADED8]" />
              </Button>
              <span className={styles.headerSubText}>{tp(contextTitleKey)}</span>
            </span>
          )}
          <h2 className={styles.headerTitle}>{tp(contextDescKey)}</h2>
        </div>
        <div className={styles.toggleWrap}>
          <SegmentedControl
            className={styles.toggle}
            options={[
              { value: 'monthly', content: tp('subscription.toggle.monthly') },
              { value: 'yearly', content: tp('subscription.toggle.yearly') }
            ]}
            value={billingCycle}
            onChange={(v) => setBillingCycle(v === 'monthly' ? 'monthly' : 'yearly')}
            size="sm"
            ariaLabel={tp('subscription.toggle.aria')}
          />
        </div>
      </div>

      {/* Tier selection */}
      <div className={styles.grid}>
        {filteredTiers.map((tier) => {
          const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price
          const isRecommended = tier.popular && !showOnlyUpgrades
          const name = tier.name
          const isCurrentPlan = !!effectiveCurrentPlan && name === effectiveCurrentPlan
          const isDisabled = tier.disabled === true

          return (
            <div
              key={tier.id}
              className={`${styles.card} ${name} ${isRecommended ? styles.cardHighlight : ''}`}
            >
              {isRecommended && (
                <div className={styles.recommendedBadge}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.64134 1.18305C9.42017 0.504882 10.5798 0.504883 11.3587 1.18305L12.9651 2.58189C13.2452 2.82574 13.5857 2.98973 13.951 3.05665L16.0463 3.44048C17.0621 3.62656 17.7851 4.53322 17.7405 5.56497L17.6484 7.69311C17.6324 8.06411 17.7165 8.4326 17.8919 8.75989L18.8982 10.6374C19.3861 11.5476 19.128 12.6782 18.2936 13.2866L16.5723 14.5415C16.2723 14.7602 16.0366 15.0557 15.8901 15.397L15.0496 17.3543C14.6422 18.3032 13.5974 18.8064 12.6014 18.5333L10.5471 17.97C10.189 17.8718 9.81102 17.8718 9.45289 17.97L7.39858 18.5333C6.40263 18.8064 5.35782 18.3032 4.95036 17.3543L4.10991 15.397C3.96339 15.0557 3.72774 14.7602 3.42768 14.5415L1.70644 13.2866C0.871968 12.6782 0.613922 11.5476 1.10178 10.6374L2.10807 8.75989C2.28349 8.4326 2.3676 8.06412 2.35155 7.69311L2.25952 5.56497C2.2149 4.53322 2.93793 3.62656 3.95374 3.44048L6.04902 3.05665C6.41428 2.98973 6.75481 2.82574 7.03487 2.58188L8.64134 1.18305Z" fill="#FF491C"/>
                    <path d="M14.1391 6.89648L8.44949 12.5861L5.86328 9.99993" stroke="white" stroke-width="1.37931" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {tp('subscription.card.recommended')}
                </div>
              )}
              <div className={styles.cardHead}>
                <div className={styles.iconWrap}>
                  {tier.image_url && (
                    <img
                      src={tier.image_url as any}
                      alt={tier.display_name}
                      width={32}
                      height={32}
                      style={{ width: 40, height: 40, objectFit: 'contain' }}
                    />
                  )}
                </div>
                {getDiscountPct(tier, billingCycle) > 0 && (
                  <span className={styles.discount}>{tp('subscription.card.save', { pct: getDiscountPct(tier, billingCycle) })}</span>
                )}
              </div>

              <div className={styles.cardTitle}>{tier.display_name}</div>

              <div className={styles.priceBlock}>
                <div className={styles.priceWrap}>
                  {tier.original_price && tier.original_price > price && (
                    <div className={styles.originalPrice + ' ' + styles.price}>${tier.original_price.toFixed(0)}</div>
                  )}
                  <div className={styles.mainPrice}><span className={styles.price}>${price.toFixed(0)}</span><span className={styles.per}>{tp('subscription.card.perMonth')}</span></div>
                </div>
                <div className={styles.priceSub}>{tp('subscription.card.billed', { cycle: billingCycle })}</div>
              </div>

              <div className={styles.divider} />

              <div className={styles.includedBlock}>
                <div className={styles.creditsLine}>
                  <span className={styles.creditsCount}>{tp('subscription.card.creditsCount', { count: tier.credits.toLocaleString() })} <span className={styles.per}>{tp('subscription.card.perMonthWord')}</span></span>
                  {getPerCredit(tier, billingCycle) !== null && (
                    <span className={styles.perCredit}>{tp('subscription.card.perCredit', { price: `$${getPerCredit(tier, billingCycle)!.toFixed(2)}` })}</span>
                  )}
                </div>
                <ul className={styles.features}>
                    {[
                      { label: tp('subscription.card.features.quality', { quality: toQualityLabel(String(tier.max_quality)) }) },
                      { label: tp('subscription.card.features.characterIncluded', { count: tier.character_training_included }) },
                      { label: tp('subscription.card.features.maxCharacters', { count: tier.max_characters }) },
                      { label: tp('subscription.card.features.concurrentShoots', { count: tier.concurrent_jobs }) },
                      { label: tp('subscription.card.features.commercialUse') }
                    ].map((feature, idx) => (
                      <li className={styles.featureItem} key={idx}>
                        <Icon variant='checkmark' size={16} />
                        {feature.label}
                      </li>
                    ))}
                </ul>
              </div>

              {isDisabled ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                          className={styles.selectBtn + ' ' + styles.disabled}
                          variant="primary"
                          size="sm"
                          onClick={() => handlePurchase(tier)}
                          disabled
                        >
                          {tp('subscription.card.button.select')}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{tp('subscription.card.button.disabledTooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  className={styles.selectBtn}
                  variant="primary"
                  size="sm"
                  onClick={() => handlePurchase(tier)}
                  disabled={isCurrentPlan || loading}
                >
                  {isCurrentPlan ? tp('subscription.card.button.current') : (loading ? tp('subscription.card.button.processing') : tp('subscription.card.button.select'))}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Full price notice for upgrades */}
      {showOnlyUpgrades && (
        <p className="text-xs text-muted-foreground text-center">
          {tp('subscription.footer.upgradeNotice')}
        </p>
      )}
    </div>

  </>
)} 