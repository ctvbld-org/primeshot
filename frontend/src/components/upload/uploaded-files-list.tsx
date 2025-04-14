'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2Icon, FileIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface UploadedFilesListProps {
  files: File[]
  onRemoveFile: (index: number) => void
  isUploading: boolean
  progress: number
}

export function UploadedFilesList({ 
  files, 
  onRemoveFile, 
  isUploading, 
  progress 
}: UploadedFilesListProps) {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
            
            <div className="max-h-80 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-md bg-card"
                >
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate max-w-[190px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemoveFile(index)}
                    disabled={isUploading}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 