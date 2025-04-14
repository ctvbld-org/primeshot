'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadIcon, ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { analyzeImageQuality, loadModels, ImageQualityResult } from '@/lib/image-quality'

interface FileUploaderProps {
  onFilesAdded: (files: File[], qualityResults?: Record<string, ImageQualityResult>) => void
}

export function FileUploader({ onFilesAdded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // Load face detection models on component mount
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

  // Analyze image quality
  const analyzeImages = async (files: File[]): Promise<[File[], Record<string, ImageQualityResult>]> => {
    setIsAnalyzing(true)
    
    try {
      const qualityResults: Record<string, ImageQualityResult> = {}
      let noFaceImages: string[] = [];
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
          
          // If analysis fails, add a basic result to allow upload to continue
          qualityResults[file.name] = {
            score: 0.5, // Give a medium score by default
            isAcceptable: true, // Mark as acceptable to allow uploads
            width: 0,
            height: 0,
            hasFace: false, // Don't assume there's a face
            faceScore: 0.5,
            brightnessScore: 0.5,
            contrastScore: 0.5,
            blurScore: 0.5,
            resolutionScore: 0.5,
            issues: ['Image analysis was limited. Quality assessment is based on minimal checks.'],
            faceDetectionSkipped: true
          }
        }
      }
      
      // If face detection was skipped for any image, show a notice
      if (faceDetectionSkipped) {
        toast({
          title: 'Limited analysis available',
          description: 'Advanced face detection is currently unavailable. Images will be evaluated based on basic quality metrics only.',
          variant: 'default',
          duration: 5000,
        });
      }
      // Warn about images with no faces only if face detection wasn't skipped
      else if (noFaceImages.length > 0) {
        toast({
          title: 'Face detection issue',
          description: noFaceImages.length === 1 
            ? `Face detection had difficulty with "${noFaceImages[0]}". The image may still work if it has good quality.`
            : `Face detection had difficulty with ${noFaceImages.length} images. They may still work if they have good quality.`,
          variant: 'default',
          duration: 6000,
        });
      }
      
      return [files, qualityResults]
    } catch (error) {
      console.error('Error during image analysis:', error)
      toast({
        title: 'Analysis limited',
        description: 'Image quality analysis was limited. All images will be accepted.',
        variant: 'default',
      })
      
      // Return basic quality results for all files, marking them as acceptable
      const basicResults: Record<string, ImageQualityResult> = {}
      files.forEach(file => {
        basicResults[file.name] = {
          score: 0.7,
          isAcceptable: true, // Mark as acceptable to bypass quality checks
          width: 0,
          height: 0,
          hasFace: false,
          faceScore: 0.5,
          brightnessScore: 0.7,
          contrastScore: 0.7,
          blurScore: 0.7,
          resolutionScore: 0.7,
          issues: ['Image analysis unavailable. All images are accepted by default.'],
          faceDetectionSkipped: true
        }
      })
      
      return [files, basicResults]
    } finally {
      setIsAnalyzing(false)
    }
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
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        const validFiles = validateFiles(Array.from(files))
        if (validFiles.length > 0) {
          const [analyzedFiles, qualityResults] = await analyzeImages(validFiles)
          onFilesAdded(analyzedFiles, qualityResults)
        }
      }
    },
    [onFilesAdded]
  )

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        const validFiles = validateFiles(Array.from(files))
        if (validFiles.length > 0) {
          const [analyzedFiles, qualityResults] = await analyzeImages(validFiles)
          onFilesAdded(analyzedFiles, qualityResults)
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
            ) : isAnalyzing ? (
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-xl">
              {isAnalyzing 
                ? 'Analyzing images...' 
                : 'Drag photos here'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isAnalyzing 
                ? 'This may take a few moments' 
                : 'or click to browse from your device'}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Upload photos that clearly show your face for best results
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            multiple
            onChange={handleFileInputChange}
            ref={fileInputRef}
            disabled={isAnalyzing}
          />
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4" 
            onClick={(e) => {
              e.stopPropagation()
              handleButtonClick()
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Processing...' : 'Select Files'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 