'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { SubscriptionFormDialog } from './subscription-form-dialog'
import { createClient } from '@/lib/supabase/client'
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

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function SubscriptionsTable() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('monthly_price')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
        return (
          <div>
            <div className="font-medium">{displayName}</div>
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
        return <Badge variant="secondary">{credits} credits/mo</Badge>
      },
    },
    {
      accessorKey: 'face_model_training_included',
      header: 'Included Training',
      cell: ({ row }: any) => {
        const included = row.getValue('face_model_training_included')
        return included > 0 ? (
          <Badge variant="outline">{included} LoRA{included > 1 ? 's' : ''}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )
      },
    },
    {
      accessorKey: 'max_resolution',
      header: 'Max Resolution',
    },
    {
      accessorKey: 'popular',
      header: 'Popular',
      cell: ({ row }: any) => {
        const popular = row.getValue('popular')
        return popular ? (
          <Badge className="bg-green-500">Popular</Badge>
        ) : null
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const subscription = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedSubscription(subscription)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedSubscription(subscription)
                  setIsTranslationOpen(true)
                }}
              >
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this subscription?')) {
                    deleteMutation.mutate(subscription.id)
                  }
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        columns={columns}
        data={subscriptions}
        searchKey="display_name"
        searchPlaceholder="Search subscriptions..."
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
          tableName="subscriptions"
          recordId={selectedSubscription.id.toString()}
          fields={[
            { key: 'display_name', value: selectedSubscription.display_name },
            { key: 'description', value: selectedSubscription.description || '' },
          ]}
          currentTranslations={selectedSubscription.translations || {}}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
            setIsTranslationOpen(false)
          }}
        />
      )}
    </>
  )
}