'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { FileUploader } from '@/components/upload/file-uploader'
import { UploadedFilesList } from '@/components/upload/uploaded-files-list'
import { UploadRequirements } from '@/components/upload/upload-requirements'

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFilesAdded = (files: File[]) => {
    // Combine with existing files, avoiding duplicates
    const newFiles = files.filter(file => 
      !uploadedFiles.some(existing => 
        existing.name === file.name && 
        existing.size === file.size
      )
    )
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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

    // Track upload progress 
    setIsUploading(true)
    setProgress(0)

    try {
      // Here we're just simulating progress for now
      // In task 5.3, we'll implement the actual upload
      await simulateProgress()
      
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
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/app/compositions')}
          disabled={isUploading}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        
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