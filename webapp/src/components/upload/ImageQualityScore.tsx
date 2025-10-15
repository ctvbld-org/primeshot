'use client'

import React, { useState, useEffect } from 'react'
import { ImageQualityResult } from '@/lib/image-quality'
import Image from 'next/image'
import { FileIcon } from 'lucide-react'
import { Icon } from '@primeshot/common/web/Icon'
import styles from './ImageQualityScore.module.css'
import type { FileWithScore } from '@/lib/types'
import { useTranslation } from 'react-i18next'

interface ImageQualityScoreProps {
  file: FileWithScore
  result: ImageQualityResult
  onRemove?: () => void
  isUploading: boolean
  progress: number
  variant?: 'accepted' | 'rejected'
}

export function ImageQualityScore({
  file,
  result,
  onRemove,
  isUploading,
  progress,
  variant
}: ImageQualityScoreProps) {
  const { t } = useTranslation('character')
  const [fileUrl, setFileUrl] = useState<string>('')

  useEffect(() => {
    if (file.isExisting && file.url) {
      setFileUrl(file.url)
    } else if (!file.isExisting) {
      const url = URL.createObjectURL(file as File)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  if (!result) {
    return (
      <div className={styles.notAvailable}>
        Quality analysis not available
      </div>
    )
  }

  const getProgressClass = (score: number) => {
    if (score >= 70) return styles.progressHigh
    if (score >= 50) return styles.progressMedium
    return styles.progressLow
  }

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.headerContainer}>
            <div className={styles.image}>
              {fileUrl ? (
                <Image
                  src={fileUrl}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <FileIcon className={styles.fileIcon} />
              )}
            </div>
            <div className={styles.fileInfo}>
              <p className={styles.fileName}>{file.name}</p>
              <span className={styles.qualityScore}>{Math.round(result.score)}%</span>
            </div>
          </div>

          {((result.i18nIssues && result.i18nIssues.length > 0) || result.issues.length > 0) && (
            <ul className={styles.issuesContainer}>
              {result.i18nIssues && result.i18nIssues.length > 0 ? (
                // Prefer i18n translated issues
                result.i18nIssues.map((issue, i) => (
                  <li key={i} className={styles.issueItem}>
                    <Icon variant="cross" size={16} className={styles.issueIcon} />
                    <span>{t(issue.key, issue.params || {})}</span>
                  </li>
                ))
              ) : (
                // Fallback to legacy string issues if i18nIssues not available
                result.issues.map((issue, i) => (
                  <li key={i} className={styles.issueItem}>
                    <svg className={styles.issueIcon} width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.00195 1.00098C8.98732 0.995517 9.96441 1.18432 10.876 1.55859C11.7889 1.93349 12.6185 2.48669 13.3164 3.18457C14.0142 3.88245 14.5666 4.71207 14.9414 5.625C15.3155 6.53611 15.5053 7.51222 15.5 8.49707L15.4932 8.86621C15.4558 9.72735 15.2695 10.5769 14.9414 11.376C14.5665 12.2889 14.0143 13.1186 13.3164 13.8164C12.6186 14.5143 11.7889 15.0665 10.876 15.4414C9.96441 15.8157 8.98732 16.0045 8.00195 15.999L8.00293 16L8 15.999L7.99707 16V15.999C7.01222 16.0043 6.03611 15.8155 5.125 15.4414C4.21207 15.0666 3.38245 14.5142 2.68457 13.8164C1.98669 13.1185 1.43349 12.2889 1.05859 11.376C0.6837 10.4629 0.493885 9.48409 0.5 8.49707C0.494708 7.51225 0.684567 6.53608 1.05859 5.625C1.43349 4.71192 1.98662 3.88252 2.68457 3.18457C3.38252 2.48662 4.21192 1.93349 5.125 1.55859C6.03609 1.18457 7.01225 0.995684 7.99707 1.00098V1L8 1.00098L8.00293 1L8.00195 1.00098ZM5.20703 5.77734L10.7217 11.293L10.793 11.2217L5.27734 5.70703L5.20703 5.77734Z" fill="#C0CED8" fillOpacity="0.6" stroke="#0C1013"/>
                    </svg>
                    <span>{issue}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 