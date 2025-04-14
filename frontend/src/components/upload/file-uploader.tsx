'use client'

import React, { useCallback, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadIcon, ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void
}

export function FileUploader({ onFilesAdded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // File validation
  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = []
    const invalidFiles: { file: File; reason: string }[] = []
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({ file, reason: 'Invalid file type. Only JPEG, PNG, and WebP are supported.' })
      } else if (file.size > maxSize) {
        invalidFiles.push({ file, reason: `File size exceeds maximum limit of 10MB.` })
      } else {
        validFiles.push(file)
      }
    })

    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(
        ({ file, reason }) => `${file.name}: ${reason}`
      )
      toast({
        title: `${invalidFiles.length} file(s) could not be added`,
        description: (
          <ul className="list-disc pl-4">
            {errorMessages.map((message, i) => (
              <li key={i} className="text-sm">{message}</li>
            ))}
          </ul>
        ),
        variant: 'destructive',
      })
    }

    return validFiles
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        const validFiles = validateFiles(Array.from(files))
        if (validFiles.length > 0) {
          onFilesAdded(validFiles)
        }
      }
    },
    [onFilesAdded]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        const validFiles = validateFiles(Array.from(files))
        if (validFiles.length > 0) {
          onFilesAdded(validFiles)
        }
      }
      
      // Reset the file input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesAdded]
  )

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card className={`border-2 ${isDragging ? 'border-primary border-dashed' : 'border-dashed'}`}>
      <CardContent className="p-0">
        <div
          className="flex flex-col items-center justify-center p-8 space-y-4 text-center cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            {isDragging ? (
              <UploadIcon className="h-10 w-10 text-primary animate-pulse" />
            ) : (
              <ImageIcon className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-xl">Drag photos here</h3>
            <p className="text-muted-foreground text-sm">
              or click to browse from your device
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            multiple
            onChange={handleFileInputChange}
            ref={fileInputRef}
          />
          <Button type="button" variant="outline" className="mt-4" onClick={(e) => {
            e.stopPropagation()
            handleButtonClick()
          }}>
            Select Files
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 