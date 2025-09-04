import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { useCreditPacks, useCreditCosts } from '@/hooks/usePricingConfig'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api/client'
import { getPriceIdForCredits, extractQualityCosts, getTrainingCost, formatValidity } from './utils'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './SubscriptionDialogContent.module.css'

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

  const qualityCosts = extractQualityCosts(creditCosts || {})
  const trainingCost = getTrainingCost(creditCosts || {})

  const isRecommendedForUser = (pack: { credits: number }) => {
    if (!requiredCredits) return false
    return pack.credits >= requiredCredits && pack.credits <= requiredCredits * 2
  }

  return ( 
    <div className="space-y-6 max-w-4xl">
      <div className="text-center">
        <h2 className="text-xl font-bold">Insufficient Credits</h2>
        <p className={styles.subtleText}>
          {requiredCredits 
            ? `You need ${requiredCredits} credits for this action. Purchase a credit pack to continue.`
            : 'Top up your credits with one-time purchases to continue generating.'
          }
        </p>
      </div>

      <div className={styles.grid}>
        {(packs || []).map((pack: any) => {
          const perCredit = (pack.price / Math.max(pack.credits, 1)).toFixed(3)
          const level = pack.credits >= 360 ? 'pro' : pack.credits >= 180 ? 'standard' : 'basic'
          const highlight = isRecommendedForUser(pack)
          return (
            <div key={`${pack.name}-${pack.credits}`} className={`${styles.card} ${level} ${highlight ? styles.cardSelected : ''}`}>
              <div className={styles.cardHead}>
                <div className={styles.iconWrap}>
                  {level === 'pro' ? (
                    <Icon variant="insights" size={24} />
                  ) : level === 'standard' ? (
                    <Icon variant="scene" size={24} />
                  ) : (
                    <Icon variant="smilyFace" size={24} />
                  )}
                </div>
              </div>

              <div className={styles.cardTitle}>{pack.name}</div>

              <div className={styles.priceBlock}>
                <div className={styles.mainPrice}>${pack.price}<span className={styles.per}> one-time</span></div>
                <div className={styles.priceSub}>${perCredit} per credit</div>
              </div>

              <div className={styles.divider} />

              <div className={styles.includedBlock}>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}><span className={styles.subtleText}>Credits:</span> {pack.credits.toLocaleString()}</div>
                  {pack.validity_days != null && (
                    <div className={styles.metaItem}><span className={styles.subtleText}>Validity:</span> {formatValidity(pack.validity_days)}</div>
                  )}
                </div>

                <ul className={styles.features}>
                  <li className={styles.featureItem}>Perfect for:</li>
                  {qualityCosts.map((q) => (
                    <li key={q.quality} className={styles.featureItem}>• {Math.floor(pack.credits / Math.max(q.cost, 1))} × {q.quality} images</li>
                  ))}
                  {!!trainingCost && (
                    <li className={styles.featureItem}>• {Math.floor(pack.credits / Math.max(trainingCost, 1))} × LoRA trainings</li>
                  )}
                </ul>
              </div>

              <Button
                className={styles.selectBtn}
                onClick={() => handlePurchase(pack)}
                disabled={isLoading === pack.name}
              >
                {isLoading === pack.name ? 'Processing…' : `Buy ${pack.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className={styles.mutedNote}>
        Credits expire after the validity period and cannot be refunded. Credits are consumed when generation starts, regardless of output quality.
      </div>
    </div>
  )
} 