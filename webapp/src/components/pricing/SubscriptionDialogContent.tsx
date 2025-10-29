import { useState, useMemo } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { SegmentedControl } from '@primeshot/common/web/ui/segmented-control'
import { useSubscriptionTiers, type SubscriptionTier } from '@/hooks/usePricingConfig'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { STRIPE_REFERENCE } from '@primeshot/common/lib/stripe/stripe-reference'
import { getStripeEnv } from '@primeshot/common/lib/stripe/env'
import { toast } from 'sonner'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { getApiUrl } from '@primeshot/common'
import { Icon } from '@primeshot/common/web/Icon'
import { PricingCards, SpecialOfferBanner } from '@primeshot/common/web'
import styles from './SubscriptionDialogContent.module.css'
import { useInferenceSettings } from '@/hooks/useInferenceSettings'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { useTranslation } from 'react-i18next'
import { useRewardful } from '@/hooks/useRewardful'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { closeDialog } = useDialogService()
  const { data: subscriptionTiers, isLoading: tiersLoading } = useSubscriptionTiers()
  const { data: currentSubscription } = useCurrentSubscription()
  const { data: inferenceSettings } = useInferenceSettings()
  const { referralId } = useRewardful()
  const openCreditPackDialog = useOpenCreditPackDialog()
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

  const handlePurchase = async (tier: SubscriptionTier) => {
    if (!user) {
      toast.error(tp('subscription.toasts.loginRequired'))
      return
    }

    // Get Stripe price ID based on tier name and billing cycle
    const priceId = getStripePriceId(tier.name, billingCycle)
    
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
      const res = await fetch(getApiUrl('/api/payment/subscription-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}${window.location.pathname}?subscription=success`,
          cancelUrl: `${window.location.origin}${window.location.pathname}`,
          referralId: referralId || undefined
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

  // Pricing helpers (now handled by PricingCards component)

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
      {isSpecialOffer && <SpecialOfferBanner />}
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
      <PricingCards
        billingCycle={billingCycle}
        tiers={filteredTiers}
        currentPlan={effectiveCurrentPlan}
        showOnlyUpgrades={showOnlyUpgrades}
        inferenceSettings={inferenceSettings}
        loading={loading}
        onSelectPlan={handlePurchase}
      />

      {/* Full price notice for upgrades */}
      {showOnlyUpgrades && (
        <div className={styles.creditPackFooter}>
          <p className="text-xs text-muted-foreground text-center">
            {tp('subscription.footer.upgradeNotice')}
          </p>
        
          <Button
            variant="secondary"
            onClick={() => {
              closeDialog()
              openCreditPackDialog()
            }}
            className={styles.creditPackBtn}
          >
            {tp('subscription.footer.buyCreditPack', { defaultValue: 'Buy a credit pack' })}
          </Button>
        </div>
      )}

    </div>

  </>
)} 