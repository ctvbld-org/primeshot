'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { Icon } from '@/components/icons/icon'
import styles from './GalleryPlaceholder.module.css'
import { useInferenceJobsCount } from '@/lib/hooks/use-inference-jobs-count'

export function GalleryPlaceholder() {
  const { isAuthenticated, isLoading } = useAuth()
  const { count: jobsCount, isLoading: jobsLoading } = useInferenceJobsCount()

  if (isLoading) {
    return (
      <div className={styles.skeletonWrapper}>
        <Skeleton className={styles.skeleton} />
      </div>
    )
  }

  // Authenticated with no inference jobs -> show the same placeholder
  if (isAuthenticated && !jobsLoading && jobsCount === 0) {
    return (
      <div className={styles.placeholderCard} role="region" aria-label="How it works">
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.badge} aria-hidden>
              <span>1</span>
            </div>
            <h3 className={styles.title}>Choose a style</h3>
            <div className={styles.visual} aria-hidden>
              <div className={styles.strip}>
                <div className={styles.stripSide} />
                <div className={styles.stripMain} />
                <div className={styles.stripOverlay} />
              </div>
            </div>
            <p className={styles.desc}>Pick the mood, scene, and outfit that fit your look.</p>
          </div>

          <div className={styles.step}>
            <div className={styles.badge} aria-hidden>
              <span>2</span>
            </div>
            <h3 className={styles.title}>Create a Character</h3>
            <div className={styles.visual} aria-hidden>
              <div className={styles.characterVisual}>
                <div className={styles.scatterLeft} />
                <div className={styles.scatterRight} />
                <div className={styles.centerBubble}>
                  <Icon variant="smilyFace" size={48} className={styles.centerIcon} />
                </div>
              </div>
            </div>
            <p className={styles.desc}>Upload a few photos so our AI learns exactly what makes you, you.</p>
          </div>

          <div className={styles.step}>
            <div className={styles.badge} aria-hidden>
              <span>3</span>
            </div>
            <h3 className={styles.title}>Generate your shoot</h3>
            <div className={styles.visual} aria-hidden>
              <div className={styles.generateRow}>
                <div className={styles.portrait} />
                <div className={styles.accentBlock}>
                  <div className={styles.bolt} />
                </div>
                <div className={styles.emptyBlock} />
                <div className={styles.emptyBlock} />
              </div>
            </div>
            <p className={styles.desc}>Get your portraits in minutes — authentic, polished, and ready to use.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className={styles.generatedStub}>Generated images will appear here (stub)</div>
    )
  }

  return (
    <div className={styles.placeholderCard} role="region" aria-label="How it works">
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.badge} aria-hidden>
            <span>1</span>
          </div>
          <h3 className={styles.title}>Choose a style</h3>
          <div className={styles.visual} aria-hidden>
            <div className={styles.strip}>
              <div className={styles.stripSide} />
              <div className={styles.stripMain} />
              <div className={styles.stripOverlay} />
            </div>
          </div>
          <p className={styles.desc}>Pick the mood, scene, and outfit that fit your look.</p>
        </div>

        <div className={styles.step}>
          <div className={styles.badge} aria-hidden>
            <span>2</span>
          </div>
          <h3 className={styles.title}>Create a Character</h3>
          <div className={styles.visual} aria-hidden>
            <div className={styles.characterVisual}>
              <div className={styles.scatterLeft} />
              <div className={styles.scatterRight} />
              <div className={styles.centerBubble}>
                <Icon variant="smilyFace" size={48} className={styles.centerIcon} />
              </div>
            </div>
          </div>
          <p className={styles.desc}>Upload a few photos so our AI learns exactly what makes you, you.</p>
        </div>

        <div className={styles.step}>
          <div className={styles.badge} aria-hidden>
            <span>3</span>
          </div>
          <h3 className={styles.title}>Generate your shoot</h3>
          <div className={styles.visual} aria-hidden>
            <div className={styles.generateRow}>
              <div className={styles.portrait} />
              <div className={styles.accentBlock}>
                <div className={styles.bolt} />
              </div>
              <div className={styles.emptyBlock} />
              <div className={styles.emptyBlock} />
            </div>
          </div>
          <p className={styles.desc}>Get your portraits in minutes — authentic, polished, and ready to use.</p>
        </div>
      </div>
    </div>
  )
}