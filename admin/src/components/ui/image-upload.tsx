'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@primeshot/common/web/ui/button'
import { Progress } from '@primeshot/common/web/ui/progress'
import { toast } from 'sonner'
import { uploadImageToS3 } from '@/lib/upload'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  uploadPath: string
  maxFiles?: number
  maxSizeMB?: number
}

export function ImageUpload({
  value,
  onChange,
  uploadPath,
  maxFiles = 1,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (value.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} images`)
        return
      }

      setIsUploading(true)
      const newUrls: string[] = []

      try {
        for (const file of acceptedFiles) {
          if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`${file.name} is too large. Max size is ${maxSizeMB}MB`)
            continue
          }

          // Upload and convert to WebP
          const url = await uploadImageToS3(
            file,
            uploadPath,
            (progress) => {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: progress,
              }))
            }
          )

          newUrls.push(url)
        }

        onChange([...value, ...newUrls])
        toast.success(`Uploaded ${newUrls.length} image(s) successfully`)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload images')
      } finally {
        setIsUploading(false)
        setUploadProgress({})
      }
    },
    [value, onChange, uploadPath, maxFiles, maxSizeMB]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: maxFiles - value.length,
    disabled: isUploading || value.length >= maxFiles,
  })

  const removeImage = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-gray-400'
        } ${
          isUploading || value.length >= maxFiles
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the images here'
            : `Drag & drop images here, or click to select`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {maxFiles - value.length} of {maxFiles} slots available
        </p>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <div key={filename} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="truncate">{filename}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ))}

      {/* Preview Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and converting to WebP...
        </div>
      )}
    </div>
  )
}