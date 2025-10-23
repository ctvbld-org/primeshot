'use client'

import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { StickyShowcaseSection } from '../StickyShowcaseSection'
import styles from '../ShowcaseSection.module.css'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'

const cloudfrontLoader = makeCloudfrontLoader('website-images')

export function CharactersShowcase() {
  return (
    <StickyShowcaseSection 
      className={`${styles.container} ${styles.charactersContainer}`}
      panelId="characters"
      isFirst={true}
    >
        {/* Section Title */}
        <div className={styles.content}>
          <div className={styles.titleContainer}>
            <div className={styles.iconWrapper}>
              <Icon variant="primeshotSymbol" size={48} className="text-glacier" />
            </div>
            <h2 className={styles.title}>Characters</h2>
          </div>
          <p className={styles.subtitle}>
            Capture you from just 9 images of yourself. Create for you and others. 
            Your digital you ready in less than 8 mins.
          </p>
        </div>

        {/* Animated Selfies and Arrow */}
        <div className={styles.floatingImagesContainer}>
          {/* Selfie 1 - Top Left */}
          <div className={styles.floatingImage1 + ' ' + styles.floatingImage}>
              <Image
                src={getWebsiteCdnUrl("/example-selfie-6-w640.webp")}
                alt="Character selfie"
                fill
                className={styles.heroImage}
                loader={cloudfrontLoader}
              />
          </div>

          {/* Selfie 2 - Top Right */}
          <div className={styles.floatingImage2 + ' ' + styles.floatingImage}>
              <Image
                src={getWebsiteCdnUrl("/example-selfie-1-w640.webp")}
                alt="Character selfie"
                fill
                className={styles.heroImage}
                loader={cloudfrontLoader}
              />
          </div>

          {/* Selfie 3 - Bottom Center */}
          <div className={styles.floatingImage3 + ' ' + styles.floatingImage}>
              <Image
                src={getWebsiteCdnUrl("/example-selfie-3-w640.webp")}
                alt="Character selfie"
                fill
                className={styles.heroImage}
                loader={cloudfrontLoader}
              />
          </div>

          {/* Hand Drawn Arrow */}
          <div className={styles.handDrawnArrow}>
            <Icon variant="handDrawnArrow" size={80} />
          </div>
        </div>
    </StickyShowcaseSection>
  )
}

