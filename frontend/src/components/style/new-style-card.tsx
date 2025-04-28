import Image from 'next/image'
import { Button } from '@/components/ui/button'
import styles from './new-style-card.module.css'
import { Icon } from '@/components/icons/icon'

interface NewStyleCardProps {
  onClick: () => void,
  className?: string
}

export function NewStyleCard({ 
  onClick,
  className
}: NewStyleCardProps) {
  return (
    <div className={`${styles['empty-state-card']} ${className}`} onClick={onClick} role="region" aria-label="Add new style card" >
      <div className={styles['top-card']}>
        <Image
          src="/add-new-style.png"
          alt="Add new style"
          width={156}
          height={156}
          className={styles['tshirt-image']}
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
          Choose your photographic style,<br />
          background and clothing.
        </p>

        <Button variant="outline" className={`${styles['add-style']} pointer-events-none`} aria-label="Add a new photography style">
          Add Style
        </Button>
      </div>
    </div>
  )
} 