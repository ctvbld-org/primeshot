'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Coins, Package, Wallet } from 'lucide-react'
import { useCreditPacks } from '@/hooks/usePricingConfig'
import { STRIPE_REFERENCE } from '@/lib/constants/stripe-reference'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { useCreditPackCheckout } from '@/hooks/useCreditPackCheckout'

interface CreditPackPricingProps {
  className?: string
}

export function CreditPackPricing({ className }: CreditPackPricingProps) {
  const checkoutMutation = useCreditPackCheckout()
  const router = useRouter()
  const { user } = useAuth()

  const { data: creditPacks = [] } = useCreditPacks()

  const getEnvironment = (): 'test' | 'production' => {
    if (typeof process !== 'undefined' && process.env.VERCEL_TARGET_ENV) {
      return process.env.VERCEL_TARGET_ENV === 'production' ? 'production' : 'test'
    }
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      return 'production'
    }
    return 'test'
  }

  const getPriceIdForCredits = (credits: number): string | null => {
    const env = getEnvironment()
    const map: Record<number, keyof typeof STRIPE_REFERENCE[typeof env]['creditPacks']> = {
      90: 'credits_90',
      180: 'credits_180',
      360: 'credits_360',
    }
    const key = map[credits]
    return key ? STRIPE_REFERENCE[env].creditPacks[key].price : null
  }

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

  const getPackIcon = (packId: string) => {
    switch (packId) {
      case 'credits_90': return <Coins className="w-6 h-6" />
      case 'credits_180': return <Package className="w-6 h-6" />
      case 'credits_360': return <Wallet className="w-6 h-6" />
      default: return <Coins className="w-6 h-6" />
    }
  }

  const getPackColor = (packId: string) => {
    switch (packId) {
      case 'credits_90': return 'text-green-500'
      case 'credits_180': return 'text-blue-500'
      case 'credits_360': return 'text-purple-500'
      default: return 'text-green-500'
    }
  }

  const formatCredits = (credits: number) => {
    return credits.toLocaleString()
  }

  const formatValidity = (days: number) => {
    if (days >= 365) {
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
    } else if (days >= 30) {
      return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`
    } else {
      return `${days} day${days > 1 ? 's' : ''}`
    }
  }

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Credit Packs</h2>
        <p className="text-muted-foreground mt-2">
          Top up your credits with one-time purchases. Perfect for extra generations when you need them.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {creditPacks.map((pack) => (
          <Card 
            key={`${pack.name}-${pack.credits}`} 
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-muted-foreground/50 ${
              ''
            }`}
          >
            {/* Savings badge removed; not present in DB-backed packs */}

            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 ${getPackColor(pack.id)}`}>
                {getPackIcon(pack.id)}
              </div>
              <CardTitle className="text-xl font-bold">{pack.name}</CardTitle>
              <CardDescription className="text-sm">
                {formatCredits(pack.credits)} Credits
              </CardDescription>
              
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">${pack.price}</span>
                  <span className="text-muted-foreground text-sm">one-time</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ${(pack.price / Math.max(pack.credits, 1)).toFixed(3)} per credit
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Credits:</span>
                      <span className="font-medium ml-2">{formatCredits(pack.credits)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Validity:</span>
                      <span className="font-medium ml-2">{formatValidity(pack.validityDays)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">Perfect for:</p>
                  <ul className="space-y-1">
                    {pack.id === 'credits_90' && (
                      <>
                        <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                        <li>• {Math.floor(pack.credits / 2)} x 2K images</li>
                        <li>• {Math.floor(pack.credits / 3)} x 4K images</li>
                      </>
                    )}
                    {pack.id === 'credits_180' && (
                      <>
                        <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                        <li>• {Math.floor(pack.credits / 30)} x LoRA trainings</li>
                        <li>• Mix of resolutions & training</li>
                      </>
                    )}
                    {pack.id === 'credits_360' && (
                      <>
                        <li>• {Math.floor(pack.credits / 30)} x LoRA trainings</li>
                        <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                        <li>• Heavy usage scenarios</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(pack)}
                disabled={checkoutMutation.isPending}
                className="w-full"
                variant={"secondary"}
                size="lg"
              >
                {checkoutMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Buy ${pack.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Credit Usage Info */}
      <div className="mt-8 bg-muted/30 rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="font-semibold mb-4">Credit Usage Guide</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Image Generation</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 1K quality: 1 credit per image</li>
              <li>• 2K quality: 2 credits per image</li>
              <li>• 4K quality: 3 credits per image</li>
              <li>• Number of takes: cost × quantity</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">LoRA Training</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Face model training: 30 credits</li>
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