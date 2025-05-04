import { useState, useEffect } from 'react'
import { ImageQualityResult } from '@/lib/image-quality'
import { useToast } from '@/components/ui/use-toast'
import { formatFileSize } from '@/lib/utils'
import { uploadFileInChunks, CHUNK_SIZE } from '@/lib/upload-utils'

interface UseFileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  chunkSize?: number
}

interface FileProgress {
  progress: number
  isUploading: boolean
  error?: string
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB max file size
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = Infinity,
    chunkSize = CHUNK_SIZE
  } = options

  const [files, setFiles] = useState<File[]>([])
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileProgress>>({})
  const { toast } = useToast()

  // Computed overall upload state
  const isUploading = Object.values(uploadProgress).some(p => p.isUploading)
  const totalProgress = Object.values(uploadProgress).reduce((sum, p) => sum + p.progress, 0) / 
    Math.max(Object.keys(uploadProgress).length, 1)

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
      // Initialize progress for new files
      setUploadProgress(prev => {
        const next = { ...prev }
        validFiles.forEach(file => {
          next[file.name] = { progress: 0, isUploading: false }
        })
        return next
      })
    }
    return validFiles
  }

  const uploadFile = async (file: File, orderId?: string): Promise<string> => {
    try {
      if (!orderId) {
        throw new Error('orderId is required for file upload')
      }

      // Set initial upload state for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], isUploading: true }
      }))

      // Use chunked upload for files larger than 4MB
      if (file.size > 4 * 1024 * 1024) {
        return await uploadFileInChunks(file, orderId, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { ...prev[file.name], progress }
          }))
        })
      } else {
        // Use regular upload for smaller files
        const formData = new FormData()
        formData.append('files', file)
        formData.append('orderId', orderId)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        
        // Set progress to 100% for successful upload
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { ...prev[file.name], progress: 100 }
        }))
        
        return data.url
      }
    } catch (error) {
      console.error('Upload error:', error)
      // Set error state for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { 
          ...prev[file.name], 
          error: error instanceof Error ? error.message : 'Upload failed' 
        }
      }))
      throw error
    } finally {
      // Clear uploading state for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], isUploading: false }
      }))
    }
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

      // Cleanup progress
      setUploadProgress(prev => {
        const next = { ...prev }
        delete next[fileToRemove.name]
        return next
      })
    }
  }

  const clearFiles = () => {
    // Cleanup all URLs
    Object.values(fileUrls).forEach(url => URL.revokeObjectURL(url))
    setFiles([])
    setFileUrls({})
    setQualityResults({})
    setUploadProgress({})
  }

  return {
    files,
    fileUrls,
    qualityResults,
    isUploading,
    progress: totalProgress,
    uploadProgress,
    addFiles,
    uploadFile,
    removeFile,
    clearFiles,
    formatFileSize
  }
} 