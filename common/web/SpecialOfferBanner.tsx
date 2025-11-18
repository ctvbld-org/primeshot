'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { CountdownTimer } from './CountdownTimer'
import styles from './PricingCards.module.css'

export interface SpecialOfferBannerProps {
  className?: string
}

export function SpecialOfferBanner({ className }: SpecialOfferBannerProps) {
  const { t } = useTranslation('pricing')
  const tp = (k: string, o?: any) => String((t as any)(k, o))

  // Black Friday sale ends November 29, 2025 at 11:59 PM PST
  const saleEndDate = new Date('2025-11-29T23:59:59-08:00')

  return (
    <div className={`${styles.specialOfferBanner} ${className || ''}`}>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}>
            <svg width="49" height="65" viewBox="0 0 49 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.23185 39.0703C10.2217 41.8899 11.7574 44.4868 13.7509 46.7129C15.7445 48.9392 18.1576 50.7509 20.8514 52.0448C23.5452 53.3387 26.4677 54.0899 29.4516 54.2545C32.4353 54.4189 35.4223 53.9944 38.2419 53.0047L41.4824 62.2356C37.4505 63.6509 33.1794 64.2586 28.9129 64.0234C24.6461 63.7882 20.4668 62.7151 16.6148 60.865C12.7628 59.0148 9.31297 56.4232 6.46225 53.2397C3.61166 50.0564 1.41543 46.343 9.19681e-09 42.3112L9.23185 39.0703ZM47.7868 21.4443C50.253 28.4694 46.557 36.1639 39.5319 38.6302L33.9323 40.5959L32.2904 35.9187L41.4504 32.7031L32.3505 6.78132L41.5105 3.5657L47.7868 21.4443ZM13.1808 0.352026C16.4149 -0.783308 19.9567 0.918079 21.0921 4.15209C22.2275 7.38618 20.5262 10.9281 17.2921 12.0635C14.058 13.1987 10.516 11.4974 9.38069 8.26339C8.24547 5.0294 9.94677 1.48743 13.1808 0.352026Z" fill="#2ADED8"/>
            </svg>
          </div>
          <div className={styles.bannerContent}>
            <h2 className={styles.bannerTitle}>
              <span className={styles.bannerTitlePrimary}>{tp('subscription.banner.titlePrimary')}</span>
              <span className={styles.bannerTitleSecondary}>{tp('subscription.banner.titleSecondary')}</span>
            </h2>
            <div className={styles.bannerDescriptionWrapper}>
              <p className={styles.bannerDescription}>
                {tp('subscription.banner.descriptionPrefix')}
                <span className={styles.bannerHighlight1}>{tp('subscription.banner.discount1')}</span>
                {tp('subscription.banner.descriptionMiddle')}
                <span className={styles.bannerHighlight2}>{tp('subscription.banner.discount2')}</span>
                {tp('subscription.banner.descriptionSuffix')}
              </p>
              <small className={styles.bannerSmall}>{tp('subscription.banner.small')}</small>
            </div>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <CountdownTimer targetDate={saleEndDate} className={styles.bannerCountdown} />
        </div>
      </div>
    </div>
  )
}

