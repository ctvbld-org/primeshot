'use client'

import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Button } from './ui/button'
import { Icon } from './Icon'
import styles from './PricingCards.module.css'
import type { SubscriptionTier } from '../lib/pricing/types'

export type { SubscriptionTier } from '../lib/pricing/types'

export interface PricingCardsProps {
  billingCycle: 'monthly' | 'yearly'
  tiers: SubscriptionTier[]
  currentPlan?: string | null
  showOnlyUpgrades?: boolean
  inferenceSettings?: {
    quality_labels?: Record<string, string>
  }
  loading?: boolean
  renderButton?: (tier: SubscriptionTier, isCurrentPlan: boolean, isDisabled: boolean) => ReactNode
  onSelectPlan?: (tier: SubscriptionTier) => void
  className?: string
}

export function PricingCards({
  billingCycle,
  tiers,
  currentPlan,
  showOnlyUpgrades = false,
  inferenceSettings,
  loading = false,
  renderButton,
  onSelectPlan,
  className
}: PricingCardsProps) {
  const { t } = useTranslation('pricing')
  const tp = (k: string, o?: any) => String((t as any)(k, o))

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

  const toQualityLabel = (code: string) => (inferenceSettings?.quality_labels?.[code] || code)

  const handleCardClick = (tier: SubscriptionTier) => {
    if (onSelectPlan && !tier.disabled && tier.name !== currentPlan && !loading) {
      onSelectPlan(tier)
    }
  }

  return (
    <div className={`${styles.grid} ${className || ''}`}>
      {tiers.filter(tier => tier.monthly_price !== 0).map((tier) => {
        const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price
        const isRecommended = tier.popular && !showOnlyUpgrades
        const name = tier.name
        const isCurrentPlan = !!currentPlan && name === currentPlan
        const isDisabled = tier.disabled === true

        return (
          <div
            key={tier.id}
            className={`${styles.card} ${name} ${isRecommended ? styles.cardHighlight : ''}`}
          >
            {isRecommended && (
              <div className={styles.recommendedBadge}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.64134 1.18305C9.42017 0.504882 10.5798 0.504883 11.3587 1.18305L12.9651 2.58189C13.2452 2.82574 13.5857 2.98973 13.951 3.05665L16.0463 3.44048C17.0621 3.62656 17.7851 4.53322 17.7405 5.56497L17.6484 7.69311C17.6324 8.06411 17.7165 8.4326 17.8919 8.75989L18.8982 10.6374C19.3861 11.5476 19.128 12.6782 18.2936 13.2866L16.5723 14.5415C16.2723 14.7602 16.0366 15.0557 15.8901 15.397L15.0496 17.3543C14.6422 18.3032 13.5974 18.8064 12.6014 18.5333L10.5471 17.97C10.189 17.8718 9.81102 17.8718 9.45289 17.97L7.39858 18.5333C6.40263 18.8064 5.35782 18.3032 4.95036 17.3543L4.10991 15.397C3.96339 15.0557 3.72774 14.7602 3.42768 14.5415L1.70644 13.2866C0.871968 12.6782 0.613922 11.5476 1.10178 10.6374L2.10807 8.75989C2.28349 8.4326 2.3676 8.06412 2.35155 7.69311L2.25952 5.56497C2.2149 4.53322 2.93793 3.62656 3.95374 3.44048L6.04902 3.05665C6.41428 2.98973 6.75481 2.82574 7.03487 2.58188L8.64134 1.18305Z" fill="#FF491C"/>
                  <path d="M14.1391 6.89648L8.44949 12.5861L5.86328 9.99993" stroke="white" strokeWidth="1.37931" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {tp('subscription.card.recommended')}
              </div>
            )}
            <div className={styles.cardHead}>
              <div className={styles.iconWrap}>
                {tier.image_url && (
                  <img
                    src={tier.image_url as any}
                    alt={tier.display_name}
                    width={32}
                    height={32}
                    style={{ width: 40, height: 40, objectFit: 'contain' }}
                  />
                )}
              </div>
              {getDiscountPct(tier, billingCycle) > 0 && (
                <span className={styles.discount}>
                  {tp('subscription.card.save', { pct: getDiscountPct(tier, billingCycle) })}
                </span>
              )}
            </div>

            <div className={styles.cardTitle}>{tier.display_name}</div>

            <div className={styles.priceBlock}>
              <div className={styles.priceWrap}>
                {tier.original_price !== 0 && tier.original_price && tier.original_price > price && (
                  <div className={styles.originalPrice + ' ' + styles.price}>
                    ${tier.original_price.toFixed(0)}
                  </div>
                )}
                <div className={styles.mainPrice}>
                  <span className={styles.price}>${price.toFixed(0)}</span>
                  <span className={styles.per}>{tp('subscription.card.perMonth')}</span>
                </div>
              </div>
              <div className={styles.priceSub}>
                {tp('subscription.card.billed', { cycle: billingCycle })}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.includedBlock}>
              <div className={styles.creditsLine}>
                <span className={styles.creditsCount}>
                  {tp('subscription.card.creditsCount', { count: tier.credits.toLocaleString() })}{' '}
                  <span className={styles.per}>{tp('subscription.card.perMonthWord')}</span>
                </span>
                {getPerCredit(tier, billingCycle) !== null && (
                  <span className={styles.perCredit}>
                    {tp('subscription.card.perCredit', { price: `$${getPerCredit(tier, billingCycle)!.toFixed(2)}` })}
                  </span>
                )}
              </div>
              <ul className={styles.features}>
                {[
                  { label: tp('subscription.card.features.quality', { quality: toQualityLabel(String(tier.max_quality)) }) },
                  { label: tp('subscription.card.features.characterIncluded', { count: tier.character_training_included }) },
                  { label: tp('subscription.card.features.maxCharacters', { count: tier.max_characters }) },
                  { label: tp('subscription.card.features.concurrentShoots', { count: tier.concurrent_jobs }) },
                  { label: tp('subscription.card.features.commercialUse') }
                ].map((feature, idx) => (
                  <li className={styles.featureItem} key={idx}>
                    <Icon variant='checkmark' size={16} />
                    {feature.label}
                  </li>
                ))}
              </ul>
            </div>

            {renderButton ? (
              renderButton(tier, isCurrentPlan, isDisabled)
            ) : (
              isDisabled ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className={styles.selectBtn + ' ' + styles.disabled}
                        variant="primary"
                        size="sm"
                        onClick={() => handleCardClick(tier)}
                        disabled
                      >
                        {tp('subscription.card.button.select')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{tp('subscription.card.button.disabledTooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  className={styles.selectBtn}
                  variant="primary"
                  size="sm"
                  onClick={() => handleCardClick(tier)}
                  disabled={isCurrentPlan || loading}
                >
                  {isCurrentPlan 
                    ? tp('subscription.card.button.current') 
                    : (loading ? tp('subscription.card.button.processing') : tp('subscription.card.button.select'))
                  }
                </Button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

