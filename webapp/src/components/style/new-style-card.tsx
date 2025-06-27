import Image from 'next/image'
import { Button } from '@primeshot/common/web/ui/button'
import styles from './new-style-card.module.css'
import { Icon } from '@/components/icons/icon'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '../animations/TiltCard'
import { useState } from 'react'

interface NewStyleCardProps {
  onClick: () => void,
  className?: string
}

export function NewStyleCard({ 
  onClick,
  className
}: NewStyleCardProps) {
  const { t } = useTranslation('styles')
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    onClick?.()
  }

  return (
      <TiltCard 
        className={`${styles['empty-state-card']} ${className}`} 
        onClick={onClick} 
        role="region" 
        aria-label={t('newStyle.card.ariaLabel')}
    >
      <div className={styles['top-card']}>
        <Image
          src="/t-shirt.png"
          alt={t('newStyle.card.alt')}
          width={156}
          height={156}
          className={styles['tshirt-image']}
          style={{ height: 'auto' }}
          priority
        />
      </div>
      <div className={styles['bottom-card']}>
        <div className={styles['icon-group']}>
          <Icon
            variant="background"
            size={20}
            className={styles.icon}
            aria-hidden="true"
          />
          <Icon
            variant="clothingColor"
            size={20}
            className={styles.icon}
            aria-hidden="true"
          />
          <Icon
            variant="clothing"
            size={20}
            className={styles.icon}
            aria-hidden="true"
          />
        </div>

        <p className={styles.text}>
          {t('newStyle.card.description')}
        </p>

        <Button 
          variant="outline" 
          className={`${styles['add-style']}`} 
          aria-label={t('newStyle.card.buttonAriaLabel')}
          loading={isLoading}
          onClick={handleClick}
        >
          {t('newStyle.card.button')}
        </Button>
      </div>
    </TiltCard>
  )
} 