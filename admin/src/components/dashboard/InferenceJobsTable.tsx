'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fetchGeneratedImages, type InferenceJobWithDetails, type GeneratedImage } from '@/lib/api/adminUserDetails'
import { ImageGalleryViewer } from './ImageGalleryViewer'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Button } from '@primeshot/common/web/ui/button'

interface InferenceJobsTableProps {
  jobs: InferenceJobWithDetails[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'running':
    case 'pending':
    case 'queued':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function InferenceJobsTable({ jobs, isLoading, onLoadMore, hasMore, isLoadingMore }: InferenceJobsTableProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  const { data: generatedImages, isLoading: isLoadingImages } = useQuery({
    queryKey: ['generated-images', expandedJobId],
    queryFn: () => {
      if (!expandedJobId) return Promise.resolve([])
      return fetchGeneratedImages(expandedJobId)
    },
    enabled: !!expandedJobId,
  })

  const toggleExpanded = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No inference jobs found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const isExpanded = expandedJobId === job.id

        return (
          <div key={job.id} className="border rounded-lg overflow-hidden bg-card">
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(job.id)}
            >
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-2">
                {job.style?.preview_images && job.style.preview_images.length > 0 && (
                  <img 
                    src={job.style.preview_images[0]} 
                    alt={job.style.name}
                    className="h-12 w-12 rounded object-cover border"
                    title={`Style: ${job.style.name}`}
                  />
                )}
                {job.wardrobe?.image && (
                  <img 
                    src={job.wardrobe.image} 
                    alt={job.wardrobe.label}
                    className="h-12 w-12 rounded object-cover border"
                    title={`Wardrobe: ${job.wardrobe.label}`}
                  />
                )}
                {job.scene?.image && (
                  <img 
                    src={job.scene.image} 
                    alt={job.scene.label}
                    className="h-12 w-12 rounded object-cover border"
                    title={`Scene: ${job.scene.label}`}
                  />
                )}
                {job.color && job.color.color && (
                  <div 
                    className="h-12 w-12 rounded border"
                    style={{ backgroundColor: job.color.color }}
                    title={`Color: ${job.color.label}`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(job.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Character</p>
                  <p className="font-medium truncate">{job.character?.name || 'N/A'}</p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Style</p>
                  <p className="font-medium truncate">{job.style?.name || 'N/A'}</p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Details</p>
                  <div className="flex flex-wrap gap-1">
                    {job.quality && (
                      <Badge variant="outline" className="text-xs">
                        {job.quality}
                      </Badge>
                    )}
                    {job.nb_takes && (
                      <Badge variant="outline" className="text-xs">
                        {job.nb_takes}x
                      </Badge>
                    )}
                    {job.aspect_ratio && (
                      <Badge variant="outline" className="text-xs">
                        {job.aspect_ratio}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Badge variant={getStatusVariant(job.status)}>
                    {job.status}
                  </Badge>
                </div>

                <div className="text-muted-foreground">
                  {job.credits_spent !== null && job.credits_spent !== undefined && (
                    <p className="text-xs">
                      Credits: <span className="font-medium">{job.credits_spent}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t bg-muted/20">
                {isLoadingImages ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ImageGalleryViewer
                    images={(generatedImages || []).map(img => ({
                      id: img.id,
                      url: img.web_path || img.original_path || '',
                      width: img.width,
                      height: img.height,
                      file_size: img.bytes,
                      seed: img.seed,
                      format: img.format,
                    }))}
                    title={`Generated Images (${generatedImages?.length || 0})`}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

