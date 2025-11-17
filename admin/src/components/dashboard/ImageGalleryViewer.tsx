'use client'

import { useState } from 'react'
import { X, Download, ZoomIn } from 'lucide-react'
import { Dialog, DialogContent } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'

interface ImageData {
  id: string
  url: string
  width?: number | null
  height?: number | null
  file_size?: number | null
  quality_score?: number | null
  seed?: number | null
  format?: string | null
}

interface ImageGalleryViewerProps {
  images: ImageData[]
  title: string
  isLoading?: boolean
}

export function ImageGalleryViewer({ images, title, isLoading }: ImageGalleryViewerProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No images found
      </div>
    )
  }

  const handleDownload = async (image: ImageData) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${image.id}.${image.format || 'png'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <>
      <div className="p-6 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load image:', image.url);
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center h-full text-destructive text-xs p-2 text-center';
                    errorDiv.textContent = 'Failed to load';
                    parent.appendChild(errorDiv);
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white" />
              </div>
              {image.quality_score !== undefined && image.quality_score !== null && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Q: {image.quality_score.toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0">
          {selectedImage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-16 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <img
                src={selectedImage.url}
                alt=""
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="p-4 bg-background border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {selectedImage.width && selectedImage.height && (
                    <div>
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span className="ml-2 font-medium">
                        {selectedImage.width} × {selectedImage.height}
                      </span>
                    </div>
                  )}
                  {selectedImage.file_size && (
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 font-medium">
                        {(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  {selectedImage.format && (
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <span className="ml-2 font-medium uppercase">
                        {selectedImage.format}
                      </span>
                    </div>
                  )}
                  {selectedImage.seed !== undefined && selectedImage.seed !== null && (
                    <div>
                      <span className="text-muted-foreground">Seed:</span>
                      <span className="ml-2 font-medium">{selectedImage.seed}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

