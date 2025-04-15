'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { FileUploader } from './file-uploader'
import { ImageQualityScore } from './image-quality-score'
import { ImageQualityResult } from '@/lib/image-quality'
import { useToast } from '@/components/ui/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2Icon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { InfoIcon } from 'lucide-react'
import { FilePreview } from './file-preview'

interface UploaderProps {
  onUpload: (files: File[]) => void
}

export function Uploader({ onUpload }: UploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()

  // Filter files based on quality
  const acceptableFiles = selectedFiles.filter(file => 
    qualityResults[file.name]?.isAcceptable === true
  )
  
  const unacceptableFiles = selectedFiles.filter(file => 
    qualityResults[file.name]?.isAcceptable === false
  )
  
  // Count files with no faces
  const noFaceFiles = selectedFiles.filter(file => 
    qualityResults[file.name] && 
    !qualityResults[file.name].hasFace && 
    !qualityResults[file.name].faceDetectionSkipped
  )

  // Handle file addition
  const handleFilesAdded = (files: File[], results?: Record<string, ImageQualityResult>) => {
    const existingFileNames = selectedFiles.map(file => file.name)
    const uniqueFiles = files.filter(file => !existingFileNames.includes(file.name))
    
    if (uniqueFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...uniqueFiles])
      
      if (results) {
        setQualityResults(prev => ({ ...prev, ...results }))
      }
      
      toast({
        title: `${uniqueFiles.length} files added`,
        description: 'Your photos have been added to the upload queue.',
      })
    } else if (files.length > 0) {
      toast({
        title: 'Duplicate files',
        description: 'All files were already added to the upload queue.',
        variant: 'destructive',
      })
    }
  }

  // Remove a file
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

  // Handle file upload
  const handleUpload = () => {
    const filesToUpload = activeTab === 'acceptable' ? acceptableFiles : selectedFiles
    
    if (filesToUpload.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Please add files to the upload queue.',
        variant: 'destructive',
      })
      return
    }
    
    // Warn if trying to upload images with no faces detected
    if (activeTab === 'all' && noFaceFiles.length > 0) {
      toast({
        title: 'Some images may need attention',
        description: `Our system had trouble detecting faces in ${noFaceFiles.length} image(s). You can still proceed, and we'll do our best to process them.`,
        variant: 'default',
        duration: 5000,
      })
    }
    
    onUpload(filesToUpload)
  }

  return (
    <div className="space-y-4">
      {selectedFiles.length === 0 ? (
        <FileUploader onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">
                  All Files
                  <Badge variant="outline" className="ml-2">{selectedFiles.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="acceptable">
                  Recommended
                  <Badge variant="outline" className="ml-2">{acceptableFiles.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unacceptable">
                  Needs Improvement
                  <Badge variant="outline" className="ml-2">{unacceptableFiles.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <Button size="sm" variant="ghost" onClick={() => setSelectedFiles([])}>
                Clear All
              </Button>
            </div>
            
            {/* Alert for non-face images */}
            {noFaceFiles.length > 0 && (
              <Alert variant="default" className="mt-4 bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-800">Face Detection Advisory</AlertTitle>
                <AlertDescription className="text-amber-700">
                  {noFaceFiles.length === 1 
                    ? "Our system had difficulty detecting a face in one image. This is often a technical limitation rather than an issue with your photo. You can still proceed, and we'll do our best to process your image."
                    : `Our system had difficulty detecting faces in ${noFaceFiles.length} images. This is often a technical limitation rather than an issue with your photos. You can still proceed, and we'll do our best to process your images.`}
                </AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {selectedFiles.map((file, index) => (
                  <FilePreview
                    key={file.name + index}
                    file={file}
                    qualityResult={qualityResults[file.name]}
                    onRemove={() => handleRemoveFile(index)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="acceptable" className="mt-4">
              {acceptableFiles.length === 0 ? (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>No recommended photos</AlertTitle>
                  <AlertDescription>
                    None of your uploaded photos meet the recommended quality criteria.
                    Try uploading a clearer photo where your face is visible and well-lit.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {acceptableFiles.map((file, index) => (
                    <FilePreview
                      key={file.name + index}
                      file={file}
                      qualityResult={qualityResults[file.name]}
                      onRemove={() => handleRemoveFile(selectedFiles.findIndex(f => f.name === file.name))}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="unacceptable" className="mt-4">
              {unacceptableFiles.length === 0 ? (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>No low-quality photos</AlertTitle>
                  <AlertDescription>
                    Great! All your photos meet the recommended quality criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {unacceptableFiles.map((file, index) => (
                    <FilePreview
                      key={file.name + index}
                      file={file}
                      qualityResult={qualityResults[file.name]}
                      onRemove={() => handleRemoveFile(selectedFiles.findIndex(f => f.name === file.name))}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setActiveTab('all')}>
              Add More Photos
            </Button>
            <Button onClick={handleUpload}>
              {activeTab === 'acceptable' 
                ? `Upload ${acceptableFiles.length} Recommended File${acceptableFiles.length !== 1 ? 's' : ''}`
                : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 