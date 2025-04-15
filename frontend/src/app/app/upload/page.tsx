'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/upload/file-uploader'
import { UploadedFilesList } from '@/components/upload/uploaded-files-list'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { ImageQualityResult } from '@/lib/image-quality'
import type { Order, Composition } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Constants for image limits
const MIN_IMAGES = 15
const MAX_IMAGES = 30

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [order, setOrder] = useState<Order | null>(null)
  const [compositions, setCompositions] = useState<Composition[]>([])
  const { toast } = useToast()

  // Load active order and its compositions
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

        // TODO: Change toast to redirect to payment page once payment is implemented
        if (!orderData) {
          toast({
            title: 'No active order found',
            description: 'Please complete payment before uploading photos.',
            variant: 'destructive'
          })
          router.push('/app/compositions')
          return
        }

        setOrder(orderData)

        // Get compositions for this order
        const { data: compositionsData, error: compositionsError } = await supabase
          .from('compositions')
          .select()
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: true })

        if (compositionsError) throw compositionsError
        setCompositions(compositionsData || [])

      } catch (error) {
        console.error('Error loading order data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load order data. Please try again.',
          variant: 'destructive'
        })
      }
    }

    loadOrderData()
  }, [user, router, toast])

  // Filter accepted images
  const acceptedFiles = selectedFiles.filter(file => 
    qualityResults[file.name]?.isAcceptable
  )

  // Handle files added
  const handleFilesAdded = (files: File[], results?: Record<string, ImageQualityResult>) => {
    setSelectedFiles(prev => [...prev, ...files])
    if (results) {
      setQualityResults(prev => ({ ...prev, ...results }))
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const fileName = prev[index]?.name
      const updatedFiles = prev.filter((_, i) => i !== index)
      
      // Also remove from quality results
      if (fileName && qualityResults[fileName]) {
        const newResults = { ...qualityResults }
        delete newResults[fileName]
        setQualityResults(newResults)
      }
      
      return updatedFiles
    })
  }

  // Handle upload
  const handleUpload = async (files: File[]) => {
    if (!order) {
      toast({
        title: 'No active order',
        description: 'Please complete payment before uploading photos.',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      // Upload files for each composition
      const results = []
      const totalUploads = files.length * compositions.length
      let completedUploads = 0

      for (const composition of compositions) {
        for (const file of files) {
          // Create form data
          const formData = new FormData()
          formData.append('files', file)
          formData.append('compositionId', composition.id)

          // Upload file
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Upload failed')
          }

          const data = await response.json()
          results.push(...data.results)

          // Update progress
          completedUploads++
          setProgress((completedUploads / totalUploads) * 100)
        }
      }

      // Check for any failed uploads
      const failedUploads = results.filter((result: any) => result.error)
      if (failedUploads.length > 0) {
        toast({
          title: 'Some uploads failed',
          description: `${failedUploads.length} files failed to upload. Please try again.`,
          variant: 'destructive'
        })
      }

      // Show success message for successful uploads
      const successfulUploads = results.filter((result: any) => !result.error)
      if (successfulUploads.length > 0) {
        toast({
          title: 'Upload complete',
          description: `Successfully uploaded ${successfulUploads.length} files across ${compositions.length} compositions.`
        })
      }

      // Clear files that were successfully uploaded
      const successfulFileNames = new Set(successfulUploads.map((result: any) => result.originalName))
      setSelectedFiles(prev => prev.filter(file => !successfulFileNames.has(file.name)))

      // If all uploads were successful, proceed to review
      if (failedUploads.length === 0) {
        router.push('/app/review')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Photos</h2>
        <p className="text-muted-foreground">
          Upload photos for your headshot compositions. We'll check them for quality.
        </p>
      </div>

      {order && compositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Order ID: {order.id}</p>
              <p>Compositions: {compositions.length}</p>
              <p className="text-sm text-muted-foreground">
                Your photos will be processed for each composition style.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                {acceptedFiles.length} images
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
                <h3 className="font-medium">Needs Improvement</h3>
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable).length} images
                </span>
              </div>
              <UploadedFilesList 
                files={selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable)}
                onRemoveFile={handleRemoveFile}
                isUploading={false}
                progress={0}
                qualityResults={qualityResults}
                variant="rejected"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <p className="text-sm text-muted-foreground">
          {acceptedFiles.length < MIN_IMAGES 
            ? `Please upload ${MIN_IMAGES - acceptedFiles.length} more ${MIN_IMAGES - acceptedFiles.length === 1 ? 'image' : 'images'} to continue`
            : acceptedFiles.length > MAX_IMAGES
            ? `Please remove ${acceptedFiles.length - MAX_IMAGES} ${acceptedFiles.length - MAX_IMAGES === 1 ? 'image' : 'images'} to continue`
            : `${acceptedFiles.length} images selected`}
        </p>
        
        <Button 
          onClick={() => handleUpload(acceptedFiles)}
          disabled={
            !order || 
            compositions.length === 0 || 
            acceptedFiles.length < MIN_IMAGES || 
            acceptedFiles.length > MAX_IMAGES || 
            isUploading
          }
        >
          {isUploading 
            ? `Uploading (${progress.toFixed(1)}%)`
            : `Upload for ${compositions.length} Composition${compositions.length !== 1 ? 's' : ''}`}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}