'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { CreditCostFormDialog } from './credit-cost-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@primeshot/common/web/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type CreditCost = Database['public']['Tables']['credit_costs']['Row']

export function CreditCostsTable() {
  const [selectedCost, setSelectedCost] = useState<CreditCost | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch credit costs
  const { data: creditCosts = [], isLoading } = useQuery({
    queryKey: ['credit-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_costs')
        .select('*')
        .order('action_type')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('credit_costs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
      accessorKey: 'action_type',
      header: 'Action Type',
      cell: ({ row }: any) => {
        const actionType = row.getValue('action_type')
        return (
          <Badge variant="outline" className="font-mono">
            {actionType}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'credit_cost',
      header: 'Credit Cost',
      cell: ({ row }: any) => {
        const cost = row.getValue('credit_cost')
        return <Badge>{cost} credits</Badge>
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => {
        const description = row.getValue('description')
        return description || <span className="text-muted-foreground italic">No description</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const cost = row.original

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
                  setSelectedCost(cost)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this credit cost?')) {
                    deleteMutation.mutate(cost.id)
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
        data={creditCosts}
        searchKey="action_type"
        searchPlaceholder="Search credit costs..."
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