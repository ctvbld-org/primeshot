'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { CreditCostFormDialog } from './credit-cost-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@/lib/api'
import { Button } from '@primeshot/common/web/ui/button'
import { Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@primeshot/common/web/ui/tooltip'

type CreditCost = Database['public']['Tables']['credit_costs']['Row']

export function CreditCostsTable() {
  const [selectedCost, setSelectedCost] = useState<CreditCost | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch credit costs
  const { data: creditCosts = [], isLoading } = useQuery({
    queryKey: ['credit-costs'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/credit-costs'))
      if (!response.ok) {
        throw new Error('Failed to fetch credit costs')
      }
      return response.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(getApiUrl(`/api/credit-costs/${id}`), {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete credit cost')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-costs'] })
      toast.success('Credit cost deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete credit cost: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'type',
      header: 'Action Type',
      cell: ({ row }: any) => {
        const actionType = row.getValue('type')
        return (
          <span className="text-sm text-muted-foreground">{actionType}</span>
        )
      },
    },
    {
      accessorKey: 'value',
      header: 'Credit Cost',
      cell: ({ row }: any) => {
        const cost = row.getValue('value')
        return <span className="text-sm text-muted-foreground">{cost} credits</span>
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const cost = row.original

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
                      setSelectedCost(cost)
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
                      if (confirm('Are you sure you want to delete this credit cost?')) {
                        deleteMutation.mutate(cost.id)
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
        title="Credit Costs"
        columns={columns}
        data={creditCosts}
        onAdd={() => {
          setSelectedCost(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Credit Cost"
      />

      <CreditCostFormDialog
        creditCost={selectedCost}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedCost(null)
        }}
      />
    </>
  )
}