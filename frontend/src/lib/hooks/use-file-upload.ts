import { useState, useEffect, useCallback, useMemo } from 'react'
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

interface FileState {
  file: File
  previewUrl?: string
  qualityResult?: ImageQualityResult
  uploadProgress: FileProgress
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { t } = useTranslation('upload')
  const { toast } = useToast()

  // Split options into separate constants for better memoization
  const {
    maxSize = 100 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = UPLOAD_CONSTANTS.MAX_IMAGES,
    chunkSize = CHUNK_SIZE
  } = useMemo(() => options, [options])

  // Split state into logical groups
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    analyzingCount: 0
  })
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // Memoize computed values
  const computedValues = useMemo(() => ({
    isUploading: fileStates.some(state => state.uploadProgress.isUploading),
    totalProgress: fileStates.reduce((sum, state) => sum + state.uploadProgress.progress, 0) / 
      Math.max(fileStates.length, 1),
    acceptedCount: fileStates.filter(state => state.qualityResult?.isAcceptable).length
  }), [fileStates])

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      fileStates.forEach(state => {
        if (state.previewUrl) {
          URL.revokeObjectURL(state.previewUrl)
        }
      })
    }
  }, [])

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
    
    if (typeof window !== 'undefined') {
      initModels()
    }
  }, [toast])

  const validateFiles = useCallback((newFiles: File[]): File[] => {
    const validFiles: File[] = []
    const invalidFiles: { file: File; reason: string }[] = []

    // Use Set for O(1) lookup of existing files
    const existingFiles = new Set(fileStates.map(state => 
      `${state.file.name}-${state.file.lastModified}`
    ))

    newFiles.forEach((file) => {
      const fileKey = `${file.name}-${file.lastModified}`
      
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
      } else if (existingFiles.has(fileKey)) {
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
  }, [fileStates, allowedTypes, maxSize, t, toast])

  const handleNewFiles = useCallback((newFiles: File[]): File[] => {
    // Basic validation only - type, size, duplicates
    return validateFiles(newFiles)
  }, [validateFiles, fileStates])

  const analyzeImages = async (files: File[]): Promise<[File[], Record<string, ImageQualityResult>]> => {
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true, analyzingCount: files.length }))
    
    try {
      const results: Record<string, ImageQualityResult> = {}
      
      // Process files sequentially
      for (const file of files) {
        try {
          const result = await analyzeImageQuality(file)
          results[file.name] = result
        } catch (error) {
          console.error(`Error analyzing ${file.name}:`, error)
          results[file.name] = {
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
      
      return [files, results]
    } catch (error) {
      console.error('Error during image analysis:', error)
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
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false, analyzingCount: 0 }))
    }
  }

  const addFiles = useCallback(async (newFiles: File[]) => {
    // First do basic validation
    const validFiles = validateFiles(newFiles)
    if (validFiles.length === 0) return []

    // Get current count of accepted files from computed values
    const { acceptedCount } = computedValues
    
    // Analyze all files first
    const [analyzedFiles, results] = await analyzeImages(validFiles)
    
    // Create new file states
    const newFileStates: FileState[] = analyzedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      qualityResult: results[file.name],
      uploadProgress: { progress: 0, isUploading: false }
    }))

    // Count accepted files and handle max files limit
    const newAcceptedFiles = newFileStates.filter(state => state.qualityResult?.isAcceptable)
    const remainingSlots = maxFiles - acceptedCount
    const statesToAdd = remainingSlots > 0 
      ? [...newAcceptedFiles.slice(0, remainingSlots), ...newFileStates.filter(state => !state.qualityResult?.isAcceptable)]
      : newFileStates.filter(state => !state.qualityResult?.isAcceptable)

    // Update state
    setFileStates(prev => [...prev, ...statesToAdd])

    // Show toast if we had to skip files
    const skippedFiles = newAcceptedFiles.slice(remainingSlots)
    if (skippedFiles.length > 0) {
      const skippedFileNames = skippedFiles.map(state => state.file.name)
      toast({
        title: t('errors.someImagesSkipped'),
        description: t('errors.skippedMessage', { 
          count: remainingSlots,
          files: skippedFileNames.join(', ')
        }),
        duration: 5000,
      })
    }

    return statesToAdd
  }, [validateFiles, computedValues, maxFiles, analyzeImages, t, toast])

  const removeFile = (index: number) => {
    setFileStates(prev => {
      const state = prev[index]
      if (state?.previewUrl) {
        URL.revokeObjectURL(state.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const clearFiles = () => {
    fileStates.forEach(state => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl)
      }
    })
    setFileStates([])
  }

  const clearRejectedFiles = () => {
    setFileStates(prev => prev.filter(state => state.qualityResult?.isAcceptable))
  }

  const uploadFile = async (file: File, orderId: string) => {
    const index = fileStates.findIndex(state => state.file === file)
    if (index === -1) return

    setFileStates(prev => prev.map((state, i) => 
      i === index 
        ? { ...state, uploadProgress: { progress: 0, isUploading: true } }
        : state
    ))

    try {
      const url = await uploadFileInChunks(
        file,
        orderId,
        (progress: number) => {
          setFileStates(prev => prev.map((state, i) => 
            i === index 
              ? { ...state, uploadProgress: { progress, isUploading: true } }
              : state
          ))
        }
      )

      setFileStates(prev => prev.map((state, i) => 
        i === index 
          ? { ...state, uploadProgress: { progress: 100, isUploading: false } }
          : state
      ))

      return url
    } catch (error) {
      setFileStates(prev => prev.map((state, i) => 
        i === index 
          ? { ...state, uploadProgress: { progress: 0, isUploading: false, error: error instanceof Error ? error.message : 'Upload failed' } }
          : state
      ))
      throw error
    }
  }

  return {
    files: fileStates.map(state => state.file),
    fileStates,
    qualityResults: useMemo(() => Object.fromEntries(
      fileStates
        .filter(state => state.qualityResult)
        .map(state => [state.file.name, state.qualityResult!])
    ), [fileStates]),
    ...computedValues,
    addFiles,
    removeFile,
    clearFiles,
    clearRejectedFiles,
    ...analysisState,
    handleNewFiles,
    uploadFile,
    modelsStatus
  }
}