import Image from 'next/image'
import { Button } from '@/components/ui/button'
import styles from './new-style-card.module.css'

interface NewStyleCardProps {
  onClick: () => void
}

export function NewStyleCard({ onClick }: NewStyleCardProps) {
  return (
    <div className={styles['empty-state-card']} onClick={onClick}>
      <div className={styles['top-card']}>
        <Image
          src="/add-new-style.png"
          alt="Add new style"
          width={156}
          height={156}
          className={styles['tshirt-image']}
        />
      </div>
      <div className={styles['bottom-card']}>
        <div className={styles['icon-group']}>
          <Image
            src="/background-icon.svg"
            alt="Background"
            width={20}
            height={20}
            className={styles.icon}
          />
          <Image
            src="/style-icon.svg"
            alt="Photography style"
            width={20}
            height={20}
            className={styles.icon}
          />
          <Image
            src="/clothing-icon.svg"
            alt="Clothing"
            width={20}
            height={20}
            className={styles.icon}
          />
        </div>

        <p className={styles.text}>
          Choose your photographic style,<br />
          background and clothing.
        </p>

        <Button variant="secondary" className={styles['add-style']}>
          Add Style
        </Button>
      </div>
    </div>
  )
} 