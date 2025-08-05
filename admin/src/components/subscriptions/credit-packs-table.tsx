'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { CreditPackFormDialog } from './credit-pack-form-dialog'
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
      const { data, error } = await supabase
        .from('credit_packs')
        .select('*')
        .order('credits')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('credit_packs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
    },
    {
      accessorKey: 'credits',
      header: 'Credits',
      cell: ({ row }: any) => {
        const credits = row.getValue('credits')
        return <Badge variant="secondary">{credits} credits</Badge>
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
      accessorKey: 'stripe_product_id',
      header: 'Stripe Product',
      cell: ({ row }: any) => {
        const productId = row.getValue('stripe_product_id')
        return productId ? (
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {productId}
          </code>
        ) : (
          <span className="text-sm text-muted-foreground">Not set</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const pack = row.original

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
                  setSelectedPack(pack)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPack(pack)
                  setIsTranslationOpen(true)
                }}
              >
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this credit pack?')) {
                    deleteMutation.mutate(pack.id)
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
        data={creditPacks}
        searchKey="name"
        searchPlaceholder="Search credit packs..."
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
          tableName="credit_packs"
          recordId={selectedPack.id.toString()}
          fields={[
            { key: 'name', value: selectedPack.name },
            { key: 'description', value: selectedPack.description || '' },
          ]}
          currentTranslations={selectedPack.translations || {}}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['credit-packs'] })
            setIsTranslationOpen(false)
          }}
        />
      )}
    </>
  )
}