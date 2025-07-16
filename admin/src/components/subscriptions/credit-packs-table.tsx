'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { CreditPackFormDialog } from './credit-pack-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
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

type CreditPack = Database['public']['Tables']['credit_packs']['Row']

export function CreditPacksTable() {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch credit packs
  const { data: creditPacks = [], isLoading } = useQuery({
    queryKey: ['credit-packs'],
    queryFn: async () => {
      const response = await fetch('/api/credit-packs')
      if (!response.ok) {
        throw new Error('Failed to fetch credit packs')
      }
      return response.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/credit-packs/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete credit pack')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-packs'] })
      toast.success('Credit pack deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete credit pack: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => {
        const name = row.getValue('name')
        const pack = row.original
        return (
          <div className="flex items-center gap-2">
            {name}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                setSelectedPack(pack)
                setIsTranslationOpen(true)
              }}
            >
              <Languages className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'credits',
      header: 'Credits',
      cell: ({ row }: any) => {
        const credits = row.getValue('credits')
        return <span className="text-sm text-muted-foreground">{credits} credits</span>
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: any) => {
        const price = row.getValue('price')
        const credits = row.original.credits
        const pricePerCredit = (price / credits).toFixed(3)
        return (
          <div>
            <div className="font-medium">${price}</div>
            <div className="text-sm text-muted-foreground">
              ${pricePerCredit}/credit
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'validity_days',
      header: 'Credit Validity',
      cell: ({ row }: any) => {
        const validityDays = row.getValue('validity_days')
        return (
          <div className="font-medium">
            {validityDays} days
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const pack = row.original

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
                      setSelectedPack(pack)
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
                      if (confirm('Are you sure you want to delete this credit pack?')) {
                        deleteMutation.mutate(pack.id)
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
        title="Credit Packs"
        columns={columns}
        data={creditPacks}
        onAdd={() => {
          setSelectedPack(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Credit Pack"
      />

      <CreditPackFormDialog
        creditPack={selectedPack}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedPack(null)
        }}
      />

      {selectedPack && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          currentTranslations={(selectedPack.translations as Record<string, any>) || {}}
        />
      )}
    </>
  )
}