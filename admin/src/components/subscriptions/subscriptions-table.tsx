'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { SubscriptionFormDialog } from './subscription-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@/lib/api'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@primeshot/common/web/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { TranslationDialog } from '@/components/ui/translation-dialog'
import type { Database } from '@/types/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@primeshot/common/web/ui/tooltip'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function SubscriptionsTable() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/subscriptions'))
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }
      
      return response.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(getApiUrl(`/api/subscriptions/${id}`), {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete subscription')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete subscription: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => {
        const name = row.getValue('name')
        const displayName = row.original.display_name
        const subscription = row.original
        return (
          <div>
            <div className="font-medium flex items-center gap-2">
              {displayName}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => {
                  setSelectedSubscription(subscription)
                  setIsTranslationOpen(true)
                }}
              >
                <Languages className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">{name}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'monthly_price',
      header: 'Pricing',
      cell: ({ row }: any) => {
        const monthly = row.getValue('monthly_price')
        const yearly = row.original.yearly_price
        const original = row.original.original_price
        return (
          <div className="space-y-1">
            <div>${monthly}/mo</div>
            {yearly !== monthly && (
              <div className="text-sm text-muted-foreground">
                ${yearly}/mo yearly
              </div>
            )}
            {original > monthly && (
              <div className="text-sm line-through text-muted-foreground">
                ${original}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'credits',
      header: 'Credits',
      cell: ({ row }: any) => {
        const credits = row.getValue('credits')
        return <span className="text-sm text-muted-foreground">{credits} credits/mo</span>
      },
    },
    {
      accessorKey: 'character_training_included',
      header: 'Included Character',
      cell: ({ row }: any) => {
        const included = row.getValue('character_training_included')
        return included > 0 ? (
          <span className="text-sm text-muted-foreground">{included} Character{included > 1 ? 's' : ''}</span>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )
      },
    },
    {
      accessorKey: 'max_quality',
      header: 'Max Quality',
    },
    {
      accessorKey: 'popular',
      header: 'Popular',
      cell: ({ row }: any) => {
        const popular = row.getValue('popular')
        return popular ? (
          <Badge variant="default" className="font-normal bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            Popular
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'disabled',
      header: 'Status',
      cell: ({ row }: any) => {
        const disabled = row.getValue('disabled')
        return disabled ? (
          <Badge variant="destructive" className="font-normal">
            Disabled
          </Badge>
        ) : (
          <Badge variant="default" className="font-normal bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            Active
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const subscription = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedSubscription(subscription)
                      setIsFormOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-2">
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this subscription?')) {
                        deleteMutation.mutate(subscription.id)
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-2">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <DataTable
        title="Subscription Tiers"
        columns={columns}
        data={subscriptions}
        onAdd={() => {
          setSelectedSubscription(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Subscription"
      />

      <SubscriptionFormDialog
        subscription={selectedSubscription}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedSubscription(null)
        }}
      />

      {selectedSubscription && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          currentTranslations={(selectedSubscription.translations as Record<string, any>) || {}}
          table="subscriptions"
          rowData={selectedSubscription}
          onTranslationsUpdated={(newTranslations) => {
            // Update the selected subscription with new translations
            setSelectedSubscription(prev => prev ? { ...prev, translations: newTranslations } : null)
            // Optionally trigger a refetch of the data
            refetch()
          }}
        />
      )}
    </>
  )
}