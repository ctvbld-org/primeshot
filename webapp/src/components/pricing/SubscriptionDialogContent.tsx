import { useState, useMemo } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { useSubscriptionTiers, type SubscriptionTier } from '@/hooks/usePricingConfig'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { STRIPE_REFERENCE } from '@primeshot/common/lib/stripe/stripe-reference'
import { getStripeEnv } from '@primeshot/common/lib/stripe/env'
import { toast } from 'sonner'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { getApiUrl } from '@/lib/api/client'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './SubscriptionDialogContent.module.css'

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

// Get tier hierarchy for filtering
function getTierHierarchy(): Record<string, number> {
  return {
    'basic': 1,
    'standard': 2, 
    'pro': 3
  }
}

// Context-specific messaging
function getContextMessage(context?: SubscriptionDialogContext) {
  switch (context) {
    case 'character-limit':
      return {
        title: 'Upgrade to Create More Characters',
        description: 'You\'ve reached your character limit. Upgrade your plan to create additional characters and unlock more features.'
      }
    case 'quality-upgrade':
      return {
        title: 'Upgrade for Higher Quality',
        description: 'Upgrade your plan to generate images at higher quality and access premium features.'
      }
    case 'credit-upgrade':
      return {
        title: 'Upgrade for More Credits',
        description: 'Get more monthly credits and additional features by upgrading your subscription plan.'
      }
    case 'general':
      return {
        title: 'Upgrade Your Plan',
        description: 'Unlock more features and capabilities by upgrading to a higher tier plan.'
      }
    default:
      return {
        title: 'Choose Your Plan',
        description: 'Select the perfect plan for your creative needs. Upgrade or downgrade anytime.'
      }
  }
}

export function SubscriptionDialogContent({
  context,
  currentPlan,
  showOnlyUpgrades = false,
  requiredFeature
}: SubscriptionDialogContentProps = {}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { data: subscriptionTiers, isLoading: tiersLoading } = useSubscriptionTiers()
  const { data: currentSubscription } = useCurrentSubscription()

  // Determine current plan from props or subscription data
  // Only consider it a current plan if the subscription is active or pending cancellation
  const hasActivePlan = currentSubscription && 
    (currentSubscription.status === 'active' || currentSubscription.cancel_at_period_end === true)
  const effectiveCurrentPlan = currentPlan || (hasActivePlan ? currentSubscription?.plan_name : null)

  // Filter tiers based on upgrade requirements
  const filteredTiers = useMemo(() => {
    if (!subscriptionTiers) return []

    // When showing upgrades for an existing subscriber, include the current plan
    // card as well (button will be disabled) and then all higher tiers.
    if (showOnlyUpgrades && effectiveCurrentPlan) {
      const hierarchy = getTierHierarchy()
      const currentLevel = hierarchy[effectiveCurrentPlan] || 0

      const currentTier = subscriptionTiers.find(t => t.name === effectiveCurrentPlan)
      const upgradeTiers = subscriptionTiers.filter(tier => {
        const tierLevel = hierarchy[tier.name] || 0
        return tierLevel > currentLevel
      })

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
        : filteredTiers.find(t => t.popular) || filteredTiers.find(t => t.name === 'standard') || filteredTiers[0]

      setSelectedTier(defaultTier)
    }
  }, [filteredTiers, selectedTier, showOnlyUpgrades, effectiveCurrentPlan])

  const handlePurchase = async (passedTier?: SubscriptionTier | null) => {
    if (!user) {
      toast.error('Please log in')
      return
    }
    
    const tierToPurchase = passedTier ?? selectedTier

    if (!tierToPurchase) {
      toast.error('Please select a plan')
      return
    }

    // Get Stripe price ID based on tier name and billing cycle
    const priceId = getStripePriceId(tierToPurchase.name, billingCycle)
    
    if (!priceId) {
      toast.error('Invalid subscription plan selected')
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
      toast.info('Opening Stripe customer portal...')
      
      // Get current subscription ID for the portal flow
      const subscriptionId = currentSubscription?.stripe_subscription_id
      
      // Create portal session with subscription update confirm flow
      const portalUrl = `api/subscription/customer-portal?flow=subscription_update_confirm&priceId=${encodeURIComponent(priceId)}${subscriptionId ? `&subscriptionId=${encodeURIComponent(subscriptionId)}` : ''}`
      
      const portalRes = await fetch(getApiUrl(portalUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!portalRes.ok) {
        throw new Error('Failed to open customer portal')
      }
      
      const portalData = await portalRes.json()
      window.location.href = portalData.url
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open upgrade preview')
    } finally {
      setLoading(false)
    }
  }

  const handleDirectPurchase = async (priceId: string) => {
    setLoading(true)
    try {
      const successPath = process.env.NEXT_PUBLIC_POST_LOGIN_PATH || '/'
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
        throw new Error(error.error || 'Checkout failed')
      }
      
      const result = await res.json()
      
      // Handle direct upgrade response (new upgrade system)
      if (result.success && result.subscription_id) {
        toast.success('Subscription upgraded successfully!')
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
        throw new Error('Invalid response from checkout')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }


  const contextMessage = getContextMessage(context)

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
    const reference = subscriptionTiers.find(t => t.name === 'standard') || subscriptionTiers[0]
    const monthlyTotal = reference.monthly_price * 12
    const yearlyTotal = reference.yearly_price * 12
    if (yearlyTotal >= monthlyTotal) return 0
    return Math.floor(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100)
  }, [subscriptionTiers])

  // Loading state (styled)
  if (tiersLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingTitle}>Loading Plans...</div>
      </div>
    )
  }

  // Show empty state if no tiers available
  if (filteredTiers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">No Upgrade Available</h2>
          <p className="text-muted-foreground mt-2">
            You're already on the highest available plan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className={styles.root}>
      {/* Context-specific header */}
      <div className={styles.headerWrap}>
        <h2 className={styles.headerTitle}>{contextMessage.title}</h2>
        <div className={styles.toggleWrap}>
          <button
            className={`${styles.toggleBtn} ${billingCycle === 'monthly' ? styles.toggleActive : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`${styles.toggleBtn} ${billingCycle === 'yearly' ? styles.toggleActive : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
          </button>
          <span className={styles.toggleSave}>Save {overallAnnualSavePct}%</span>
        </div>
      </div>

      {/* Tier selection */}
      <div className={styles.grid}>
        {filteredTiers.map((tier) => {
          const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price
          const isSelected = selectedTier?.id === tier.id
          const isRecommended = tier.popular && !showOnlyUpgrades
          const name = tier.name
          const isCurrentPlan = !!effectiveCurrentPlan && name === effectiveCurrentPlan

          return (
            <div
              key={tier.id}
              className={`${styles.card} ${name} ${isRecommended ? styles.cardHighlight : ''} ${isSelected ? styles.cardSelected : ''}`}
            >
              <div className={styles.cardHead}>
                <div className={styles.iconWrap}>
                  {name === 'pro' ? (
                    <Icon variant="insights" size={24} />
                  ) : name === 'standard' ? (
                    <Icon variant="scene" size={24} />
                  ) : (
                    <Icon variant="smilyFace" size={24} />
                  )}
                </div>
                {getDiscountPct(tier, billingCycle) > 0 && (
                  <span className={styles.discount}>Save {getDiscountPct(tier, billingCycle)}%</span>
                )}
              </div>

              <div className={styles.cardTitle}>{tier.display_name}</div>
              <div className={styles.priceBlock}>
                {tier.original_price && tier.original_price > price && (
                  <div className={styles.originalPrice}>${tier.original_price.toFixed(0)}</div>
                )}
                <div className={styles.mainPrice}>
                  ${price.toFixed(0)}<span className={styles.per}>/ month</span>
                </div>
                <div className={styles.billedNote}>Billed {billingCycle}</div>
              </div>

              <div className={styles.divider} />

              <div className={styles.includedBlock}>
                <div className={styles.creditsLine}>
                  <span className={styles.creditsCount}>{tier.credits.toLocaleString()} credits per month</span>
                  {getPerCredit(tier, billingCycle) !== null && (
                    <span className={styles.perCredit}>${getPerCredit(tier, billingCycle)!.toFixed(2)} per credit</span>
                  )}
                </div>
                <ul className={styles.features}>
                  {tier.max_quality && (
                    <li className={styles.featureItem}>Up to {tier.max_quality} quality</li>
                  )}
                  {typeof tier.character_training_included === 'number' && tier.character_training_included > 0 && (
                    <li className={styles.featureItem}>{tier.character_training_included}x Character Included</li>
                  )}
                  {typeof tier.max_characters === 'number' && (
                    <li className={styles.featureItem}>Up to {tier.max_characters} Character Storage</li>
                  )}
                  {typeof tier.concurrent_jobs === 'number' && (
                    <li className={styles.featureItem}>Up to {tier.concurrent_jobs} concurrent Shoots</li>
                  )}
                  {Array.isArray(tier.features) && tier.features.includes('commercial') && (
                    <li className={styles.featureItem}>Commercial use</li>
                  )}
                </ul>
              </div>

              <Button
                className={styles.selectBtn}
                onClick={() => handlePurchase(tier)}
                disabled={isCurrentPlan || (loading && isSelected)}
              >
                {isCurrentPlan ? 'Current Plan' : (loading && isSelected ? 'Processing…' : 'Select Plan')}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Full price notice for upgrades */}
      {showOnlyUpgrades && (
        <p className="text-xs text-muted-foreground text-center">
          Your current subscription will be canceled and replaced with the new plan. Existing credits will be preserved.
        </p>
      )}
    </div>

  </>
)} 