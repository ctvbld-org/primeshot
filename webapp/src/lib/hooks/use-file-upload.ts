import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageQualityResult } from '@/lib/image-quality'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { formatFileSize } from '@/lib/utils'
import { uploadFileInChunks } from '@/lib/upload-utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { analyzeImageQuality, loadModels } from '@/lib/image-quality'
import type { FileWithScore } from '@/lib/types'
import { getApiUrl } from '@/lib/api/client'

// Add delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface UseFileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  chunkSize?: number
  existingImages?: FileWithScore[]
  onRemoveExistingImage?: (imageId: string) => void
  petMode?: boolean
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
  isAnalyzing?: boolean
  uploadedUrl?: string
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { t } = useTranslation('upload')
  const { toast } = useToast()

  // Split options into separate constants for better memoization
  const {
    maxSize = 25 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png'],
    maxFiles = UPLOAD_CONSTANTS.MAX_IMAGES,
    existingImages = [],
    petMode = false
  } = useMemo(() => {
    return options;
  }, [options]);
  
  // Split state into logical groups
  const [fileStates, setFileStates] = useState<FileState[]>([]);

  // Handle existing images
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      // Convert existing images to FileState format
      const existingFileStates = existingImages.map((file: FileWithScore) => ({
        file: file as unknown as File,
        previewUrl: file.url,
          qualityResult: {
          width: 0,
          height: 0,
          faceCount: 1,
          score: file.score || 0,
          faceScore: 100,
          bodyScore: 100,
          brightnessScore: 100,
          contrastScore: 100,
          blurScore: 100,
          blockinessScore: 100,
          resolutionScore: 100,
          hasSingleFace: true,
          hasGoodResolution: true,
          hasGoodScore: true,
          isAcceptable: true,
          hasFace: true,
          hasBody: true,
          faceDetectionSkipped: false,
          eyesVisible: true,
          eyeDetectionSkipped: false,
          issues: [] as string[],
          i18nIssues: [] as Array<{ key: string; params?: Record<string, string | number> }>
        },
        uploadProgress: { progress: 100, isUploading: false },
        uploadedUrl: file.url
      }));

      // Preserve any non-existing files in the current state
      setFileStates(prev => {
        const nonExistingFiles = prev.filter(state => {
          const fileAsScore = state.file as unknown as FileWithScore;
          return !fileAsScore.id; // Keep files that don't have an id (newly added files)
        });
        return [...existingFileStates, ...nonExistingFiles];
      });
    } else {
      // If no existing images, only clear existing images from state
      setFileStates(prev => prev.filter(state => {
        const fileAsScore = state.file as unknown as FileWithScore;
        return !fileAsScore.id; // Keep files that don't have an id (newly added files)
      }));
    }
  }, [existingImages.length]); // Only run when the number of existing images changes
  
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    analyzingCount: 0,
    currentFileIndex: -1,
    acceptedCount: 0
  })
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // Memoize computed values
  const computedValues = useMemo(() => ({
    isUploading: fileStates.some(state => state.uploadProgress.isUploading),
    totalProgress: fileStates.reduce((sum, state) => sum + state.uploadProgress.progress, 0) / 
      Math.max(fileStates.length, 1),
    acceptedCount: fileStates.filter(state => state.qualityResult?.isAcceptable).length
  }), [fileStates])

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

  // Helper function to run analysis with timeout
  const analyzeWithTimeout = async (file: File, timeoutMs: number = 30000): Promise<ImageQualityResult> => {
    return Promise.race([
      analyzeImageQuality(file, { petMode }),
      new Promise<ImageQualityResult>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs)
      )
    ]);
  };

  const analyzeImages = async (files: File[]): Promise<[File[], Record<string, ImageQualityResult>]> => {
    // Calculate the starting display index based on current accepted files
    const startingDisplayIndex = fileStates.filter(state => state.qualityResult?.isAcceptable).length
    
    setAnalysisState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      analyzingCount: files.length,
      currentFileIndex: startingDisplayIndex, // Start at the first empty square
      acceptedCount: 0 
    }))
    
    try {
      const results: Record<string, ImageQualityResult> = {}
      let acceptedCount = 0
      let currentIndex = 0
      let displayIndex = startingDisplayIndex
      const maxAcceptableFiles = maxFiles - fileStates.filter(state => state.qualityResult?.isAcceptable).length
      const acceptedFiles: File[] = []
      const rejectedFileStates: FileState[] = []
      
      // Process files sequentially until we hit the max limit
      while (currentIndex < files.length && acceptedCount < maxAcceptableFiles) {
        const file = files[currentIndex]
        setAnalysisState(prev => ({ ...prev, currentFileIndex: displayIndex }))
        
        try {
          // Random delay between 400ms and 800ms
          await delay(Math.floor(Math.random() * (800 - 400 + 1)) + 400)
          const result = await analyzeWithTimeout(file, 30000) // 30 second timeout
          results[file.name] = result
          
          if (result.isAcceptable) {
            // Add accepted file state immediately after analysis
            setFileStates(prev => [...prev, {
              file,
              previewUrl: URL.createObjectURL(file),
              qualityResult: result,
              uploadProgress: { progress: 0, isUploading: false }
            }])
            
            acceptedFiles.push(file)
            acceptedCount++
            setAnalysisState(prev => ({ ...prev, acceptedCount }))
            currentIndex++
            displayIndex++ // Only move the loader when we accept an image
          } else {
            // Collect rejected file state but don't add it yet
            rejectedFileStates.push({
              file,
              previewUrl: URL.createObjectURL(file),
              qualityResult: result,
              uploadProgress: { progress: 0, isUploading: false }
            })
            currentIndex++ // Try next file but keep the loader on the same position
          }
        } catch (error) {
          const isTimeout = error instanceof Error && error.message === 'Analysis timeout';
          console.error(`Error analyzing ${file.name}:`, error);
          
          if (isTimeout) {
            toast({
              title: t('errors.analysisTimeout'),
              description: t('errors.analysisTimeoutDescription'),
              variant: 'destructive'
            });
          }
          
          const errorMessage = isTimeout ? 'Analysis timeout - please try again' : 'Analysis error';
          const errorResult: ImageQualityResult = {
            width: 0,
            height: 0,
            faceCount: 0,
            score: 0,
            faceScore: 0,
            bodyScore: 0,
            brightnessScore: 0,
            contrastScore: 0,
            blurScore: 0,
            blockinessScore: 0,
            resolutionScore: 0,
            hasSingleFace: false,
            hasGoodResolution: false,
            hasGoodScore: false,
            isAcceptable: false,
            hasFace: false,
            hasBody: false,
            faceDetectionSkipped: true,
            eyesVisible: false,
            eyeDetectionSkipped: true,
            issues: [errorMessage],
            i18nIssues: [] as Array<{ key: string; params?: Record<string, string | number> }>
          }
          results[file.name] = errorResult
          
          // Collect error file state but don't add it yet
          rejectedFileStates.push({
            file,
            previewUrl: URL.createObjectURL(file),
            qualityResult: errorResult,
            uploadProgress: { progress: 0, isUploading: false }
          })
          
          currentIndex++
        }
      }
      
      // Process any remaining files without showing them (for rejected dialog)
      for (let i = currentIndex; i < files.length; i++) {
        const file = files[i]
        try {
          const result = await analyzeWithTimeout(file, 30000) // 30 second timeout
          results[file.name] = result
          
          // Collect rejected file state but don't add it yet
          if (!result.isAcceptable) {
            rejectedFileStates.push({
              file,
              previewUrl: URL.createObjectURL(file),
              qualityResult: result,
              uploadProgress: { progress: 0, isUploading: false }
            })
          }
        } catch (error) {
          const isTimeout = error instanceof Error && error.message === 'Analysis timeout';
          console.error(`Error analyzing remaining file ${file.name}:`, error);
          
          const errorMessage = isTimeout ? 'Analysis timeout - please try again' : 'Analysis error';
          const errorResult: ImageQualityResult = {
            width: 0,
            height: 0,
            faceCount: 0,
            score: 0,
            faceScore: 0,
            bodyScore: 0,
            brightnessScore: 0,
            contrastScore: 0,
            blurScore: 0,
            blockinessScore: 0,
            resolutionScore: 0,
            hasSingleFace: false,
            hasGoodResolution: false,
            hasGoodScore: false,
            isAcceptable: false,
            hasFace: false,
            hasBody: false,
            faceDetectionSkipped: true,
            eyesVisible: false,
            eyeDetectionSkipped: true,
            issues: [errorMessage],
            i18nIssues: [] as Array<{ key: string; params?: Record<string, string | number> }>
          }
          results[file.name] = errorResult
          
          // Collect error file state but don't add it yet
          rejectedFileStates.push({
            file,
            previewUrl: URL.createObjectURL(file),
            qualityResult: errorResult,
            uploadProgress: { progress: 0, isUploading: false }
          })
        }
      }
      
      // Now that all analysis is complete, add all rejected files at once
      if (rejectedFileStates.length > 0) {
        setFileStates(prev => [...prev, ...rejectedFileStates])
      }
      
      // Set analyzing to false after all files are processed
      setAnalysisState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        currentFileIndex: -1,
        acceptedCount: 0 
      }))
      
      return [acceptedFiles, results]
    } catch (error) {
      console.error('Error during image analysis:', error)
      setAnalysisState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        currentFileIndex: -1,
        acceptedCount: 0 
      }))
      return [[], {}]
    }
  }

  const clearRejectedFiles = () => {
    setFileStates(prev => prev.filter(state => state.qualityResult?.isAcceptable))
  }

  const addFiles = useCallback(async (newFiles: File[]) => {
    // First do basic validation
    const validFiles = validateFiles(newFiles)
    if (validFiles.length === 0) return []

    // Analyze files - file states are added during analysis
    const [analyzedFiles, results] = await analyzeImages(validFiles)

    // Only show skipped toast if we hit the max files limit AND have acceptable files that were skipped
    const remainingSlots = maxFiles - computedValues.acceptedCount
    const acceptableFilesCount = Object.values(results).filter(r => r.isAcceptable).length
    const skippedDueToLimit = acceptableFilesCount > remainingSlots
    
    // Clean up rejected files if:
    // 1. All files passed quality checks, or
    // 2. We filled all remaining slots with passing files
    const shouldShowRejected = Object.values(results).some(r => !r.isAcceptable) && 
      acceptableFilesCount < remainingSlots;
    
    if (!shouldShowRejected) {
      // Clean up rejected files immediately
      clearRejectedFiles();
    }
    
    if (skippedDueToLimit) {
      const skippedAcceptableFiles = analyzedFiles
        .slice(remainingSlots)
        .filter(f => results[f.name]?.isAcceptable)
      
      if (skippedAcceptableFiles.length > 0) {
        toast({
          title: t('errors.someImagesSkipped'),
          description: t('errors.skippedMessage', { 
            count: remainingSlots,
            files: skippedAcceptableFiles.map(f => f.name).join(', ')
          }),
          duration: 5000,
        })
      }
    }

    return fileStates
  }, [validateFiles, computedValues.acceptedCount, maxFiles, analyzeImages, t, toast, clearRejectedFiles])

  const removeFile = useCallback(async (index: number) => {
    const state = fileStates[index]
    
    // Check if this is an existing file with an ID
    const existingFile = state?.file as unknown as FileWithScore
    if (existingFile?.id) {
      // This is an existing file, delete it from S3 and database
      try {
        const response = await fetch(getApiUrl(`/api/user-images?imageId=${existingFile.id}`), {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const error = await response.json()
          toast({
            title: t('errors.deleteFailed'),
            description: error.error || t('errors.genericError'),
            variant: 'destructive',
          })
          return
        }

        // Call the callback to update existingImages in the parent
        if (existingFile.id) {
          options.onRemoveExistingImage?.(existingFile.id)
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        toast({
          title: t('errors.deleteFailed'),
          description: t('errors.genericError'),
          variant: 'destructive',
        })
        return
      }
    }
    
    // If there was a URL created, revoke it
    if (state?.uploadedUrl) {
      URL.revokeObjectURL(state.uploadedUrl)
    }

    // Revoke any blob URL we created  
    if (state?.previewUrl?.startsWith('blob:')) {  
      URL.revokeObjectURL(state.previewUrl)  
    }  
    
    // Remove the file from state
    setFileStates(prev => prev.filter((_, i) => i !== index))

  }, [fileStates, t, toast, options.onRemoveExistingImage])

  const clearFiles = () => {
    fileStates.forEach(state => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl)
      }
    })
    setFileStates([])
  }

  const uploadFile = async (file: File, orderId: string, characterId: string) => {
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
        characterId,
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
          ? { 
              ...state, 
              uploadProgress: { progress: 100, isUploading: false },
              uploadedUrl: url
            }
          : state
      ))

      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      setFileStates(prev => prev.map((state, i) => 
        i === index 
          ? { ...state, uploadProgress: { progress: 0, isUploading: false } }
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