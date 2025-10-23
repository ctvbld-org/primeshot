import { InteractiveGenerateBar, ScrollSection } from '@/components/InteractiveGenerateBar'
import { HeroGrid } from '@/components/InteractiveGenerateBar/HeroGrid'
import { 
  StylesShowcase, 
  ScenesShowcase, 
  WardrobeShowcase, 
  CharactersShowcase 
} from '@/components/InteractiveGenerateBar/ShowcaseSections'
import { CTASection } from '@/components/CTASection'
import { initServerI18n } from '@primeshot/common'
import styles from './page.module.css'

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
        <CTASection />
      </ScrollSection>
    </InteractiveGenerateBar>
  )
}