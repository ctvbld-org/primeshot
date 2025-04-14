'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { FileUploader } from '@/components/upload/file-uploader'
import { UploadedFilesList } from '@/components/upload/uploaded-files-list'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { ImageQualityResult } from '@/lib/image-quality'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [hasUnacceptableImages, setHasUnacceptableImages] = useState(false)
  const [acceptedImages, setAcceptedImages] = useState<ImageQualityResult[]>([])
  const [averageScore, setAverageScore] = useState(0)
  
  // Constants
  const MIN_IMAGES = 15 // Minimum required images
  const MAX_IMAGES = 30 // Maximum allowed images

  // Check image quality status whenever files or quality results change
  useEffect(() => {
    if (Object.keys(qualityResults).length === 0) {
      setHasUnacceptableImages(false)
      return
    }
    
    const anyUnacceptable = Object.values(qualityResults).some(result => !result.isAcceptable);
    setHasUnacceptableImages(anyUnacceptable)
  }, [qualityResults, selectedFiles])

  const handleFilesAdded = (files: File[], newQualityResults?: Record<string, ImageQualityResult>) => {
    // Combine with existing files, avoiding duplicates
    const newFiles = files.filter(file => 
      !selectedFiles.some(existing => 
        existing.name === file.name && 
        existing.size === file.size
      )
    )
    
    setSelectedFiles(prev => [...prev, ...newFiles])
    
    // Update quality results
    if (newQualityResults) {
      setQualityResults(prev => ({
        ...prev,
        ...newQualityResults
      }))
    }
  }

  const handleRemoveFile = (index: number) => {
    // Get the file being removed
    const fileToRemove = selectedFiles[index];
    
    // Remove the file
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    
    // Remove its quality result
    if (fileToRemove && qualityResults[fileToRemove.name]) {
      const newQualityResults = { ...qualityResults };
      delete newQualityResults[fileToRemove.name];
      setQualityResults(newQualityResults);
    }
  }

  const handleContinue = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one photo to continue.',
        variant: 'destructive',
      })
      return
    }

    if (hasUnacceptableImages) {
      const confirmContinue = window.confirm(
        'Some images have quality issues that may affect the results. Do you want to continue anyway?'
      )
      
      if (!confirmContinue) {
        return
      }
    }

    // Track upload progress 
    setIsUploading(true)
    setProgress(0)

    try {
      // Here we're just simulating progress for now
      // In task 5.3, we'll implement the actual upload
      await simulateProgress()
      
      // Save user progress to indicate they're in the review stage
      if (user) {
        await saveUserProgress('review');
      }
      
      // Save quality results to session storage for the review page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('qualityResults', JSON.stringify(qualityResults));
      }
      
      // Navigate to review page
      router.push('/app/review')
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'There was a problem uploading your photos. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Temporary function to simulate upload progress
  const simulateProgress = async () => {
    return new Promise<void>((resolve) => {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += 10
        setProgress(currentProgress)
        
        if (currentProgress >= 100) {
          clearInterval(interval)
          resolve()
        }
      }, 300)
    })
  }
  
  // Save user progress to Supabase
  const saveUserProgress = async (stage: string) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          current_stage: stage,
          last_active_at: new Date().toISOString(),
          completed_stages: ['compositions'],
          stage_data: {
            upload: {
              uploadedFiles: selectedFiles.map(f => f.name),
              uploadProgress: 100,
              lastUploadAt: new Date().toISOString()
            }
          }
        });
    } catch (error) {
      console.error('Error saving user progress:', error);
      // Non-critical error, so we don't show a toast
    }
  };

  useEffect(() => {
    const accepted = Object.values(qualityResults).filter(result => result.isAcceptable)
    setAcceptedImages(accepted)
    if (accepted.length > 0) {
      const avgScore = accepted.reduce((sum, result) => sum + result.score, 0) / accepted.length
      setAverageScore(avgScore)
    }
  }, [qualityResults])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Photos</h2>
        <p className="text-muted-foreground">
          Upload photos for your headshot compositions. We'll check them for quality.
        </p>
      </div>

      <div>
        <UploadRequirements />
      </div>
    
      <div className="space-y-6">
        <FileUploader onFilesAdded={handleFilesAdded} />
      </div>

      {selectedFiles.length > 0 && (
        <div className={cn(
          "grid gap-6",
          selectedFiles.some(file => !qualityResults[file.name]?.isAcceptable)
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1"
        )}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Accepted Images</h3>
              <span className="text-sm text-muted-foreground">
                {acceptedImages.length} images
              </span>
            </div>
            <UploadedFilesList 
              files={selectedFiles.filter(file => qualityResults[file.name]?.isAcceptable)}
              onRemoveFile={handleRemoveFile}
              isUploading={isUploading}
              progress={progress}
              qualityResults={qualityResults}
              variant="accepted"
            />
          </div>

          {selectedFiles.some(file => !qualityResults[file.name]?.isAcceptable) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Rejected Images</h3>
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length - acceptedImages.length} images
                </span>
              </div>
              <UploadedFilesList 
                files={selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable)}
                onRemoveFile={handleRemoveFile}
                isUploading={isUploading}
                progress={progress}
                qualityResults={qualityResults}
                variant="rejected"
              />
            </div>
          )}
        </div>
      )}

      {acceptedImages.length > 0 && (
        <div className="bg-card border rounded-md p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Upload Status</h3>
              <div className="text-sm text-muted-foreground">
                {acceptedImages.length}/{MIN_IMAGES} required images
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Average Quality Score</span>
                <span className="font-medium">
                  {Math.round(averageScore)}%
                </span>
              </div>
              <Progress 
                value={averageScore} 
                className={cn(
                  "h-2",
                  averageScore >= 70 ? "bg-green-500" :
                  averageScore >= 50 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Upload Progress</span>
                <span className="font-medium">
                  {acceptedImages.length} of {MIN_IMAGES} required
                </span>
              </div>
              <Progress 
                value={(acceptedImages.length / MIN_IMAGES) * 100} 
                className={cn(
                  "h-2",
                  acceptedImages.length >= MIN_IMAGES ? "bg-green-500" : "bg-blue-500"
                )}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <p className="text-sm text-muted-foreground">
          {acceptedImages.length < MIN_IMAGES 
            ? `Please upload ${MIN_IMAGES - acceptedImages.length} more ${MIN_IMAGES - acceptedImages.length === 1 ? 'image' : 'images'} to continue`
            : acceptedImages.length > MAX_IMAGES
            ? `Please remove ${acceptedImages.length - MAX_IMAGES} ${acceptedImages.length - MAX_IMAGES === 1 ? 'image' : 'images'} to continue`
            : `${acceptedImages.length} images selected`}
        </p>
        
        <Button 
          onClick={handleContinue}
          disabled={acceptedImages.length < MIN_IMAGES || acceptedImages.length > MAX_IMAGES || isUploading}
        >
          {isUploading ? `Uploading (${progress}%)` : 'Continue'}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
} 