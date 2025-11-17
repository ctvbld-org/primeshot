import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@primeshot/common/web/ui/dialog'
import { SegmentedControl } from '@primeshot/common/web/ui/segmented-control'
import { Avatar } from '@primeshot/common/web/ui/avatar'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Loader2 } from 'lucide-react'
import { fetchUserTrainingJobs, fetchUserInferenceJobs, type TrainingJobWithDetails, type InferenceJobWithDetails } from '@/lib/api/adminUserDetails'
import { TrainingJobsTable } from './TrainingJobsTable'
import { InferenceJobsTable } from './InferenceJobsTable'

interface UserDetailsDialogProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    generation_count: number
    training_count: number
    subscription_plan: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getPlanBadgeVariant(plan: string | null): "default" | "secondary" | "outline" {
  if (!plan) return "outline"
  if (plan.includes('pro') || plan.includes('tier_3') || plan.includes('ultimate')) return "default"
  if (plan.includes('standard') || plan.includes('tier_2')) return "secondary"
  return "outline"
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<'training' | 'inference'>('training')
  const [trainingOffset, setTrainingOffset] = useState(0)
  const [inferenceOffset, setInferenceOffset] = useState(0)
  const [allTrainingJobs, setAllTrainingJobs] = useState<TrainingJobWithDetails[]>([])
  const [allInferenceJobs, setAllInferenceJobs] = useState<InferenceJobWithDetails[]>([])

  const { data: trainingData, isLoading: isLoadingTraining } = useQuery({
    queryKey: ['user-training-jobs', user?.id, trainingOffset],
    queryFn: async () => {
      if (!user?.id) return { data: [], hasMore: false }
      return fetchUserTrainingJobs(user.id, { offset: trainingOffset, limit: 20 })
    },
    enabled: open && !!user?.id && activeTab === 'training',
  })

  const { data: inferenceData, isLoading: isLoadingInference } = useQuery({
    queryKey: ['user-inference-jobs', user?.id, inferenceOffset],
    queryFn: async () => {
      if (!user?.id) return { data: [], hasMore: false }
      return fetchUserInferenceJobs(user.id, { offset: inferenceOffset, limit: 20 })
    },
    enabled: open && !!user?.id && activeTab === 'inference',
  })

  // Update accumulated jobs when new data arrives
  useEffect(() => {
    if (trainingData) {
      if (trainingOffset === 0) {
        setAllTrainingJobs(trainingData.data)
      } else {
        setAllTrainingJobs(prev => [...prev, ...trainingData.data])
      }
    }
  }, [trainingData, trainingOffset])

  useEffect(() => {
    if (inferenceData) {
      if (inferenceOffset === 0) {
        setAllInferenceJobs(inferenceData.data)
      } else {
        setAllInferenceJobs(prev => [...prev, ...inferenceData.data])
      }
    }
  }, [inferenceData, inferenceOffset])

  const handleLoadMoreTraining = useCallback(() => {
    setTrainingOffset(prev => prev + 20)
  }, [])

  const handleLoadMoreInference = useCallback(() => {
    setInferenceOffset(prev => prev + 20)
  }, [])

  // Reset pagination when dialog opens or user changes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setTrainingOffset(0)
      setInferenceOffset(0)
      setAllTrainingJobs([])
      setAllInferenceJobs([])
    }
    onOpenChange(newOpen)
  }, [onOpenChange])

  if (!user) return null

  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user.email[0].toUpperCase()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent fullscreen className="justify-start">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col bg-background rounded-lg shadow-lg overflow-hidden">
          <DialogHeader className="fixed top-0 left-0 right-0 px-6 py-4 border-b flex-shrink-0 bg-background">
            <div className="flex items-center justify-center gap-4">
              <Avatar
                src={user.avatar_url}
                fallback={
                  <span className="text-lg font-medium">{initials}</span>
                }
                className="!h-8 !w-8"
              />
              <div className="flex-1 min-w-0 flex items-left gap-2">
                <DialogTitle className="text-xl font-semibold truncate flex items-left">
                  {user.full_name || user.email}
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user.subscription_plan && (
                    <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                      {user.subscription_plan.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {user.generation_count} generations • {user.training_count} trainings
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="border-b bg-background py-4 px-6 flex justify-center">
              <SegmentedControl
                value={activeTab}
                onChange={(value: string | number) => setActiveTab(value as 'training' | 'inference')}
                options={[
                  {
                    value: 'training',
                    content: `Training Jobs${allTrainingJobs.length > 0 ? ` (${allTrainingJobs.length}${trainingData?.hasMore ?? false ? '+' : ''})` : ''}`
                  },
                  {
                    value: 'inference',
                    content: `Inference Jobs${allInferenceJobs.length > 0 ? ` (${allInferenceJobs.length}${inferenceData?.hasMore ?? false ? '+' : ''})` : ''}`
                  }
                ]}
              />
            </div>

            <div className="flex-1 overflow-y-auto bg-background">
              <div className="p-6">
                {activeTab === 'training' ? (
                  <TrainingJobsTable 
                    jobs={allTrainingJobs} 
                    isLoading={isLoadingTraining && trainingOffset === 0}
                    onLoadMore={handleLoadMoreTraining}
                    hasMore={trainingData?.hasMore ?? false}
                    isLoadingMore={isLoadingTraining && trainingOffset > 0}
                  />
                ) : (
                  <InferenceJobsTable 
                    jobs={allInferenceJobs}
                    isLoading={isLoadingInference && inferenceOffset === 0}
                    onLoadMore={handleLoadMoreInference}
                    hasMore={inferenceData?.hasMore ?? false}
                    isLoadingMore={isLoadingInference && inferenceOffset > 0}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

