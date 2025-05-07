'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { AlertCircle } from 'lucide-react'
import { ImageQualityResult } from '@/lib/image-quality'
import { cn } from '@/lib/utils'

interface ImageQualityScoreProps {
  result: ImageQualityResult
  isUploading?: boolean
  progress?: number
}

export function ImageQualityScore({
  result,
  isUploading,
  progress
}: ImageQualityScoreProps) {
  if (!result) {
    return (
      <div className="text-sm text-muted-foreground">
        Quality analysis not available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-sm">
          <span>Quality Score</span>
          <span className="font-medium">{Math.round(result.score)}%</span>
        </div>
        <Progress 
          value={result.score} 
          className={cn(
            "h-2",
            result.score >= 80 ? "bg-[#44E3C9]" :
            result.score >= 50 ? "bg-[#FF973C]" :
            "bg-red-500"
          )}
        />
      </div>

      {result.issues.length > 0 && (
        <div className="text-sm space-y-1">
          {result.issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-1 text-muted-foreground">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {isUploading && typeof progress === 'number' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  )
} 