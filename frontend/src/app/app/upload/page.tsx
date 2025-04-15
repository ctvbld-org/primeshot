'use client'

import React, { useState, useEffect, useRef } from 'react'
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
import { useUserProgress } from '@/hooks/use-user-progress'

// Constants for image limits
const MIN_IMAGES = 12
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
  const [uploadedCount, setUploadedCount] = useState(0)
  const { updateProgress } = useUserProgress()

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
          .eq('status', 'draft')
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

  // Handle upload with streaming response
  const handleUpload = async (files: File[]) => {
    if (!order || files.length === 0) {
      toast({
        title: 'No active order',
        description: 'Please complete payment before uploading photos.',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    setProgress(0)
    setUploadedCount(0) // Reset count
    const totalFiles = files.length
    const results: { originalName: string; url?: string; error?: string }[] = []

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok || !response.body) {
        let errorMsg = 'Upload failed to start.'
        try {
           const errorData = await response.json()
           errorMsg = errorData.error || errorMsg
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg)
      }

      // Read the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
            console.log('Stream finished.')
            break
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Process buffer line by line (newline-delimited JSON)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue
          try {
            const result = JSON.parse(line)
            console.log('Parsed result from stream:', result)
            results.push(result)
            
            // Update progress based on count
            setUploadedCount(prev => {
                const newCount = prev + 1;
                // Update progress bar (0-99% based on file count)
                setProgress(Math.min((newCount / totalFiles) * 100, 99)); 
                return newCount;
            });

          } catch (e) {
            console.error('Error parsing streamed JSON line:', line, e)
            // Handle potential parsing errors if needed
          }
        }
      }
      
      // Final processing after stream ends
      setProgress(100) // Set to 100%
      
      const failedUploads = results.filter(r => r.error)
      const successfulUploads = results.filter(r => !r.error)

      if (failedUploads.length > 0) {
         toast({
          title: 'Some uploads failed',
          description: `${failedUploads.length} files failed to upload. Please try again.`,
          variant: 'destructive'
        })
      }
      if (successfulUploads.length > 0) {
         toast({
          title: 'Upload complete',
          description: `Successfully uploaded ${successfulUploads.length} images.`
        })
      }
      
      const successfulFileNames = new Set(successfulUploads.map(r => r.originalName))
      setSelectedFiles(prev => prev.filter(file => !successfulFileNames.has(file.name)))

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
               title: 'Error Saving Progress',
               description: 'Upload complete, but failed to save progress. Please proceed manually if needed.',
               variant: 'destructive' 
            })
            router.push('/app/review') // Still navigate? 
          }
      } else {
          console.warn('Upload completed with errors or no successes, not navigating.')
      }

    } catch (error) {
      console.error('Upload process error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive'
      })
      setProgress(0)
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

      {selectedFiles.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Overall Quality Score</h3>
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
                  <span>Total Images</span>
                  <span>{selectedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Accepted Images</span>
                  <span className="text-green-600">{acceptedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rejected Images</span>
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
            ? `Processing ${uploadedCount}/${acceptedFiles.length} (${progress.toFixed(0)}%)...` 
            : `Upload for ${compositions.length} Composition${compositions.length !== 1 ? 's' : ''}`}
          {!isUploading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}