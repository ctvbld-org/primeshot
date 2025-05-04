'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/upload/file-uploader'
import { UploadedFilesList } from '@/components/upload/uploaded-files-list'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Order, Style } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useTranslation } from 'react-i18next'

// Constants for image limits
const MIN_IMAGES = 12
const MAX_IMAGES = 30

export default function UploadPage() {
  const { t } = useTranslation('upload')
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()

  // Use the hook for file state management
  const {
    files: selectedFiles,
    fileUrls,
    qualityResults,
    isUploading,
    progress,
    addFiles,
    uploadFile,
    removeFile
  } = useFileUpload({ maxFiles: MAX_IMAGES })

  // State specific to this page
  const [order, setOrder] = useState<Order | null>(null)
  const [styles, setStyles] = useState<Style[]>([])
  const [uploadedCount, setUploadedCount] = useState(0)

  // Load active order and its styles
  useEffect(() => {
    async function loadOrderData() {
      if (!user) return

      const supabase = createClient()

      try {
        // Get the most recent paid order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (orderError) throw orderError

        if (!orderData) {
          toast({
            title: t('errors.noActiveOrder'),
            description: t('errors.paymentRequired'),
            variant: 'destructive'
          })
          router.push('/app/shoot')
          return
        }

        setOrder(orderData)

        // Get styles for this order
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select()
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: true })

        if (stylesError) throw stylesError
        setStyles(stylesData || [])

      } catch (error) {
        console.error('Error loading order data:', error)
        toast({
          title: t('status.error'),
          description: t('errors.loadOrderData'),
          variant: 'destructive'
        })
      }
    }

    loadOrderData()
  }, [user, router, toast, t])

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
    const totalFiles = filesToUpload.length
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
      
      const successfulFileNames = new Set(successfulUploads.map(r => r.originalName))
      const indicesToRemove: number[] = []
      selectedFiles.forEach((file, index) => {
        if (successfulFileNames.has(file.name)) {
          indicesToRemove.push(index)
        }
      })
      // Remove starting from the highest index to avoid messing up indices
      indicesToRemove.sort((a, b) => b - a).forEach(index => {
        removeFile(index)
      })

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
      } else {
          console.warn('Upload completed with errors or no successes, not navigating.')
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('common.title')}</h2>
        <p className="text-muted-foreground">
          {t('common.description')}
        </p>
      </div>

      {order && styles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('common.order.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>{t('fields.orderId')}: {order.id}</p>
              <p>{t('fields.styles')}: {styles.length}</p>
              <p className="text-sm text-muted-foreground">
                {t('common.order.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <UploadRequirements />
      </div>
    
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
              files={selectedFiles.filter(file => qualityResults[file.name]?.isAcceptable)}
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
                  {t('status.imagesSelected', { count: selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable).length })}
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
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t('fields.overallQualityScore')}</h3>
                {acceptedFiles.length > 0 && (
                  <span className={cn(
                    "text-sm font-medium",
                    acceptedFiles.length >= MIN_IMAGES ? "text-green-600" : "text-yellow-600"
                  )}>
                    {(acceptedFiles
                      .reduce((sum, file) => sum + (qualityResults[file.name]?.score || 0), 0) / acceptedFiles.length)
                      .toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      acceptedFiles.length >= MIN_IMAGES ? "bg-green-600" : "bg-yellow-600"
                    )}
                    style={{ 
                      width: `${(acceptedFiles
                        .reduce((sum, file) => sum + (qualityResults[file.name]?.score || 0), 0) / acceptedFiles.length)}%` 
                    }}
                  ></div>
                </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('fields.totalImages')}</span>
                  <span>{selectedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('fields.acceptedImagesCount')}</span>
                  <span className="text-green-600">{acceptedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('fields.rejectedImagesCount')}</span>
                  <span className="text-red-600">
                    {selectedFiles.length - acceptedFiles.length}
                  </span>
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mt-8">
        <p className="text-sm text-muted-foreground">
          {acceptedFiles.length < MIN_IMAGES 
            ? t('status.uploadMore', { count: MIN_IMAGES - acceptedFiles.length })
            : acceptedFiles.length > MAX_IMAGES
            ? t('status.removeImages', { count: acceptedFiles.length - MAX_IMAGES })
            : t('status.imagesSelected', { count: acceptedFiles.length })}
        </p>
        
        <Button 
          onClick={() => handleUpload(acceptedFiles)}
          disabled={
            !order || 
            styles.length === 0 || 
            acceptedFiles.length < MIN_IMAGES || 
            acceptedFiles.length > MAX_IMAGES || 
            isUploading
          }
        >
          {isUploading 
            ? t('status.processing', { count: uploadedCount, total: acceptedFiles.length, progress: progress.toFixed(0) })
            : t('buttons.upload', { count: styles.length })}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}