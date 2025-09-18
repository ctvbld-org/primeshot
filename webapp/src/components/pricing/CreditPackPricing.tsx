'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { useCreditPacks, useCreditCosts } from '@/hooks/usePricingConfig'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { useCreditPackCheckout } from '@/hooks/useCreditPackCheckout'
import { getPriceIdForCredits, extractQualityCosts, getTrainingCost, formatValidity } from './utils'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './SubscriptionDialogContent.module.css'

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
      successUrl: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || '/'}?credits=success`,
      cancelUrl: `${window.location.origin}/pricing`
    })
  }

  const packs = creditPacks as any

  const guideQualityCosts = extractQualityCosts(creditCosts || {}, 6)
  const guideTrainingCost = getTrainingCost(creditCosts || {})

  return (
    <div className={className}>
      <div className={styles.sectionIntro}>
        <h2 className={styles.headerTitle}>Credit Packs</h2>
        <p className={styles.subtleText}>Top up your credits with one-time purchases. Perfect for extra generations when you need them.</p>
      </div>

      <div className={styles.grid}>
        {(packs || []).map((pack: any) => {
          const perCredit = (pack.price / Math.max(pack.credits, 1)).toFixed(3)
          const level = pack.credits >= 360 ? 'pro' : pack.credits >= 180 ? 'standard' : 'basic'
          return (
            <div key={`${pack.name}-${pack.credits}`} className={`${styles.card} ${level}`}>
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
                  {guideQualityCosts.map((q) => (
                    <li key={q.quality} className={styles.featureItem}>• {Math.floor(pack.credits / Math.max(q.cost, 1))} × {q.quality} images</li>
                  ))}
                  {!!guideTrainingCost && (
                    <li className={styles.featureItem}>• {Math.floor(pack.credits / Math.max(guideTrainingCost, 1))} × LoRA trainings</li>
                  )}
                </ul>
              </div>

              <Button
                className={styles.selectBtn}
                onClick={() => handlePurchase(pack)}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Processing…' : `Buy ${pack.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className={styles.guideBlock}>
        <div className={styles.guideTitle}>Credit Usage Guide</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Image Generation</div>
            <ul className={styles.subtleText} style={{ display: 'grid', gap: 4 }}>
              {guideQualityCosts.map((q) => (
                <li key={q.quality}>• {q.quality} quality: {q.cost} credit{q.cost > 1 ? 's' : ''} per image</li>
              ))}
              <li>• Number of takes: cost × quantity</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>LoRA Training</div>
            <ul className={styles.subtleText} style={{ display: 'grid', gap: 4 }}>
              {!!guideTrainingCost && (
                <li>• Face model training: {guideTrainingCost} credits</li>
              )}
              <li>• One-time cost per model</li>
              <li>• Unlimited generations afterward</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.mutedNote}>
        Credits expire after the validity period and cannot be refunded. Credits are consumed when generation starts, regardless of output quality.
      </div>
    </div>
  )
} 