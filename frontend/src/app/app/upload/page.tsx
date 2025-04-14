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

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [hasUnacceptableImages, setHasUnacceptableImages] = useState(false)

  // Check image quality status whenever files or quality results change
  useEffect(() => {
    if (Object.keys(qualityResults).length === 0) {
      setHasUnacceptableImages(false)
      return
    }
    
    const anyUnacceptable = Object.values(qualityResults).some(result => !result.isAcceptable);
    setHasUnacceptableImages(anyUnacceptable)
  }, [qualityResults, uploadedFiles])

  const handleFilesAdded = (files: File[], newQualityResults?: Record<string, ImageQualityResult>) => {
    // Combine with existing files, avoiding duplicates
    const newFiles = files.filter(file => 
      !uploadedFiles.some(existing => 
        existing.name === file.name && 
        existing.size === file.size
      )
    )
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
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
    const fileToRemove = uploadedFiles[index];
    
    // Remove the file
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    
    // Remove its quality result
    if (fileToRemove && qualityResults[fileToRemove.name]) {
      const newQualityResults = { ...qualityResults };
      delete newQualityResults[fileToRemove.name];
      setQualityResults(newQualityResults);
    }
  }

  const handleContinue = async () => {
    if (uploadedFiles.length === 0) {
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
              uploadedFiles: uploadedFiles.map(f => f.name),
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Photos</h2>
        <p className="text-muted-foreground">
          Upload photos for your headshot compositions. We'll check them for quality.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <FileUploader onFilesAdded={handleFilesAdded} />
          <UploadRequirements />
        </div>

        <div>
          <UploadedFilesList 
            files={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            isUploading={isUploading}
            progress={progress}
            qualityResults={qualityResults}
          />
        </div>
      </div>

      {hasUnacceptableImages && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800">
          <h3 className="font-medium mb-1">Quality issues detected</h3>
          <p className="text-sm">
            Some of your photos have quality issues that might affect the results. Expand each photo
            to see details. You can either replace these images or continue with reduced quality.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6">        
        <Button 
          onClick={handleContinue}
          disabled={uploadedFiles.length === 0 || isUploading}
        >
          {isUploading ? `Uploading (${progress}%)` : 'Continue'}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
} 