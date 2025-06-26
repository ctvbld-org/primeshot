import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/icons/icon'
import styles from './image-tooltip.module.css'
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
  // 1. State
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 2. Memoized values
  const score = useMemo(() => Math.round(file.score || 0), [file.score])
  const isHighScore = useMemo(() => score >= 80, [score])

  const scoreContainerClasses = useMemo(() => 
    cn(
      styles.scoreContainer,
      isHighScore ? styles.scoreContainerHigh : styles.scoreContainerLow
    ),
    [isHighScore]
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