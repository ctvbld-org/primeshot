import { useState, useEffect } from 'react'
import { ImageQualityResult } from '@/lib/image-quality'
import { useToast } from '@/components/ui/use-toast'

interface UseFileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = Infinity
  } = options

  const [files, setFiles] = useState<File[]>([])
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // Create and cleanup file URLs
  useEffect(() => {
    const urls: Record<string, string> = {}
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        urls[file.name] = URL.createObjectURL(file)
      }
    })
    setFileUrls(urls)

    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  const validateFiles = (newFiles: File[]): File[] => {
    const validFiles: File[] = []
    const invalidFiles: { file: File; reason: string }[] = []

    // Check if adding new files would exceed maxFiles
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files.`,
        variant: 'destructive',
      })
      return []
    }

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({ 
          file, 
          reason: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
        })
      } else if (file.size > maxSize) {
        invalidFiles.push({ 
          file, 
          reason: `File size exceeds maximum limit of ${formatFileSize(maxSize)}.` 
        })
      } else if (files.some(f => f.name === file.name)) {
        invalidFiles.push({ 
          file, 
          reason: 'A file with this name already exists.' 
        })
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} file(s) could not be added`,
        description: invalidFiles.map(({ file, reason }) => 
          `${file.name}: ${reason}`
        ).join('\n'),
        variant: 'destructive',
      })
    }

    return validFiles
  }

  const addFiles = (newFiles: File[], results?: Record<string, ImageQualityResult>) => {
    const validFiles = validateFiles(newFiles)
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      if (results) {
        setQualityResults(prev => ({ ...prev, ...results }))
      }
    }
    return validFiles
  }

  const removeFile = (index: number) => {
    const fileToRemove = files[index]
    setFiles(prev => prev.filter((_, i) => i !== index))
    
    if (fileToRemove) {
      // Cleanup URL
      if (fileUrls[fileToRemove.name]) {
        URL.revokeObjectURL(fileUrls[fileToRemove.name])
        setFileUrls(prev => {
          const next = { ...prev }
          delete next[fileToRemove.name]
          return next
        })
      }
      
      // Cleanup quality result
      if (qualityResults[fileToRemove.name]) {
        setQualityResults(prev => {
          const next = { ...prev }
          delete next[fileToRemove.name]
          return next
        })
      }
    }
  }

  const clearFiles = () => {
    // Cleanup all URLs
    Object.values(fileUrls).forEach(url => URL.revokeObjectURL(url))
    setFiles([])
    setFileUrls({})
    setQualityResults({})
    setProgress(0)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    files,
    fileUrls,
    qualityResults,
    isUploading,
    progress,
    addFiles,
    removeFile,
    clearFiles,
    setIsUploading,
    setProgress,
    setQualityResults,
    formatFileSize
  }
} 