'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@primeshot/common/web/Icon'
import { useHtmlTranslation } from '@/hooks/useHtmlTranslation'
import layoutStyles from '../CharacterTrainingDialog.module.css'
import styles from './onboarding.module.css'

type StepKind = 'onboarding-intro' | 'onboarding-guidelines' | 'onboarding-confirmation'

export interface GuidelineItem {
  id: string
  title: string
  description: string
  description2?: string
  icon: string
  images: Array<{ src: string; alt: string }>
}

interface OnboardingStepProps {
  step: StepKind
  guidelineIndex: number
  guidelines: GuidelineItem[]
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
  showSkipButton?: boolean
}

export function OnboardingStep({ step, guidelineIndex, guidelines, onNext, onBack, onSkip, onFinish, showSkipButton = true }: OnboardingStepProps) {
  const { t } = useTranslation('character')
  const introDescription = useHtmlTranslation('onboarding.intro.description1', 'character')
  const confirmationTitle = useHtmlTranslation('onboarding.confirmation.title', 'character')
  const [imagesLoaded, setImagesLoaded] = React.useState(false)
  const [animatingOut, setAnimatingOut] = React.useState(false)
  const [fadeKey, setFadeKey] = React.useState(0)

  const cdn = (process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '').replace(/\/$/, '')
  const floatingImageUrls = React.useMemo(() => ([
    `${cdn}/app-images/character-onboarding/onboard-character-1-w320.webp`,
    `${cdn}/app-images/character-onboarding/onboard-character-2-w320.webp`,
    `${cdn}/app-images/character-onboarding/onboard-character-3-w320.webp`,
    `${cdn}/app-images/character-onboarding/onboard-character-4-w320.webp`,
    `${cdn}/app-images/character-onboarding/onboard-character-5-w320.webp`,
    `${cdn}/app-images/character-onboarding/onboard-character-6-w320.webp`
  ]), [cdn])

  React.useEffect(() => {
    // Preload intro images once
    Promise.all(floatingImageUrls.map(u => new Promise(res => { const i = new Image(); i.onload = () => res(u); i.src = u }))).then(() => setImagesLoaded(true))
  }, [floatingImageUrls])

  // Floating images geometry
  const floatingImages = React.useMemo(() => ([
    { id: 1, top: '10%', left: '15%', zIndex: 1, finalRotation: -12, slideOut: { x: -120, y: 0 } },
    { id: 2, top: '25%', right: '15%', zIndex: 1, finalRotation: 8,  slideOut: { x: 120, y: -95 } },
    { id: 3, top: '45%', right: '20%', zIndex: 2, finalRotation: -6,  slideOut: { x: 170, y: -70 } },
    { id: 4, bottom: '25%', right: '15%', zIndex: 3, finalRotation: 15, slideOut: { x: 120, y: 80 } },
    { id: 5, bottom: '15%', left: '15%', zIndex: 3, finalRotation: -18, slideOut: { x: -130, y: 30 } },
    { id: 6, top: '40%', left: '20%', zIndex: 2, finalRotation: 12, slideOut: { x: -175, y: -30 } }
  ]), [])

  const handleIntroNext = () => {
    // Start reverse animation and advance step immediately so content loads during animation
    setAnimatingOut(true)
    onNext()
    setTimeout(() => { setAnimatingOut(false) }, 700)
  }

  // fade content on step change
  React.useEffect(() => {
    // Only remount/fade when switching step kind; keep guideline sub-steps mounted
    setFadeKey(k => k + 1)
  }, [step])

  return (
    <div className={layoutStyles.stepCentered}>
      <div className={styles.floatingWrapper}>
        {(step === 'onboarding-intro' || animatingOut) && imagesLoaded && floatingImages.map((img, idx) => (
          <div
            key={img.id}
            className={`${styles.floatingImage} ${animatingOut ? styles.animateCardSlideReverse : styles.animateCardSlide}`}
            style={{
              '--final-rotation': `${img.finalRotation}deg`,
              '--slide-x': `${img.slideOut.x}px`,
              '--slide-y': `${img.slideOut.y}px`,
              top: (img as any).top,
              left: (img as any).left,
              right: (img as any).right,
              bottom: (img as any).bottom,
              transformOrigin: 'center center',
              zIndex: (img as any).zIndex,
              opacity: 1
            } as React.CSSProperties}
          >
            <img src={floatingImageUrls[idx % floatingImageUrls.length]} alt={t('onboarding.floatingAlt', { id: img.id })} className={styles.imgCover} />
          </div>
        ))}

        {/* Card stays mounted; only inner content fades */}
        <div className={styles.card}>
          <div key={fadeKey} className={`${styles.fadeSwap} ${styles.fadeIn}`}>
            {step === 'onboarding-intro' && (
              <div className={styles.centerText}>
                <div className={styles.logo}>
                  <Icon variant="primeshotSymbol" size={38} className={styles.aquaText} />
                </div>
                <h2 className={styles.title}>{t('onboarding.intro.title')}</h2>
                <p className={styles.description}>
                  {introDescription}
                </p>
                <p className={styles.descriptionTight}>{t('onboarding.intro.description2')}</p>
                <div className={styles.privacyBox}>
                  <Icon variant="secure" size={16} />
                  <span className="text-xs font-medium"> {t('onboarding.intro.privacy')}</span>
                </div>
                <div className={styles.buttonContainer}>
                  <Button variant="outline" onClick={handleIntroNext} className={styles.primaryButton}>
                    <span className="relative z-10">{t('onboarding.intro.buttonGetStarted')}</span>
                  </Button>
                  {showSkipButton && (
                    <Button variant="ghost" onClick={onSkip} className={styles.ghostButton}>{t('onboarding.intro.buttonSkip')}</Button>
                  )}
                </div>
              </div>
            )}

            {step === 'onboarding-guidelines' && (
              <div className={styles.centerText}>
                <div className={styles.logo}>
                  <div className={styles.logoIconWrap}>
                    <Icon variant={guidelines[guidelineIndex].icon as any} size={48} className={styles.aquaText} />
                  </div>
                </div>
                <h2 className={styles.title}>{guidelines[guidelineIndex].title}</h2>
                <p className={styles.description}>{guidelines[guidelineIndex].description}{guidelines[guidelineIndex].description2 && <span className="text-[#FF4242]">{guidelines[guidelineIndex].description2}</span>}</p>
                <div className={styles.compareRow}>
                  <div className={styles.compareItem}>
                    <div className={styles.imageBox}>
                      <img src={guidelines[guidelineIndex].images[0].src} alt={guidelines[guidelineIndex].images[0].alt} className={styles.imgCover} />
                    </div>
                    <div className={styles.goodLabel}><Icon variant="checkmark" size={20} /></div>
                  </div>
                  <div className={styles.compareItem}>
                    <div className={styles.imageBox}>
                      <img src={guidelines[guidelineIndex].images[1].src} alt={guidelines[guidelineIndex].images[1].alt} className={styles.imgCover} />
                    </div>
                    <div className={styles.badLabel}><Icon variant="cross" size={20} /></div>
                  </div>
                </div>

                {/* Progress button (keeps same logic; last guideline fills on click) */}
                <GuidelineProgressButton
                  index={guidelineIndex}
                  totalGuidelines={guidelines.length}
                  onComplete={onNext}
                />
              </div>
            )}

            {step === 'onboarding-confirmation' && (
              <div className={styles.confirmContent}>
                <div className={styles.confirmIconWrap}>
                  <Icon variant="diamond" size={48} className='text-[#2ADED8]' />
                </div>
                <h2 className={styles.title}>{confirmationTitle}</h2>
                <div className={styles.description} style={{ marginBottom: '2rem' }}>
                  <p style={{ marginBottom: '2rem' }}>{t('onboarding.confirmation.paragraph1')}</p>
                  <p>{t('onboarding.confirmation.paragraph2')}</p>
                </div>
                <Button variant="primary" onClick={onFinish} className="w-full">{t('onboarding.confirmation.buttonStart')}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GuidelineProgressButton({ index, totalGuidelines, onComplete }: { index: number; totalGuidelines: number; onComplete: () => void }) {
  const { t } = useTranslation('character')
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const [animatedProgress, setAnimatedProgress] = React.useState(0)
  const [rafId, setRafId] = React.useState<number | null>(null)

  const isLastGuideline = index === totalGuidelines - 1
  const totalSegments = totalGuidelines + 1 // exclude intro, include confirmation

  const animateTo = (fromValue: number, target: number) => {
    if (rafId) cancelAnimationFrame(rafId)
    const start = Date.now()
    const dur = 500
    const from = fromValue
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const val = from + (target - from) * ease
      setAnimatedProgress(val)
      if (p < 1) setRafId(requestAnimationFrame(tick))
      else setAnimatedProgress(target)
    }
    setRafId(requestAnimationFrame(tick))
  }

  React.useEffect(() => {
    // Animate across guideline segments + confirmation segment
    const nextFraction = isLastGuideline
      ? (isTransitioning ? 1 : ((index + 1) / totalSegments)) // move to last guideline segment; fill to 100% on click
      : ((index + 1) / totalSegments)
    const from = animatedProgress
    animateTo(from, nextFraction * 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, totalSegments, isTransitioning, isLastGuideline])

  const handleClick = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      onComplete()
      setIsTransitioning(false)
    }, 500)
  }

  const color = '#44E3C9'

  return (
    <div className="flex-1 w-full">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isTransitioning}
        className={styles.progressButton}
        style={{
          background: `linear-gradient(to right, ${color}20 0%, ${color}20 ${animatedProgress}%, transparent ${animatedProgress}%)`
        }}
      >
        <span className="relative z-10">{isLastGuideline && isTransitioning ? t('onboarding.confirmation.buttonStart') : t('onboarding.buttons.next')}</span>
      </Button>
    </div>
  )
}

export default OnboardingStep


