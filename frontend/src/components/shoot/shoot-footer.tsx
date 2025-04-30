import { Button } from "@/components/ui/button"
import Image from "next/image"
import styles from './shoot-footer.module.css'
import { Icon } from "../icons/icon"
import { useState } from "react"
import { useTranslation } from 'react-i18next'

interface ShootFooterProps {
  stylesCount: number
  photosPerStyle: number
  basePrice: number
  extraStylesCount: number
  totalPhotosWithExtra: number
  upgradedPrice: number
  onCheckout: () => Promise<void> | void
}

export function ShootFooter({
  stylesCount,
  photosPerStyle,
  basePrice,
  extraStylesCount,
  totalPhotosWithExtra,
  upgradedPrice,
  onCheckout
}: ShootFooterProps) {
  const totalPhotos = stylesCount * photosPerStyle
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('styles')

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true)
    try {
      await onCheckout?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.footer}>
      <div className="mx-auto flex items-center">
        <div className={styles['footer-title-container']}>
          <span className={styles['footer-title']}>{t('footer.title')}</span>
          <span className={styles['footer-separator']}>
            <Image 
              src="/footer-separator.svg"
              alt={t('footer.separator.alt')}
              width={13}
              height={64}
              style={{ width: 'auto', height: '64px' }}
            />
          </span>
        </div>
        {stylesCount > 0 ? (
          <>
            <div className="flex items-center justify-between flex-nowrap flex-[1_1_80%] mr-10 overflow-x-auto hide-scrollbar">
              <div className={`${styles['footer-content']} flex flex-nowrap flex-[1_0_auto]`}>
                <div className={`flex items-center ${styles['footer-styles']}`}>
                  <span className="text-[#FFB45E] mr-1">{t('footer.styles.count', { count: stylesCount })}</span>
                  <span className={styles['footer-multiplier']}>{t('footer.styles.multiplier')}</span>
                  <span className="text-[#ffffff]"> {t('footer.styles.label')}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">
                    <Icon variant="camera" size={14} className={styles.icon} />
                  </span>
                  <span className="text-[#FFB45E] mr-1">{t('footer.photos.count', { count: totalPhotos })}</span>
                  <span className={styles['footer-multiplier']}>{t('footer.photos.multiplier')}</span>
                  <span className="text-[#ffffff]"> {t('footer.photos.label')}</span>
                  <span className={styles['footer-photos-per-style']}>{t('footer.photos.perStyle', { count: photosPerStyle })}</span>
                </div>

                <span className="flex flex-nowrap flex-[0_0_auto] bg-[#44E3C910] rounded-full px-3 py-2 mr-4 text-[#44E3C9]">
                  {t('footer.price.amount', { amount: basePrice / 100 })}
                </span>
              </div>
              <div className={`${styles['footer-upgrade-container']} flex flex-nowrap flex-[0_0_auto]`}>
                <Icon variant="plusFill" size={16} className="flex-[1_0_auto] text-[#FFB45E]" />
                <span className="flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.text', { count: extraStylesCount })}</span>
                <span className="text-[#FFFFFF]">{totalPhotosWithExtra}</span>
                <span className="flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.photosText')}</span>
                <span className="text-[#FFFFFF] flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.price', { amount: upgradedPrice })}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mr-10 flex-nowrap flex-[1_1_80%]">
              <Icon variant="dizzyFace" size={22} className="mr-2" />
              <div className={styles['footer-content']}>
                <span>{t('footer.emptyState')}</span>
              </div>
            </div>
          </>
        )}
        <Button 
          onClick={handleCheckout}
          variant="primary"
          className={styles.checkoutButton}
          disabled={stylesCount === 0 || loading}
          loading={loading}
        >
          {t('footer.checkout')}
        </Button>
      </div>
    </div>
  )
} 