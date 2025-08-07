import { useState, useMemo } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { RadioGroup, RadioGroupItem } from '@primeshot/common/web/ui/radio-group'
import { useSubscriptionTiers, type SubscriptionTier } from '@/hooks/usePricingConfig'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { STRIPE_REFERENCE } from '@/lib/constants/stripe-reference'
import { toast } from 'sonner'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { getApiUrl } from '@/lib/api/client'
import { UpgradeConfirmationDialog } from './UpgradeConfirmationDialog'

// Context types for different upgrade scenarios
export type SubscriptionDialogContext = 
  | 'character-limit' 
  | 'resolution-upgrade' 
  | 'credit-upgrade' 
  | 'general'

export interface SubscriptionDialogContentProps {
  context?: SubscriptionDialogContext
  currentPlan?: string
  showOnlyUpgrades?: boolean
  requiredFeature?: 'max_characters' | 'max_resolution' | 'credits'
}

function formatPrice(price: number) { 
  return `$${price.toFixed(2)}` 
}

// Get environment for Stripe reference
function getEnvironment(): 'test' | 'production' {
  // Check Vercel environment first
  if (typeof process !== 'undefined' && process.env.VERCEL_TARGET_ENV) {
    return process.env.VERCEL_TARGET_ENV === 'production' ? 'production' : 'test'
  }
  
  // Fallback to NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'production'
  }
  
  // Default to test for safety
  return 'test'
}

// Get Stripe price ID for a subscription tier
function getStripePriceId(tierName: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const env = getEnvironment()
  const stripeConfig = STRIPE_REFERENCE[env]
  
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
    case 'resolution-upgrade':
      return {
        title: 'Upgrade for Higher Resolution',
        description: 'Upgrade your plan to generate images at higher resolutions and access premium features.'
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [upgradePreview, setUpgradePreview] = useState<any>(null)
  const [selectedPriceId, setSelectedPriceId] = useState<string>('')
  const { user } = useAuth()
  const { data: subscriptionTiers, isLoading: tiersLoading } = useSubscriptionTiers()
  const { data: currentSubscription } = useCurrentSubscription()

  // Determine current plan from props or subscription data
  const effectiveCurrentPlan = currentPlan || currentSubscription?.plan_name

  // Filter tiers based on upgrade requirements
  const filteredTiers = useMemo(() => {
    if (!subscriptionTiers) return []
    
    if (showOnlyUpgrades && effectiveCurrentPlan) {
      const hierarchy = getTierHierarchy()
      const currentLevel = hierarchy[effectiveCurrentPlan] || 0
      
      return subscriptionTiers.filter(tier => {
        const tierLevel = hierarchy[tier.name] || 0
        return tierLevel > currentLevel
      })
    }
    
    return subscriptionTiers
  }, [subscriptionTiers, showOnlyUpgrades, effectiveCurrentPlan])

  // Set default selected tier (first available tier or recommended)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)

  // Update selected tier when filtered tiers change
  useMemo(() => {
    if (filteredTiers.length > 0 && !selectedTier) {
      // For upgrades, select the first (lowest) upgrade option
      // For new users, select the recommended tier or standard
      const defaultTier = showOnlyUpgrades 
        ? filteredTiers[0]
        : filteredTiers.find(t => t.popular) || filteredTiers.find(t => t.name === 'standard') || filteredTiers[0]
      
      setSelectedTier(defaultTier)
    }
  }, [filteredTiers, selectedTier, showOnlyUpgrades])

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please log in')
      return
    }
    
    if (!selectedTier) {
      toast.error('Please select a plan')
      return
    }

    // Get Stripe price ID based on tier name and billing cycle
    const priceId = getStripePriceId(selectedTier.name, billingCycle)
    
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
      const res = await fetch(getApiUrl('/api/subscription/preview-upgrade'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to preview upgrade')
      }
      
      const result = await res.json()
      
      // Handle redirect response (when preview fails)
      if (result.redirect) {
        toast.info(result.message || 'Opening Stripe customer portal...')
        
        // Call customer portal endpoint
        const portalRes = await fetch(getApiUrl('/api/subscription/customer-portal'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (portalRes.ok) {
          const portalData = await portalRes.json()
          window.location.href = portalData.url
        } else {
          throw new Error('Failed to open customer portal')
        }
        return
      }
      
      // Handle normal preview response
      setUpgradePreview(result)
      setSelectedPriceId(priceId)
      setShowConfirmation(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to preview upgrade')
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

  const handleConfirmUpgrade = async () => {
    if (!selectedPriceId) return
    
    setShowConfirmation(false)
    await handleDirectPurchase(selectedPriceId)
  }

  const contextMessage = getContextMessage(context)

  // Show loading state
  if (tiersLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Loading Plans...</h2>
        </div>
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
    <div className="space-y-6 max-w-4xl">
      {/* Context-specific header */}
      <div className="text-center">
        <h2 className="text-xl font-bold">{contextMessage.title}</h2>
        <p className="text-muted-foreground mt-2">{contextMessage.description}</p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center gap-4">
        <Button 
          variant={billingCycle === 'monthly' ? 'primary' : 'secondary'} 
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button 
          variant={billingCycle === 'yearly' ? 'primary' : 'secondary'} 
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
        </Button>
      </div>

      {/* Tier selection */}
      <RadioGroup 
        value={selectedTier?.id.toString() || ''} 
        onValueChange={(val) => {
          const tier = filteredTiers.find(t => t.id.toString() === val)
          if (tier) setSelectedTier(tier)
        }} 
        className="space-y-4"
      >
        {filteredTiers.map(tier => {
          const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price
          const isSelected = selectedTier?.id === tier.id
          const isRecommended = tier.popular && !showOnlyUpgrades
          
          return (
            <label 
              key={tier.id} 
              className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
              }`}
            > 
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{tier.display_name}</span>
                  {isRecommended && <Badge variant="default">Recommended</Badge>}
                  {showOnlyUpgrades && <Badge variant="secondary">Upgrade</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                
                {/* Highlight required feature */}
                {requiredFeature && (
                  <div className="text-sm text-primary font-medium">
                                            {requiredFeature === 'max_characters' && `${tier.max_characters} Characters`}
                    {requiredFeature === 'max_resolution' && `Up to ${tier.max_resolution} Resolution`}
                    {requiredFeature === 'credits' && `${tier.credits} Credits/month`}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xl font-bold">{formatPrice(price)}</div>
                  <div className="text-sm text-muted-foreground">
                    per {billingCycle === 'yearly' ? 'month' : 'month'}
                  </div>
                </div>
                <RadioGroupItem value={tier.id.toString()} id={tier.id.toString()} />
              </div>
            </label>
          )
        })}
      </RadioGroup>

      {/* Purchase button */}
      <Button 
        className="w-full" 
        onClick={handlePurchase} 
        disabled={loading || !selectedTier}
        size="lg"
      >
        {loading ? 'Processing…' : `${showOnlyUpgrades ? 'Upgrade to' : 'Purchase'} ${selectedTier?.display_name || 'Plan'}`}
      </Button>

      {/* Full price notice for upgrades */}
      {showOnlyUpgrades && (
        <p className="text-xs text-muted-foreground text-center">
          Your current subscription will be canceled and replaced with the new plan. Existing credits will be preserved.
        </p>
      )}
    </div>

    {/* Upgrade Confirmation Dialog */}
    <UpgradeConfirmationDialog
      isOpen={showConfirmation}
      onClose={() => setShowConfirmation(false)}
      onConfirm={handleConfirmUpgrade}
      preview={upgradePreview}
      isLoading={loading}
    />
  </>
)} 