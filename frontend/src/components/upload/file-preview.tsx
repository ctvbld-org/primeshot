'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageQualityScore } from './image-quality-score'
import type { ImageQualityResult } from '@/lib/image-quality'
import { Trash2Icon } from 'lucide-react'

export interface FilePreviewProps {
  file: File
  qualityResult?: ImageQualityResult
  onRemove: () => void
}

export function FilePreview({ file, qualityResult, onRemove }: FilePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('')

  // Generate preview URL
  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const hasFaceDetectionIssue = qualityResult && 
    (!qualityResult.hasFace && !qualityResult.faceDetectionSkipped);

  const qualityScore = qualityResult ? Math.round(qualityResult.score * 100) : 0;

  return (
    <Card className={`overflow-hidden ${hasFaceDetectionIssue ? 'border-destructive' : ''}`}>
      <CardContent className="p-2">
        <div className="flex items-center gap-3">
          <div className="relative w-[54px] h-[54px] flex-shrink-0">
            <Image
              src={imageUrl}
              alt={file.name}
              fill
              sizes="54px"
              className="object-cover rounded-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="truncate text-sm" title={file.name}>
                {file.name}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={onRemove}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">
                Overall Quality: {qualityScore}%
              </span>
              {qualityResult && (
                <div className="flex-shrink-0">
                  <ImageQualityScore 
                    file={file}
                    result={qualityResult}
                    isUploading={false}
                    progress={0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 