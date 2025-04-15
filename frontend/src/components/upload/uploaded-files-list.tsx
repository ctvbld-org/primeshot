'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2Icon, FileIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ImageQualityResult } from '@/lib/image-quality'
import { ImageQualityScore } from './image-quality-score'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Image from 'next/image'
import { cn, formatFileSize } from '@/lib/utils'

interface UploadedFilesListProps {
  files: File[]
  onRemoveFile: (index: number) => void
  isUploading: boolean
  progress: number
  qualityResults: Record<string, ImageQualityResult>
  variant?: 'accepted' | 'rejected'
}

export function UploadedFilesList({
  files,
  onRemoveFile,
  isUploading,
  progress,
  qualityResults,
  variant
}: UploadedFilesListProps) {
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

  // Create object URLs for image previews
  useEffect(() => {
    const urls: Record<string, string> = {}
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        urls[file.name] = URL.createObjectURL(file)
      }
    })
    setFileUrls(urls)

    // Cleanup URLs on unmount
    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  // Get quality indicator
  const getQualityIndicator = (fileName: string) => {
    const result = qualityResults[fileName]
    if (!result) return null
    
    if (result.isAcceptable) {
      return <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" title="Good quality" />
    } else if (result.score >= 0.5) {
      return <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" title="Needs improvement" />
    } else {
      return <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" title="Poor quality" />
    }
  }

  // Format quality score as percentage with color
  const getQualityScoreElement = (fileName: string) => {
    const result = qualityResults[fileName]
    if (!result) return null
    
    const score = Math.round(result.score)
    let colorClass = ''
    let status = ''
    
    if (result.isAcceptable) {
      colorClass = 'text-green-500'
      status = 'Accepted'
    } else {
      colorClass = 'text-red-500'
      status = 'Rejected'
      
      // Add specific rejection reasons
      if (!result.hasSingleFace) status += ' - Multiple faces'
      if (!result.hasGoodResolution) status += ' - Low resolution'
      if (!result.hasGoodScore) status += ' - Low quality'
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className={`text-md font-medium ${colorClass}`}>
          {score}%
        </span>
        <span className={`text-sm ${colorClass}`}>
          ({status})
        </span>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center p-4 border rounded-lg">
        {variant === 'accepted' ? 'No accepted images yet' : variant === 'rejected' ? 'No rejected images' : 'No images uploaded'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file, index) => (
        <div 
          key={`${file.name}-${index}`}
          className={cn(
            "border rounded-lg p-4",
            variant === 'accepted' ? "bg-green-50 border-green-100" :
            variant === 'rejected' ? "bg-red-50 border-red-100" :
            "bg-card"
          )}
        >
          <ImageQualityScore
            file={file}
            result={qualityResults[file.name]}
            onRemove={() => onRemoveFile(index)}
            isUploading={isUploading}
            progress={progress}
            variant={variant}
          />
        </div>
      ))}
    </div>
  )
} 