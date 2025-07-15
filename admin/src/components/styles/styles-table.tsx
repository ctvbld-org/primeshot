'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { StyleFormDialog } from './style-form-dialog'
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

type Style = Database['public']['Tables']['styles']['Row']

export function StylesTable() {
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch styles
  const { data: styles = [], isLoading } = useQuery({
    queryKey: ['styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('styles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] })
      toast.success('Style deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete style: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'tagline',
      header: 'Tagline',
      cell: ({ row }: any) => {
        const tagline = row.getValue('tagline')
        return tagline ? (
          <span className="text-sm text-muted-foreground">{tagline}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">No tagline</span>
        )
      },
    },
    {
      accessorKey: 'available_genders',
      header: 'Genders',
      cell: ({ row }: any) => {
        const genders = row.getValue('available_genders') as string[]
        return (
          <div className="flex gap-1">
            {genders?.map((gender) => (
              <Badge key={gender} variant="secondary" className="text-xs">
                {gender}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'preview_images',
      header: 'Images',
      cell: ({ row }: any) => {
        const images = row.getValue('preview_images') as string[]
        return (
          <span className="text-sm text-muted-foreground">
            {images?.length || 0} images
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const style = row.original

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
                  setSelectedStyle(style)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedStyle(style)
                  setIsTranslationOpen(true)
                }}
              >
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this style?')) {
                    deleteMutation.mutate(style.id)
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
        data={styles}
        searchKey="name"
        searchPlaceholder="Search styles..."
        onAdd={() => {
          setSelectedStyle(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Style"
      />

      <StyleFormDialog
        style={selectedStyle}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedStyle(null)
        }}
      />

      {selectedStyle && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          tableName="styles"
          recordId={selectedStyle.id}
          fields={[
            { key: 'name', value: selectedStyle.name },
            { key: 'tagline', value: selectedStyle.tagline || '' },
            { key: 'description', value: selectedStyle.description || '' },
          ]}
          currentTranslations={selectedStyle.translations || {}}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['styles'] })
            setIsTranslationOpen(false)
          }}
        />
      )}
    </>
  )
}