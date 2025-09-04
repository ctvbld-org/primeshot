'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'
import { Button } from '@primeshot/common/web/ui/button'
import styles from './ThumbnailStyles.module.css'

interface CharacterNameStepProps {
  thumbnail: File | null
  value: string
  onChange: (name: string) => void
  needsCredits: boolean
  credits: number
  onCreateClick: () => void
  disabled?: boolean
  // For showing "Included in plan" text
  remainingTrainings?: number
  totalTrainings?: number
  usedTrainings?: number
}

export function CharacterNameStep({ 
  thumbnail, 
  value, 
  onChange, 
  needsCredits, 
  credits,
  onCreateClick,
  disabled = false,
  remainingTrainings,
  totalTrainings,
  usedTrainings
}: CharacterNameStepProps) {
  const { t } = useTranslation('upload')
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')

  useEffect(() => {
    if (thumbnail) {
      const url = URL.createObjectURL(thumbnail)
      setThumbnailUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [thumbnail])

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Thumbnail Preview */}
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnail}>
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Face Model Preview" 
              className={styles.thumbnailImage}
            />
          ) : (
            <div className={styles.thumbnailPlaceholder}>No preview</div>
          )}
        </div>
        {/* Cyan glow effect */}
        <div className={styles.thumbnailGlow}></div>
      </div>

      {/* Name Input */}
      <div className="w-full max-w-md space-y-4">
        <Input
          id="characterName"
          type="text"
          placeholder={t('character.nameLabel')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
        />
        
        {/* Create Button */}
        <Button
          onClick={onCreateClick}
          disabled={disabled}
          variant="primary"
          className="w-full"
        >
          Create
        </Button>
      </div>

      {/* Credit Information */}
      <div className="text-center space-y-1">
        <p className="text-sm text-[#44E3C9]">
          {needsCredits 
            ? t('character.creditsRequired', { credits })
            : `Included in plan (${usedTrainings !== undefined ? usedTrainings + 1 : 1} of ${totalTrainings || 1})`
          }
        </p>
      </div>
    </div>
  )
}