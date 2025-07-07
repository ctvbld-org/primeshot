import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Coins, Package, Wallet } from 'lucide-react'
import { CREDIT_PACKS, type CreditPack } from '@/lib/constants/pricing'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { toast } from 'sonner'

interface CreditPackDialogContentProps {
  requiredCredits?: number
}

export function CreditPackDialogContent({ requiredCredits }: CreditPackDialogContentProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { user } = useAuth()

  const handlePurchase = async (creditPack: CreditPack) => {
    if (!user) {
      toast.error('Please log in')
      return
    }

    setIsLoading(creditPack.id)

    try {
      const response = await fetch('/api/payment/credit-pack-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: creditPack.stripePriceId,
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

  const getPackIcon = (packId: string) => {
    switch (packId) {
      case 'credits_100': return <Coins className="w-5 h-5" />
      case 'credits_300': return <Package className="w-5 h-5" />
      case 'credits_600': return <Wallet className="w-5 h-5" />
      default: return <Coins className="w-5 h-5" />
    }
  }

  const getPackColor = (packId: string) => {
    switch (packId) {
      case 'credits_100': return 'text-green-500'
      case 'credits_300': return 'text-blue-500'
      case 'credits_600': return 'text-purple-500'
      default: return 'text-green-500'
    }
  }

  const formatCredits = (credits: number) => {
    return credits.toLocaleString()
  }

  const isRecommendedForUser = (pack: CreditPack) => {
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

      <div className="grid md:grid-cols-3 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <Card 
            key={pack.id} 
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-muted-foreground/50 ${
              isRecommendedForUser(pack) ? 'border-blue-200 ring-1 ring-blue-200' : ''
            } ${pack.savings ? 'border-green-200 ring-1 ring-green-200' : ''}`}
          >
            {(pack.savings || isRecommendedForUser(pack)) && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className={
                  isRecommendedForUser(pack) 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-green-100 text-green-700"
                }>
                  {isRecommendedForUser(pack) ? 'Recommended' : pack.savings}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-3">
              <div className={`mx-auto mb-3 ${getPackColor(pack.id)}`}>
                {getPackIcon(pack.id)}
              </div>
              <CardTitle className="text-lg font-bold">{pack.name}</CardTitle>
              <CardDescription className="text-sm">
                {formatCredits(pack.credits)} Credits
              </CardDescription>
              
              <div className="mt-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold">${pack.price}</span>
                  <span className="text-muted-foreground text-xs">one-time</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${pack.costPerCredit.toFixed(3)} per credit
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="text-xs text-muted-foreground text-center">
                <p className="mb-2">Perfect for:</p>
                <ul className="space-y-1">
                  {pack.id === 'credits_100' && (
                    <>
                      <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                      <li>• {Math.floor(pack.credits / 2)} x 2K images</li>
                      <li>• {Math.floor(pack.credits / 3)} x 4K images</li>
                    </>
                  )}
                  {pack.id === 'credits_300' && (
                    <>
                      <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                      <li>• {Math.floor(pack.credits / 30)} x LoRA trainings</li>
                      <li>• Mix of resolutions & training</li>
                    </>
                  )}
                  {pack.id === 'credits_600' && (
                    <>
                      <li>• {Math.floor(pack.credits / 30)} x LoRA trainings</li>
                      <li>• {Math.floor(pack.credits / 1)} x 1K images</li>
                      <li>• Heavy usage scenarios</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePurchase(pack)}
                disabled={isLoading === pack.id}
                className="w-full"
                variant={isRecommendedForUser(pack) ? "primary" : "secondary"}
                size="sm"
              >
                {isLoading === pack.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

      <div className="text-center text-xs text-muted-foreground">
        <p>
          Credits expire after the validity period and cannot be refunded. 
          Credits are consumed when generation starts, regardless of output quality.
        </p>
      </div>
    </div>
  )
} 