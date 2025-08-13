'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { useCreditPacks, useCreditCosts } from '@/hooks/usePricingConfig'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { useCreditPackCheckout } from '@/hooks/useCreditPackCheckout'
import { CreditPackGrid } from './CreditPackGrid'
import { getPriceIdForCredits, extractQualityCosts, getTrainingCost } from './utils'

interface CreditPackPricingProps {
  className?: string
}

export function CreditPackPricing({ className }: CreditPackPricingProps) {
  const checkoutMutation = useCreditPackCheckout()
  const router = useRouter()
  const { user } = useAuth()

  const { data: creditPacks = [] } = useCreditPacks()
  const { data: creditCosts } = useCreditCosts()

  const handlePurchase = async (creditPack: { credits: number }) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const priceId = getPriceIdForCredits(creditPack.credits)
    if (!priceId) return

    checkoutMutation.mutate({
      priceId,
      successUrl: `${window.location.origin}${process.env.NEXT_PUBLIC_POST_LOGIN_PATH || '/'}?credits=success`,
      cancelUrl: `${window.location.origin}/pricing`
    })
  }

  const packs = creditPacks as any

  const formatValidity = (days: number) => {
    if (days >= 365) {
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
    } else if (days >= 30) {
      return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`
    } else {
      return `${days} day${days > 1 ? 's' : ''}`
    }
  }

  const guideQualityCosts = extractQualityCosts(creditCosts || {}, 6)
  const guideTrainingCost = getTrainingCost(creditCosts || {})

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Credit Packs</h2>
        <p className="text-muted-foreground mt-2">
          Top up your credits with one-time purchases. Perfect for extra generations when you need them.
        </p>
      </div>

      <CreditPackGrid
        packs={packs}
        creditCosts={creditCosts || {}}
        onPurchase={handlePurchase as any}
        isProcessing={(name) => checkoutMutation.isPending}
        buttonVariant="secondary"
        buttonSize="lg"
      />

      {/* Credit Usage Info */}
      <div className="mt-8 bg-muted/30 rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="font-semibold mb-4">Credit Usage Guide</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Image Generation</h4>
            <ul className="space-y-1 text-muted-foreground">
              {guideQualityCosts.map((q) => (
                <li key={q.quality}>• {q.quality} quality: {q.cost} credit{q.cost > 1 ? 's' : ''} per image</li>
              ))}
              <li>• Number of takes: cost × quantity</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">LoRA Training</h4>
            <ul className="space-y-1 text-muted-foreground">
              {!!guideTrainingCost && (
                <li>• Face model training: {guideTrainingCost} credits</li>
              )}
              <li>• One-time cost per model</li>
              <li>• Unlimited generations afterward</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mt-6 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          Credits expire after the validity period and cannot be refunded. 
          Credits are consumed when generation starts, regardless of output quality.
        </p>
      </div>
    </div>
  )
} 