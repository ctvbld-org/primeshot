'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle, XCircle, Info, CircleAlert, AlertCircle, Trash2Icon } from 'lucide-react'
import { ImageQualityResult } from '@/lib/image-quality'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { FileIcon } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface ImageQualityScoreProps {
  file: File
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
  const [fileUrl, setFileUrl] = useState<string>('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!result) {
    return (
      <div className="text-sm text-muted-foreground">
        Quality analysis not available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-[100px] h-[100px] rounded-md overflow-hidden bg-muted">
            {fileUrl ? (
              <Image
                src={fileUrl}
                alt={file.name}
                fill
                className="object-cover"
              />
            ) : (
              <FileIcon className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex-grow space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium truncate max-w-[200px]">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            {variant === 'accepted' && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1"
                onClick={onRemove}
                disabled={isUploading}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span>Quality Score</span>
              <span className="font-medium">{Math.round(result.score)}%</span>
            </div>
            <Progress 
              value={result.score} 
              className={cn(
                "h-2",
                result.score >= 70 ? "bg-green-500" :
                result.score >= 50 ? "bg-yellow-500" :
                "bg-red-500"
              )}
            />
          </div>

          {result.issues.length > 0 && (
            <div className="text-sm space-y-1 mt-2">
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {variant === 'accepted' && isUploading && (
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