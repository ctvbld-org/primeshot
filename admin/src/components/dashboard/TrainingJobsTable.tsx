'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Loader2, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { fetchTrainingImages, type TrainingJobWithDetails, type UploadedImage } from '@/lib/api/adminUserDetails'
import { ImageGalleryViewer } from './ImageGalleryViewer'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Avatar } from '@primeshot/common/web/ui/avatar'
import { Button } from '@primeshot/common/web/ui/button'

interface TrainingJobsTableProps {
  jobs: TrainingJobWithDetails[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

function getCharacterStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'deleted':
      return 'bg-gray-500 text-white'
    case 'ready':
      return 'bg-green-500 text-white'
    case 'failed':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-400 text-white'
  }
}

export function TrainingJobsTable({ jobs, isLoading, onLoadMore, hasMore, isLoadingMore }: TrainingJobsTableProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const { data: uploadedImages, isLoading: isLoadingImages } = useQuery({
    queryKey: ['training-images', expandedJobId],
    queryFn: () => {
      const job = jobs.find(j => j.id === expandedJobId)
      if (!job?.character_id) return Promise.resolve([])
      return fetchTrainingImages(job.character_id)
    },
    enabled: !!expandedJobId,
  })

  const toggleExpanded = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  const copyToClipboard = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No training jobs found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const isExpanded = expandedJobId === job.id
        const character = job.character
        const initials = character?.name?.[0]?.toUpperCase() || 'C'

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

              <Avatar
                src={character?.thumbnail_url || undefined}
                fallback={
                  <span className="text-sm font-medium">{initials}</span>
                }
                className="!h-8 !w-8"
              />

              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{character?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {character?.status && (
                    <Badge className={getCharacterStatusColor(character.status)}>
                      {character.status}
                    </Badge>
                  )}
                </div>

                <div className="min-w-0 col-span-2">
                  {character?.lora_path ? (
                    <div className="flex items-center gap-2 group">
                      <p className="text-sm truncate font-mono text-muted-foreground flex-1">
                        {character.lora_path}
                      </p>
                      <button
                        onClick={(e) => copyToClipboard(character.lora_path!, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                        title="Copy path"
                      >
                        {copiedPath === character.lora_path ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No LoRA path</p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {job.completed_at && (
                    <span>
                      Duration: {Math.round(
                        (new Date(job.completed_at).getTime() - 
                         new Date(job.created_at).getTime()) / 1000 / 60
                      )} min
                    </span>
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
                    images={(uploadedImages || []).map(img => ({
                      id: img.id,
                      url: img.url,
                      width: img.dimensions?.width,
                      height: img.dimensions?.height,
                      file_size: img.file_size,
                      quality_score: img.quality_score,
                    }))}
                    title={`Uploaded Training Images (${uploadedImages?.length || 0})`}
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

