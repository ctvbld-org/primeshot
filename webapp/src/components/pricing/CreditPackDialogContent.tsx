import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { useCreditPacks, useCreditCosts } from '@/hooks/usePricingConfig'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api/client'
import { getPriceIdForCredits, extractQualityCosts, getTrainingCost, formatValidity } from './utils'
import { useInferenceSettings } from '@/hooks/useInferenceSettings'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './SubscriptionDialogContent.module.css'
import { useTranslation } from 'react-i18next'

interface CreditPackDialogContentProps {
  requiredCredits?: number
  fullscreen?: boolean
  // Allows DialogService to pass a wrapper class for styling the shared dialog
  dialogContentClassName?: string
}

export function CreditPackDialogContent({ requiredCredits }: CreditPackDialogContentProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const { closeDialog } = useDialogService()
  const { data: creditPacks = [] } = useCreditPacks()
  const { data: creditCosts } = useCreditCosts()
  const { data: inferenceSettings } = useInferenceSettings()
  const { t } = useTranslation('pricing')
  const tp = (k: string, o?: any) => String((t as any)(k, o))

  // shared grid expects packs-like structure
  const packs = creditPacks as any

  const handlePurchase = async (creditPack: { name: string; credits: number }) => {
    if (!user) {
      toast.error(tp('credits.toasts.loginRequired'))
      return
    }

    setIsLoading(creditPack.name)

    try {
      const priceId = getPriceIdForCredits(creditPack.credits)
      if (!priceId) throw new Error(tp('credits.toasts.invalidPackConfig'))

      const response = await fetch(getApiUrl('/api/payment/credit-pack-checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}${window.location.pathname}?credits=success`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || tp('credits.toasts.createCheckoutFailed'))
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (error) {
      console.error('Credit pack purchase error:', error)
      toast.error(error instanceof Error ? error.message : tp('credits.toasts.purchaseFailed'))
    } finally {
      setIsLoading(null)
    }
  }

  const qualityCosts = extractQualityCosts(creditCosts || {})
  const trainingCost = getTrainingCost(creditCosts || {})
  const toQualityLabel = (code: string) => (inferenceSettings?.quality_labels?.[code] || code)

  return ( 
    <div className={styles.pricingContainer}>
      <div className={styles.headerWrap}>
        <span className={styles.headerSub}>
          <Button variant="ghost" size="sm" iconOnly onClick={closeDialog}>
            <Icon variant="arrowLeft" size={16} className="text-[#2ADED8]" />
          </Button>
          <span className={styles.headerSubText}>
            {requiredCredits 
              ? tp('credits.dialog.headerSub.lowBalance')
              : tp('credits.dialog.headerSub.creativity')
            }
          </span>
        </span>
        <h2 className={styles.headerTitle}>
          {requiredCredits 
            ? tp('credits.dialog.headerTitle.lowBalance')
            : tp('credits.dialog.headerTitle.fun')
          }
        </h2>
      </div>

      <div className={styles.grid}>
        {(packs || []).map((pack: any) => {
          const perCredit = (pack.price / Math.max(pack.credits, 1)).toFixed(2)
          const level = pack.credits >= 500 ? 'pro' : pack.credits >= 250 ? 'standard' : 'basic'
          return (
            <div key={`${pack.name}-${pack.credits}`} className={`${styles.card} ${level}`}>
              <div className={styles.cardHead}>
                {pack.image_url ? (
                  <img
                    src={pack.image_url}
                    alt={pack.name}
                    width={40}
                    height={40}
                    style={{ width: 40, height: 40, objectFit: 'contain' }}
                  />
                ) : (
                  <Icon variant="credits" size={40} className="!text-[#2ADED8]" />
                )}
              </div>

              <div className={styles.cardTitle}>{pack.name}</div>

              <div className={styles.priceBlock}>
                <div className={styles.mainPrice}><span className={styles.price}>${pack.price}</span><span className={styles.per}> {tp('credits.card.oneTime')}</span></div>
                <div className={styles.priceSub}><span className={styles.price}>${perCredit}</span> {tp('credits.card.perCreditWord')}</div>
              </div>

              <div className={styles.divider} />

              <div className={styles.includedBlock}>

                <ul className={styles.features}>
                  {qualityCosts.map((q) => (
                    <li key={q.quality} className={styles.featureItem}>
                      <Icon variant="camera" size={16} />
                      {tp('credits.card.images', { count: Math.floor(pack.credits / Math.max(q.cost, 1)), quality: toQualityLabel(String(q.quality)) })}
                      {q.quality !== '1K' && '*'}
                    </li>
                  ))}
                  {!!trainingCost && (
                    <li className={styles.featureItem}>
                      <Icon variant="primeshotSymbol" size={16} />
                      {tp('credits.card.characters', { count: Math.floor(pack.credits / Math.max(trainingCost, 1)) })}
                    </li>
                  )}
                  <li className={styles.footNote}>
                    {tp('credits.card.footnote')}
                  </li>
                </ul>
              </div>

              <Button
                className={styles.selectBtn}
                variant="primary"
                size="sm"
                onClick={() => handlePurchase(pack)}
                disabled={isLoading === pack.name}
              >
                {isLoading === pack.name ? tp('credits.card.button.processing') : tp('credits.card.button.buy')}
              </Button>
              <small className={styles.validity}>
                {tp('credits.card.validity', { duration: formatValidity(pack.validity_days) })}
              </small>
            </div>
          )
        })}
      </div>
    </div>
  )
} 