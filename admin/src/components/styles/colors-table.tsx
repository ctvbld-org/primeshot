'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { ColorFormDialog } from './color-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@primeshot/common/web/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@primeshot/common/web/ui/tooltip'
import { Pencil, Trash, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { TranslationDialog } from '@/components/ui/translation-dialog'
import type { Database } from '@/types/supabase'

type Color = Database['public']['Tables']['style_colors']['Row']

export function ColorsTable() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
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
      cell: ({ row }: any) => {
        const label = row.getValue('label')
        const color = row.original
        return (
          <div className="flex items-center gap-2">
            {label}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                setSelectedColor(color)
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const color = row.original

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
                      setSelectedColor(color)
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
                      if (confirm('Are you sure you want to delete this color?')) {
                        deleteMutation.mutate(color.id)
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

      {selectedColor && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          currentTranslations={(selectedColor.translations as Record<string, any>) || {}}
        />
      )}
    </>
  )
}