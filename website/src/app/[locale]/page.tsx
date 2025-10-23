import { InteractiveGenerateBar, ScrollSection } from '@/components/InteractiveGenerateBar'
import { HeroGrid } from '@/components/InteractiveGenerateBar/HeroGrid'
import { 
  StylesShowcase, 
  ScenesShowcase, 
  WardrobeShowcase, 
  CharactersShowcase 
} from '@/components/InteractiveGenerateBar/ShowcaseSections'
import { initServerI18n } from '@primeshot/common'
import Image from 'next/image'
import styles from './page.module.css'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'

interface ExperiencePageProps {
  params: Promise<{ locale: string }>
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { locale } = await params
  const i18n = initServerI18n(locale)
  const t = i18n.getFixedT(locale, 'homepage')

  const cdnBase = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''

  return (
    <InteractiveGenerateBar>
        {/* Hero Section with Grid */}
        <ScrollSection id="section-hero" panel={null} className={styles.heroSection}>
          <HeroGrid />
        </ScrollSection>
      
      {/* Characters Section */}
      <ScrollSection id="section-characters" panel="characters">
        <CharactersShowcase />
      </ScrollSection>

      {/* Styles Section */}
      <ScrollSection id="section-styles" panel="styles">
        <StylesShowcase />
      </ScrollSection>

      {/* Scenes Section */}
      <ScrollSection id="section-scenes" panel="scenes">
        <ScenesShowcase />
      </ScrollSection>

      {/* Wardrobe Section */}
      <ScrollSection id="section-wardrobe" panel="wardrobe">
        <WardrobeShowcase />
      </ScrollSection>

      {/* Final CTA Section with Background */}
      <ScrollSection id="section-cta" panel="cta" className={styles.ctaSection}>
        {/* Background Image */}
        <div className={styles.backgroundContainer}>
          <Image
            src={getWebsiteCdnUrl('/explore/blindlight/15.webp')}
            alt="Background"
            fill
            className={styles.backgroundImage}
            priority
          />
          {/* Overlay */}
          <div className={styles.overlay} />
        </div>

        {/* Content */}
        <div className={styles.contentContainer}>
          <h2 className={styles.heading}>
            Ready to meet your best self?
          </h2>
          <p className={styles.paragraph}>
            Join thousands creating professional AI portraits with Primeshot
          </p>
          <a 
            href="/auth/signup"
            className={styles.ctaButton}
          >
            Get Started Now
          </a>
        </div>
      </ScrollSection>
    </InteractiveGenerateBar>
  )
}