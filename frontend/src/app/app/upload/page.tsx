'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRightIcon } from 'lucide-react'

import { FileUploader } from '@/components/upload/file-uploader'
import { UploadedFilesList } from '@/components/upload/uploaded-files-list'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { UploadSummary } from '@/components/upload/upload-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useOrder } from '@/lib/hooks/use-order'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

export default function UploadPage() {
  const { t } = useTranslation('upload')
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const [uploadedCount, setUploadedCount] = useState(0)

  // Custom hooks for managing state
  const { order, styles, isLoading, error } = useOrder()
  const {
    files: selectedFiles,
    fileUrls,
    qualityResults,
    isUploading,
    progress,
    addFiles,
    uploadFile,
    removeFile
  } = useFileUpload({ maxFiles: UPLOAD_CONSTANTS.MAX_IMAGES })

  // Filter accepted images
  const acceptedFiles = selectedFiles.filter(file => 
    qualityResults[file.name]?.isAcceptable
  )

  // Handle upload with streaming response
  const handleUpload = async (filesToUpload: File[]) => {
    if (!order || filesToUpload.length === 0) {
      toast({
        title: t('errors.noActiveOrder'),
        description: t('errors.paymentRequired'),
        variant: 'destructive'
      })
      return
    }

    setUploadedCount(0)
    const results: { originalName: string; url?: string; error?: string }[] = []

    try {
      // Upload files one by one
      for (const file of filesToUpload) {
        try {
          const url = await uploadFile(file, order.id)
          results.push({ originalName: file.name, url })
          setUploadedCount(prev => prev + 1)
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          results.push({ 
            originalName: file.name, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
      }
      
      const failedUploads = results.filter(r => r.error)
      const successfulUploads = results.filter(r => !r.error)

      if (failedUploads.length > 0) {
         toast({
          title: t('errors.someUploadsFailed'),
          description: t('errors.uploadFailed', { count: failedUploads.length }),
          variant: 'destructive'
        })
      }
      if (successfulUploads.length > 0) {
         toast({
          title: t('success.uploadComplete'),
          description: t('status.successful', { count: successfulUploads.length })
        })
      }
      
      // Remove successfully uploaded files from the list
      const successfulFileNames = new Set(successfulUploads.map(r => r.originalName))
      const indicesToRemove = selectedFiles
        .map((file, index) => successfulFileNames.has(file.name) ? index : -1)
        .filter(index => index !== -1)
        .sort((a, b) => b - a)
      
      indicesToRemove.forEach(index => removeFile(index))

      // Save Progress and Navigate if fully successful
      if (failedUploads.length === 0 && successfulUploads.length > 0) {
         try {
            await updateProgress('review', { 
                uploadedFiles: successfulUploads.map(r => r.url).filter(Boolean),
                lastUploadAt: new Date().toISOString()
            })
            router.push('/app/review') 
          } catch (progressError) {
            toast({
               title: t('status.error'),
               description: t('errors.savingProgress'),
               variant: 'destructive' 
            })
            router.push('/app/review')
          }
      }

    } catch (error) {
      console.error('Upload process error:', error)
      toast({
        title: t('status.failed'),
        description: error instanceof Error ? error.message : t('errors.uploadFailed'),
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">{t('status.processing')}</div>
  }

  if (error) {
    return <div className="text-destructive">{t('status.error')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('common.title')}</h2>
        <p className="text-muted-foreground">
          {t('common.description')}
        </p>
      </div>

      <UploadRequirements />
    
      <div className="space-y-6">
        <FileUploader onFilesAdded={addFiles} />
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
              <h3 className="font-medium">{t('fields.acceptedImages')}</h3>
              <span className="text-sm text-muted-foreground">
                {t('status.imagesSelected', { count: acceptedFiles.length })}
              </span>
            </div>
            <UploadedFilesList 
              files={acceptedFiles}
              onRemoveFile={removeFile}
              isUploading={isUploading}
              progress={progress}
              qualityResults={qualityResults}
              variant="accepted"
            />
          </div>

          {selectedFiles.some(file => !qualityResults[file.name]?.isAcceptable) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{t('fields.needsImprovement')}</h3>
                <span className="text-sm text-muted-foreground">
                  {t('status.imagesSelected', { 
                    count: selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable).length 
                  })}
                </span>
              </div>
              <UploadedFilesList 
                files={selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable)}
                onRemoveFile={removeFile}
                isUploading={false}
                progress={0}
                qualityResults={qualityResults}
                variant="rejected"
              />
            </div>
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <UploadSummary 
          acceptedFiles={acceptedFiles}
          totalFiles={selectedFiles.length}
          qualityResults={qualityResults}
        />
      )}

      <div className="flex justify-between items-center mt-8">
        <p className="text-sm text-muted-foreground">
          {acceptedFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES 
            ? t('status.uploadMore', { count: UPLOAD_CONSTANTS.MIN_IMAGES - acceptedFiles.length })
            : acceptedFiles.length > UPLOAD_CONSTANTS.MAX_IMAGES
            ? t('status.removeImages', { count: acceptedFiles.length - UPLOAD_CONSTANTS.MAX_IMAGES })
            : t('status.imagesSelected', { count: acceptedFiles.length })}
        </p>
        
        <Button 
          onClick={() => handleUpload(acceptedFiles)}
          disabled={
            !order || 
            styles.length === 0 || 
            acceptedFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES || 
            acceptedFiles.length > UPLOAD_CONSTANTS.MAX_IMAGES || 
            isUploading
          }
        >
          {isUploading 
            ? t('status.processing', { 
                count: uploadedCount, 
                total: acceptedFiles.length, 
                progress: progress.toFixed(0) 
              })
            : t('buttons.upload', { count: styles.length })}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}