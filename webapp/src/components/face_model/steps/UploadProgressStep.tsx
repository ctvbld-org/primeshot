'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@primeshot/common/web/ui/progress'
import { Loader2 } from 'lucide-react'

interface UploadProgressStepProps {
  progress: number
  totalFiles: number
}

export function UploadProgressStep({ progress, totalFiles }: UploadProgressStepProps) {
  const { t } = useTranslation('upload')
  
  const uploadedCount = Math.floor((progress / 100) * totalFiles)

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-12">
      {/* Loading Animation */}
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-[#44E3C9]" />
        <div className="absolute inset-0 blur-2xl bg-[#44E3C9] opacity-20"></div>
      </div>

      {/* Progress Text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-white">
          {t('status.uploading')}
        </h3>
        <p className="text-sm text-[#C0CED8]">
          {t('upload.uploadingFiles', { uploaded: uploadedCount, total: totalFiles })}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-xs text-muted-foreground mt-2">
          {progress.toFixed(0)}%
        </p>
      </div>

      {/* Info Text */}
      <p className="text-xs text-center text-muted-foreground max-w-md">
        {t('upload.uploadingInfo')}
      </p>
    </div>
  )
}