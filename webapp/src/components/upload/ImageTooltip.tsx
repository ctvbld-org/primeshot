import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon } from '@primeshot/common/web/Icon'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip'
import { useTranslation } from 'react-i18next'
import styles from './ImageTooltip.module.css'
import type { FileWithScore } from '@/lib/types'

interface ImageTooltipProps {
  file: FileWithScore
  fileUrl: string
  onClose: () => void
  onDelete: () => void
}

export function ImageTooltip({
  file,
  fileUrl,
  onClose,
  onDelete
}: ImageTooltipProps) {
  const { t } = useTranslation('character')
  
  // 1. State
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 2. Memoized values
  const score = useMemo(() => Math.round(file.score || 0), [file.score])

  // Get all quality scores for tooltip
  const qualityScores = useMemo(() => {
    if (!file || score === 0) return null
    
    return [
      { name: 'Brightness', value: file.brightnessScore ?? 100, key: 'quality.scores.brightness' },
      { name: 'Contrast', value: file.contrastScore ?? 100, key: 'quality.scores.contrast' },
      { name: 'Saturation', value: file.saturationScore ?? 100, key: 'quality.scores.saturation' },
      { name: 'Sharpness', value: file.blurScore ?? 100, key: 'quality.scores.sharpness' }
    ]
  }, [score, file])

  const scoreContainerClasses = useMemo(() => 
    cn(
      styles.scoreContainer,
      score >= 75 ? styles.scoreContainerHigh : score >= 60 ? styles.scoreContainerMedium : styles.scoreContainerLow
    ),
    [score]
  )

  const deleteButtonClasses = useMemo(() => 
    cn(
      styles.deleteButton,
      confirmDelete && styles.deleteButtonConfirm
    ),
    [confirmDelete]
  )

  // 3. Callbacks
  const handleDeleteClick = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true)
    } else {
      onDelete()
    }
  }, [confirmDelete, onDelete])

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    if (confirmDelete) {
      e.stopPropagation()
      setConfirmDelete(false)
    }
  }, [confirmDelete])

  // 4. Render
  return (
    <div className={styles.tooltip} onClick={handleClickOutside}>
      <div className={styles.imageContainer}>
        <img
          src={fileUrl}
          alt={`Preview of ${file.name}`}
          className={styles.image}
          loading="lazy"
        />
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close preview"
        >
          <Icon variant="cross" size={16} className={styles.closeIcon} />
        </button>
        <div className={scoreContainerClasses}>
          <Icon variant="check" size={20} className={styles.scoreIcon} />
          <span className={styles.scoreText}>
            {score}%
          </span>
          {qualityScores && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={styles.infoIcon} size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {qualityScores.map((scoreItem, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>{t(scoreItem.key)}:</span>
                        <span style={{ fontWeight: 500 }}>{Math.round(scoreItem.value)}%</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.infoContent}>
          <div className={styles.fileInfo}>
            <p className={styles.fileName} title={file.name}>
              {file.name}
            </p>
            <p className={styles.fileSize}>
              {file.size ? formatFileSize(file.size) : ''}
            </p>
          </div>
          <Button
            variant={confirmDelete ? "destructive" : "ghost"}
            size="sm"
            className={deleteButtonClasses}
            onClick={handleDeleteClick}
            aria-label={confirmDelete ? "Confirm delete" : "Delete"}
          >
            <span className={styles.deleteText}>
              {confirmDelete ? "Confirm" : "Delete"}
            </span>
            <Icon 
              variant="bin" 
              size={16} 
              className={styles.deleteIcon}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </div>
  )
} 