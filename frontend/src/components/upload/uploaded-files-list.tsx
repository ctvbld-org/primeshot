'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2Icon, FileIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ImageQualityResult } from '@/lib/image-quality'
import { ImageQualityScore } from './image-quality-score'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Image from 'next/image'

interface UploadedFilesListProps {
  files: File[]
  onRemoveFile: (index: number) => void
  isUploading: boolean
  progress: number
  qualityResults?: Record<string, ImageQualityResult>
}

export function UploadedFilesList({ 
  files, 
  onRemoveFile, 
  isUploading, 
  progress,
  qualityResults = {}
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
    
    const score = Math.round(result.score * 100)
    let colorClass = ''
    
    if (result.isAcceptable) {
      colorClass = 'text-green-500'
    } else if (result.score >= 0.5) {
      colorClass = 'text-yellow-500'
    } else {
      colorClass = 'text-red-500'
    }
    
    return (
      <span className={`text-md font-medium ${colorClass}`}>
        {score}%
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Files ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files selected yet
          </div>
        ) : (
          <div className="space-y-4">
            {isUploading && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="max-h-[585px] overflow-y-auto space-y-2">
              <Accordion type="multiple" className="w-full space-y-2">
                {files.map((file, index) => (
                  <AccordionItem
                    key={`${file.name}-${index}`}
                    value={`file-${index}`}
                    className="border rounded-md bg-card p-0 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-[54px] h-[54px] rounded-md overflow-hidden bg-muted">
                            {fileUrls[file.name] ? (
                              <Image
                                src={fileUrls[file.name]}
                                alt={file.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <FileIcon className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 z-10">
                            {getQualityIndicator(file.name)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate max-w-[190px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getQualityScoreElement(file.name)}
                        <AccordionTrigger className="h-8 w-8 p-0">
                          <span className="sr-only">Toggle details</span>
                        </AccordionTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFile(index)
                          }}
                          disabled={isUploading}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <AccordionContent>
                      <div className="px-3 pb-3 pt-0">
                        {qualityResults[file.name] ? (
                          <ImageQualityScore 
                            result={qualityResults[file.name]} 
                            fileName={file.name}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground p-2">
                            Quality analysis not available
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 