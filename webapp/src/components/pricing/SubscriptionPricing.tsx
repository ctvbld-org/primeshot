'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'
import { SUBSCRIPTION_TIERS, LAUNCH_DISCOUNT, type SubscriptionTier } from '@/lib/constants/pricing'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { toast } from 'sonner'

interface SubscriptionPricingProps {
  className?: string
  showYearly?: boolean
}

export function SubscriptionPricing({ className, showYearly = false }: SubscriptionPricingProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()
  const { user } = useAuth()

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsLoading(tier.id)

    try {
      const priceId = billingCycle === 'yearly' && tier.stripePriceIds.yearly 
        ? tier.stripePriceIds.yearly 
        : tier.stripePriceIds.monthly

      const response = await fetch('/api/payment/subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/app/subscription/success`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (error) {
      console.error('Subscription error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription')
    } finally {
      setIsLoading(null)
    }
  }

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'tier_1': return <Zap className="w-6 h-6" />
      case 'tier_2': return <Sparkles className="w-6 h-6" />
      case 'tier_3': return <Crown className="w-6 h-6" />
      default: return <Zap className="w-6 h-6" />
    }
  }

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'tier_1': return 'text-blue-500'
      case 'tier_2': return 'text-purple-500'
      case 'tier_3': return 'text-yellow-500'
      default: return 'text-blue-500'
    }
  }

  const getDiscountInfo = (tierId: string) => {
    const discount = LAUNCH_DISCOUNT[tierId as keyof typeof LAUNCH_DISCOUNT]
    if (!discount) return null
    
    return {
      original: discount.originalPrice,
      discounted: discount.discountedPrice,
      savings: discount.savings
    }
  }

  return (
    <div className={className}>
      {/* Billing Toggle */}
      {showYearly && (
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2">Save 55%</Badge>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {SUBSCRIPTION_TIERS.map((tier) => {
          const discount = getDiscountInfo(tier.id)
          const currentPrice = discount ? discount.discounted : tier.monthlyPrice
          
          return (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                tier.popular 
                  ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105' 
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 ${getTierColor(tier.id)}`}>
                  {getTierIcon(tier.id)}
                </div>
                <CardTitle className="text-xl font-bold">{tier.displayName}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-2">
                    {discount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${discount.original}
                      </span>
                    )}
                    <span className="text-4xl font-bold">${currentPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {discount && (
                    <Badge variant="destructive" className="mt-2">
                      Save ${discount.savings}/month
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Max Resolution:</span>
                      <span className="font-medium ml-2">{tier.maxResolution}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">LoRA Training:</span>
                      <span className="font-medium ml-2">{tier.loraTrainingIncluded}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Concurrent Jobs:</span>
                      <span className="font-medium ml-2">{tier.concurrentJobs}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max LoRAs:</span>
                      <span className="font-medium ml-2">{tier.maxLoras}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isLoading === tier.id}
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  size="lg"
                >
                  {isLoading === tier.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Get ${tier.displayName}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Launch Promotion Banner */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            🚀 Launch Special: Up to $20/month off for the first 1000 users!
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          All plans include unlimited image generations within your credit allowance. 
          Credits expire at the end of each billing cycle and do not roll over. 
          Cancel anytime with no long-term commitments.
        </p>
      </div>
    </div>
  )
} 