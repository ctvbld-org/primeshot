import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { useCreditPacks, useCreditCosts } from '@/hooks/usePricingConfig'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api/client'
import { CreditPackGrid } from './CreditPackGrid'
import { getPriceIdForCredits } from './utils'

interface CreditPackDialogContentProps {
  requiredCredits?: number
}

export function CreditPackDialogContent({ requiredCredits }: CreditPackDialogContentProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const { data: creditPacks = [] } = useCreditPacks()
  const { data: creditCosts } = useCreditCosts()

  // shared grid expects packs-like structure
  const packs = creditPacks as any

  const handlePurchase = async (creditPack: { name: string; credits: number }) => {
    if (!user) {
      toast.error('Please log in')
      return
    }

    setIsLoading(creditPack.name)

    try {
      const priceId = getPriceIdForCredits(creditPack.credits)
      if (!priceId) throw new Error('Invalid credit pack configuration')

      const response = await fetch(getApiUrl('/api/payment/credit-pack-checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}${process.env.NEXT_PUBLIC_POST_LOGIN_PATH || '/'}?credits=success`,
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
      console.error('Credit pack purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to purchase credit pack')
    } finally {
      setIsLoading(null)
    }
  }

  // Icon/color/format now handled by CreditPackGrid

  const isRecommendedForUser = (pack: { credits: number }) => {
    if (!requiredCredits) return false
    return pack.credits >= requiredCredits && pack.credits <= requiredCredits * 2
  }

  return ( 
    <div className="space-y-6 max-w-4xl">
      <div className="text-center">
        <h2 className="text-xl font-bold">Insufficient Credits</h2>
        <p className="text-muted-foreground mt-2">
          {requiredCredits 
            ? `You need ${requiredCredits} credits for this action. Purchase a credit pack to continue.`
            : 'Top up your credits with one-time purchases to continue generating.'
          }
        </p>
      </div>

      <CreditPackGrid
        packs={packs}
        creditCosts={creditCosts || {}}
        onPurchase={(pack) => handlePurchase(pack)}
        isProcessing={(name) => isLoading === name}
        highlight={(pack) => isRecommendedForUser(pack as any)}
        buttonVariant="primary"
        buttonSize="sm"
      />

      <div className="text-center text-xs text-muted-foreground">
        <p>
          Credits expire after the validity period and cannot be refunded. 
          Credits are consumed when generation starts, regardless of output quality.
        </p>
      </div>
    </div>
  )
} 