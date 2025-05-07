import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'
import { ImageQualityResult } from '@/lib/image-quality'
import { cn } from '@/lib/utils'
import { X, Check } from 'lucide-react'
import { Icon } from '@/components/icons/icon'
import styles from './image-tooltip.module.css'

interface ImageTooltipProps {
  file: File
  result: ImageQualityResult
  fileUrl: string
  onClose: () => void
  onDelete: () => void
}

export function ImageTooltip({
  file,
  result,
  fileUrl,
  onClose,
  onDelete
}: ImageTooltipProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
    } else {
      onDelete()
    }
  }

  // Reset delete confirmation when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (confirmDelete) {
      e.stopPropagation()
      setConfirmDelete(false)
    }
  }

  const score = Math.round(result?.score || 0)
  const isHighScore = score >= 80

  return (
    <div className={styles.tooltip} onClick={handleClickOutside}>
      <div className={styles.imageContainer}>
        <img
          src={fileUrl}
          alt={file.name}
          className={styles.image}
        />
        <button
          onClick={onClose}
          className={styles.closeButton}
        >
          <Icon variant="cross" size={16} className={styles.closeIcon} />
        </button>
        <div className={cn(
          styles.scoreContainer,
          isHighScore ? styles.scoreContainerHigh : styles.scoreContainerLow
        )}>
          <Icon variant="check" size={20} className={styles.scoreIcon} />
          <span className={styles.scoreText}>{score}%</span>
        </div>
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.infoContent}>
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
          </div>
          <Button
            variant={confirmDelete ? "destructive" : "ghost"}
            size="sm"
            className={cn(
              styles.deleteButton,
              confirmDelete && styles.deleteButtonConfirm
            )}
            onClick={handleDeleteClick}
          >
            <span className={styles.deleteText}>Confirm</span>
            <Icon variant="bin" size={16} className={styles.deleteIcon} />
          </Button>
        </div>
      </div>
    </div>
  )
} 