'use client'

import React, { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './GalleryPlaceholder.module.css'
import { InferenceJobGroup } from './InferenceJobGroup'
import { useInferenceQueue } from '@/contexts/inference-queue-context'
import { useInfiniteScroll } from '@/hooks/useLazyLoading'

export function GalleryPlaceholder() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { 
    jobs, 
    totalCount, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    loadMore 
  } = useInferenceQueue()
  
  // Memoized callback for infinite scroll
  const handleInfiniteScroll = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // Infinite scroll trigger
  const { ref: loadMoreRef } = useInfiniteScroll(handleInfiniteScroll, {
    rootMargin: '300px',
    threshold: 0.1
  })

  if (isLoading || authLoading) {
    return (
      <div className={styles.generatedSection}>
        <div className={styles.jobsList}>
          {[0, 1].map((i) => (
            <div className={styles.jobGroup} key={`skeleton-${i}`}>
              <div className={styles.jobHeader}>
                <div className={styles.jobTitle}>
                  <div className={styles.titleRow}>
                    <Skeleton className={styles.skeletonTitle} />
                    <Skeleton className={styles.skeletonIcon} aria-hidden />
                    <Skeleton className={styles.skeletonSubtitle} />
                  </div>
                  <div className={styles.jobMeta}>
                    <Skeleton className={styles.skeletonMeta} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className={styles.errorState}>
        <p>Failed to load inference jobs: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  // Authenticated with no inference jobs -> show the same placeholder
  if (isAuthenticated && totalCount === 0 && !authLoading) {
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
      <div className={styles.generatedSection}>
        {/* Job groups for active/recent jobs */}
        {jobs.length > 0 && (
          <div className={styles.jobsList}>
            {jobs.map((job, index) => (
              <InferenceJobGroup
                key={job.id}
                job={job}
                shootNumber={totalCount - index} // Proper numbering based on total count
              />
            ))}
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className={styles.loadMoreTrigger}>
                {isLoadingMore ? (
                  <div className={styles.loadingMore}>
                    <Skeleton className={styles.loadingSkeleton} />
                    <p>Loading more shoots...</p>
                  </div>
                ) : (
                  <div className={styles.loadingMore}>
                    <p>Loading more shoots...</p>
                  </div>
                )}
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && jobs.length > 0 && (
              <div className={styles.endOfList}>
                <p>You've reached the end of your shoots</p>
              </div>
            )}
          </div>
        )}
      </div>
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