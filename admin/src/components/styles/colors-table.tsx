'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { ColorFormDialog } from './color-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@primeshot/common/web/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@primeshot/common/web/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Color = Database['public']['Tables']['style_colors']['Row']

export function ColorsTable() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch colors
  const { data: colors = [], isLoading } = useQuery({
    queryKey: ['style-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_colors')
        .select('*')
        .order('label')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('style_colors')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-colors'] })
      toast.success('Color deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete color: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }: any) => {
        const color = row.getValue('color')
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded border"
              style={{ backgroundColor: color || '#ccc' }}
            />
            <code className="text-sm">{color}</code>
          </div>
        )
      },
    },
    {
      accessorKey: 'label',
      header: 'Label',
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }: any) => (
        <code className="text-sm bg-muted px-2 py-1 rounded">
          {row.getValue('value')}
        </code>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const color = row.original

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
                  setSelectedColor(color)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this color?')) {
                    deleteMutation.mutate(color.id)
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
        data={colors}
        searchKey="label"
        searchPlaceholder="Search colors..."
        onAdd={() => {
          setSelectedColor(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Color"
      />

      <ColorFormDialog
        color={selectedColor}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedColor(null)
        }}
      />
    </>
  )
}