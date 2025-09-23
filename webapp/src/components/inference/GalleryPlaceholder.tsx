'use client'

import React, { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './GalleryPlaceholder.module.css'
import stylesInference from './InferenceJobGroup.module.css'
import stylesThumbnail from './InferenceThumbnail.module.css'
import { InferenceJobGroup } from './InferenceJobGroup'
import { useInferenceQueue } from '@/contexts/inference-queue-context'
import { useInfiniteScroll } from '@/hooks/useLazyLoading'
import { useStyles } from '@/hooks/useConfig'
import { getStyleImages } from '@/lib/utils/get-styles-images'

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
  const { data: styleConfigs = [] } = useStyles()
  const imageUrls = React.useMemo(() => {
    if (!styleConfigs || styleConfigs.length === 0) return [null, null, null] as (string | null)[]
    const firstThree = styleConfigs.slice(0, 3)
    const urls = firstThree.map((s: any) => {
      const first = s?.preview_images?.[0]
      if (!first) return null
      const list = getStyleImages([first])
      return list[0] ?? null
    }) as (string | null)[]
    while (urls.length < 3) urls.push(null)
    return urls
  }, [styleConfigs])
  
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
          <div className={stylesInference.jobGroup}>
            <div className={stylesInference.jobHeader}>
              <div className={stylesInference.jobTitle}>
                <div className={stylesInference.titleRow}>
                  <Skeleton className={stylesInference.shootTitle} style={{ background: 'rgba(42, 222, 216, 0.1)', borderRadius: '6px', width: '60px', height: '20px' }} />         
                  <Skeleton className={stylesInference.dotsMenuButton}><Icon variant="dotsMenu" size={16} style={{ opacity: '0.5' }} /></Skeleton>
                  <Skeleton className={stylesInference.jobSubtitle} style={{ background: 'rgba(42, 222, 216, 0.1)', borderRadius: '6px', width: '220px', height: '14px' }} />
                </div>
                <div className={stylesInference.jobMeta}>
                  <Skeleton className={stylesInference.timeAgo} style={{ background: 'rgba(42, 222, 216, 0.1)', borderRadius: '6px', width: '40px', height: '12px' }} />
                </div>
              </div>
            </div>
            <div className={stylesInference.mobileHeroWrap}>
              {[0].map((i) => (
                <div className={stylesInference.mobileHero + ' ' + stylesInference.ar11} key={'thumbnail-placeholder-' + i}>
                  <div className={`${stylesInference.heroAspect}`}>
                    <Skeleton className={stylesThumbnail.gradientLoader} style={{ opacity: '0.3' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className={stylesInference.thumbnailGrid}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div className={stylesThumbnail.thumbnail} style={{ ['--stagger' as any]: i,  pointerEvents: 'none' }} key={'thumbnail-placeholder-' + i}>
                  <div className={`${stylesThumbnail.imageContainer} ${stylesThumbnail.statusGenerating}`} style={{pointerEvents: 'none'}}>
                    <Skeleton className={stylesThumbnail.gradientLoader} style={{ opacity: '0.1', pointerEvents: 'none' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  if (isAuthenticated && totalCount !== 0 ) {
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
                    <p>
                      <span>Loading more shoots</span>
                      <span className={styles.dots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className={styles.loadingMore}>
                    <p>
                      <span>Loading more shoots</span>
                      <span className={styles.dots}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                      </span>
                    </p>
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

  // Authenticated with no inference jobs -> show the same placeholder
  if (!authLoading) {
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
                <div
                  className={styles.stripSide + ' ' + styles.stripSideLeft}
                  style={imageUrls[2] ? { backgroundImage: `url(${imageUrls[2]})`, backgroundSize: 'cover', backgroundPosition: '50% 30%', backgroundRepeat: 'no-repeat' } : undefined}
                />
                <div
                  className={styles.stripMain}
                  style={imageUrls[0] ? { backgroundImage: `url(${imageUrls[0]})`, backgroundSize: 'cover', backgroundPosition: '50% 30%', backgroundRepeat: 'no-repeat' } : undefined}
                />
                <div
                  className={styles.stripSide + ' ' + styles.stripSideRight}
                  style={imageUrls[1] ? { backgroundImage: `url(${imageUrls[1]})`, backgroundSize: 'cover', backgroundPosition: '50% 30%', backgroundRepeat: 'no-repeat' } : undefined}
                />
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
                <div
                  className={styles.characterImage + ' ' + styles.scatter1}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-1-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div
                  className={styles.characterImage + ' ' + styles.scatter2}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-2-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div
                  className={styles.characterImage + ' ' + styles.scatter3}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-3-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div
                  className={styles.characterImage + ' ' + styles.scatter4}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-4-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div
                  className={styles.characterImage + ' ' + styles.scatter5}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-5-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div
                  className={styles.characterImage + ' ' + styles.scatter6}
                  style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/example-selfie-6-w320.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
                <div className={styles.centerBubble}>
                  <Icon variant="primeshotSymbol" size={48} className={styles.centerIcon} />
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
                <div className={styles.portrait} />
                <div className={styles.accentBlock}>
                  <Icon variant="generate" size={30} className={styles.bolt} />
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
}