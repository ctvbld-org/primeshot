import { useState, useEffect, useCallback, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageQualityResult } from '@/lib/image-quality'
import { useToast } from '@/components/ui/use-toast'
import { formatFileSize } from '@/lib/utils'
import { uploadFileInChunks, CHUNK_SIZE } from '@/lib/upload-utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { analyzeImageQuality, loadModels, checkBodyPercentageRequirements } from '@/lib/image-quality'

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
  const { t } = useTranslation('upload')
  const {
    maxSize = 100 * 1024 * 1024, // 100MB max file size
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = UPLOAD_CONSTANTS.MAX_IMAGES,
    chunkSize = CHUNK_SIZE
  } = options

  const [files, setFiles] = useState<File[]>([])
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileProgress>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzingCount, setAnalyzingCount] = useState<number>(0)
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const { toast } = useToast()

  // Load face detection models on mount
  useEffect(() => {
    const initModels = async () => {
      try {
        const success = await loadModels()
        setModelsStatus(success ? 'loaded' : 'error')
        
        if (!success) {
          toast({
            title: 'Warning',
            description: 'Face detection models could not be loaded. Quality analysis will be limited to other image attributes.',
            variant: 'default',
            duration: 5000,
          })
        }
      } catch (error) {
        console.error('Error loading face detection models:', error)
        setModelsStatus('error')
        toast({
          title: 'Warning',
          description: 'Face detection models could not be loaded. Quality analysis may be limited.',
          variant: 'destructive',
        })
      }
    }
    
    // Only run in the browser
    if (typeof window !== 'undefined') {
      initModels()
    }
  }, [toast])

  // Analyze image quality
  const analyzeImages = async (files: File[]): Promise<[File[], Record<string, ImageQualityResult>]> => {
    setIsAnalyzing(true)
    setAnalyzingCount(files.length)
    
    try {
      const qualityResults: Record<string, ImageQualityResult> = {}
      const noFaceImages: string[] = [];
      let faceDetectionSkipped = false;
      
      // Process files sequentially to avoid overwhelming the browser
      for (const file of files) {
        try {
          console.log(`Starting analysis of ${file.name}`)
          const result = await analyzeImageQuality(file)
          console.log(`Completed analysis of ${file.name}:`, result)
          
          // Track if face detection was skipped
          if (result.faceDetectionSkipped) {
            faceDetectionSkipped = true;
          }
          
          // Check if a face was found
          if (!result.hasFace && !result.faceDetectionSkipped) {
            noFaceImages.push(file.name);
          }
          
          qualityResults[file.name] = result
        } catch (error) {
          console.error(`Error analyzing ${file.name}:`, error)
          faceDetectionSkipped = true;
          
          qualityResults[file.name] = {
            width: 0,
            height: 0,
            faceCount: 0,
            score: 0.5,
            faceScore: 0.5,
            bodyScore: 0.5,
            brightnessScore: 0.5,
            contrastScore: 0.5,
            blurScore: 0.5,
            resolutionScore: 0.5,
            hasSingleFace: false,
            hasGoodResolution: false,
            hasGoodScore: false,
            isAcceptable: true,
            hasFace: false,
            hasBody: false,
            faceDetectionSkipped: true,
            issues: ['Image analysis was limited. Quality assessment is based on minimal checks.']
          }
        }
      }
      
      // Check body percentage requirements
      const bodyPercentageOk = checkBodyPercentageRequirements(qualityResults);
      if (!bodyPercentageOk) {
        const bodyCount = Object.values(qualityResults).filter(r => r.hasBody).length;
        const totalImages = files.length;
        const bodyPercentage = (bodyCount / totalImages) * 100;
      }
      
      return [files, qualityResults]
    } catch (error) {
      console.error('Error during image analysis:', error)
      toast({
        title: 'Analysis limited',
        description: 'Image quality analysis was limited. All images will be accepted.',
        variant: 'default',
      })
      
      // Return basic quality results for all files
      const basicResults: Record<string, ImageQualityResult> = {}
      files.forEach(file => {
        basicResults[file.name] = {
          width: 0,
          height: 0,
          faceCount: 0,
          score: 0.7,
          faceScore: 0.7,
          bodyScore: 0.7,
          brightnessScore: 0.7,
          contrastScore: 0.7,
          blurScore: 0.7,
          resolutionScore: 0.7,
          hasSingleFace: false,
          hasGoodResolution: false,
          hasGoodScore: true,
          isAcceptable: true,
          hasFace: false,
          hasBody: false,
          faceDetectionSkipped: true,
          issues: ['Image analysis unavailable. All images are accepted by default.']
        }
      })
      
      return [files, basicResults]
    } finally {
      setIsAnalyzing(false)
      setAnalyzingCount(0)
    }
  }

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

  const handleNewFiles = useCallback((newFiles: File[]) => {
    // Check if we already have max files
    if (files.length >= maxFiles) {
      toast({
        title: t('errors.maxImagesReached'),
        description: t('errors.maxImagesMessage', { count: maxFiles }),
        variant: 'destructive',
        duration: 5000,
      });
      return [];
    }

    // Calculate how many more files we can accept
    const remainingSlots = maxFiles - files.length;
    
    // Handle case where too many files are selected
    if (files.length + newFiles.length > maxFiles) {
      const acceptedFiles = newFiles.slice(0, remainingSlots);
      const skippedFiles = newFiles.slice(remainingSlots);
      const skippedFileNames = skippedFiles.map(f => f.name);
      const formattedSkippedFiles = skippedFileNames.length > 3
        ? `${skippedFileNames.slice(0, 3).join(', ')} and ${skippedFileNames.length - 3} more`
        : skippedFileNames.join(', ');

      toast({
        title: t('errors.someImagesSkipped'),
        description: t('errors.skippedMessage', { 
          count: remainingSlots,
          files: formattedSkippedFiles 
        }),
        duration: Infinity,
      });

      return acceptedFiles;
    }

    // Check if we're below minimum images and show informative toast
    if (files.length + newFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES) {
      const remaining = UPLOAD_CONSTANTS.MIN_IMAGES - (files.length + newFiles.length);
      toast({
        title: t('errors.moreImagesNeeded'),
        description: t('errors.moreImagesMessage', { count: remaining }),
        variant: 'default',
        duration: 5000,
      });
    }

    return newFiles;
  }, [files.length, maxFiles, toast, t]);

  const validateFiles = (newFiles: File[]): File[] => {
    const validFiles: File[] = []
    const invalidFiles: { file: File; reason: string }[] = []

    // Check if adding new files would exceed maxFiles
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: t('errors.tooManyFiles'),
        description: t('errors.maxFilesMessage', { count: maxFiles }),
        variant: 'destructive',
      })
      return []
    }

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.invalidFileType', { types: allowedTypes.join(', ') })
        })
      } else if (file.size > maxSize) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.fileSizeExceeded', { size: formatFileSize(maxSize) })
        })
      } else if (files.some(f => f.name === file.name)) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.duplicateFile')
        })
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      toast({
        title: t('errors.uploadFailedCount', { count: invalidFiles.length }),
        description: invalidFiles.map(({ file, reason }) => 
          `${file.name}: ${reason}`
        ).join('\n'),
        variant: 'destructive',
      })
    }

    return validFiles
  }

  const addFiles = async (newFiles: File[]) => {
    const validFiles = validateFiles(newFiles)
    if (validFiles.length > 0) {
      const [analyzedFiles, results] = await analyzeImages(validFiles)
      setFiles(prev => [...prev, ...analyzedFiles])
      setQualityResults(prev => ({ ...prev, ...results }))
      
      // Initialize progress for new files
      setUploadProgress(prev => {
        const next = { ...prev }
        analyzedFiles.forEach(file => {
          next[file.name] = { progress: 0, isUploading: false }
        })
        return next
      })
      return analyzedFiles
    }
    return []
  }

  const uploadFile = async (file: File, orderId?: string): Promise<string> => {
    try {
      if (!orderId) {
        throw new Error(t('errors.orderIdRequired'))
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
          throw new Error(t('errors.uploadFailed'))
        }

        const data = await response.json()
        
        // Validate response data structure
        if (!data || typeof data.url !== 'string') {
          throw new Error(t('errors.invalidResponse'))
        }
        
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
    isAnalyzing,
    analyzingCount,
    modelsStatus,
    progress: totalProgress,
    uploadProgress,
    addFiles,
    uploadFile,
    removeFile,
    clearFiles,
    formatFileSize,
    handleNewFiles
  }
}