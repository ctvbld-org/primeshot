'use client'

import { Skeleton } from '@/components/ui/skeleton'
import styles from './requirements.module.css'

export function UploadRequirementsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonHeaderCol}>
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className={styles.skeletonHeaderCol}>
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-full h-4" />
        </div>
      </div>

      <Skeleton className={styles.skeletonImage} />

      <div className={styles.skeletonSection}>
        <div className={styles.skeletonHeaderCol}>
          <Skeleton className="w-40 h-6" />
        </div>
        <div className={styles.skeletonList}>
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className={styles.skeletonItem}>
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="w-full h-4" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="w-full h-[120px] rounded-[16px]" />

      <div className={styles.skeletonSection}>
        <div className={styles.skeletonHeaderCol}>
          <Skeleton className="w-40 h-6" />
        </div>
        <div className={styles.skeletonList}>
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className={styles.skeletonDodontItem}>
              <div className={styles.skeletonDodontHeader}>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <Skeleton className="w-full h-4" />
              </div>
              <div className={styles.skeletonDodontImages}>
                <Skeleton className={styles.skeletonDodontImage} />
                <Skeleton className={styles.skeletonDodontImage} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 