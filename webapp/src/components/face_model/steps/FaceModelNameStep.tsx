'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'

interface FaceModelNameStepProps {
  thumbnail: File | null
  value: string
  onChange: (name: string) => void
  needsCredits: boolean
  credits: number
}

export function FaceModelNameStep({ 
  thumbnail, 
  value, 
  onChange, 
  needsCredits, 
  credits 
}: FaceModelNameStepProps) {
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
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Face Model Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">No preview</div>
          )}
        </div>
        {/* Cyan glow effect */}
        <div className="absolute inset-0 rounded-full bg-[#44E3C9] opacity-20 blur-xl -z-10"></div>
      </div>

      {/* Name Input */}
      <div className="w-full max-w-md space-y-2">
        <Label htmlFor="faceModelName" className="text-sm font-medium text-[#C0CED8]">
          {t('faceModel.nameLabel')}
        </Label>
        <Input
          id="faceModelName"
          type="text"
          placeholder={t('faceModel.namePlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          {t('faceModel.nameDescription')}
        </p>
      </div>

      {/* Credit Information */}
      {needsCredits && (
        <div className="text-center space-y-1">
          <p className="text-sm text-[#44E3C9]">
            {t('faceModel.creditsRequired', { credits })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('faceModel.creditsDescription')}
          </p>
        </div>
      )}
    </div>
  )
}