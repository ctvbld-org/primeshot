'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { WardrobeFormDialog } from './wardrobe-form-dialog'
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
import { translateRows } from '@/lib/translation'
import type { Database } from '@/types/supabase'
import { getWardrobeOptionImage } from '@/lib/get-options-image'

type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']

export function WardrobesTable() {
  const [selectedWardrobe, setSelectedWardrobe] = useState<Wardrobe | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const [isBulkTranslating, setIsBulkTranslating] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch wardrobes
  const { data: wardrobes = [], isLoading, refetch } = useQuery({
    queryKey: ['style-wardrobes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_wardrobes')
        .select('*')
        .order('label')
      
      if (error) throw error
      return data
    },
  })

  const handleBulkTranslate = async (selectedWardrobes: Wardrobe[], onSuccess?: () => void) => {
    setIsBulkTranslating(true)
    try {
      // Translate all selected wardrobes
      const translations = await translateRows('wardrobe', selectedWardrobes)
      
      // Update each wardrobe with its new translations
      const updatePromises = selectedWardrobes.map(async (wardrobe, index) => {
        const { error } = await supabase
          .from('style_wardrobes')
          .update({ translations: translations[index] })
          .eq('id', wardrobe.id)
        
        if (error) throw error
      })
      
      await Promise.all(updatePromises)
      
      // Refetch data to show updated translations
      await refetch()
      
      toast.success(`Successfully translated ${selectedWardrobes.length} wardrobes`)
      
      // Call success callback to clear selection
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(`Bulk translation failed: ${error.message}`)
    } finally {
      setIsBulkTranslating(false)
    }
  }

  const handleBulkDelete = async (selectedWardrobes: Wardrobe[], onSuccess?: () => void) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedWardrobes.length} wardrobe${selectedWardrobes.length > 1 ? 's' : ''}? This action cannot be undone.`
    )
    
    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      // Delete all selected wardrobes
      const deletePromises = selectedWardrobes.map(async (wardrobe) => {
        const { error } = await supabase
          .from('style_wardrobes')
          .delete()
          .eq('id', wardrobe.id)
        
        if (error) throw error
      })
      
      await Promise.all(deletePromises)
      
      // Refetch data to show updated list
      await refetch()
      
      toast.success(`Successfully deleted ${selectedWardrobes.length} wardrobe${selectedWardrobes.length > 1 ? 's' : ''}`)
      
      // Call success callback to clear selection
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(`Bulk deletion failed: ${error.message}`)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, fetch the wardrobe to get its image
      const { data: wardrobe, error: fetchError } = await supabase
        .from('style_wardrobes')
        .select('image')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Delete the wardrobe record
      const { error: deleteError } = await supabase
        .from('style_wardrobes')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError

      // Do not delete S3 images on record deletion to avoid cross-env data loss
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-wardrobes'] })
      toast.success('Wardrobe deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete wardrobe: ' + error.message)
    },
  })

  const columns = [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }: any) => {
        const image = row.getValue('image')
        return image ? (
          <img
            src={getWardrobeOptionImage(image)}
            alt={row.original.label}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-gray-200" />
        )
      },
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: ({ row }: any) => {
        const label = row.getValue('label')
        const wardrobe = row.original
        return (
          <div className="flex items-center gap-2">
            {label}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                setSelectedWardrobe(wardrobe)
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
      accessorKey: 'prompt',
      header: 'Prompt',
      cell: ({ row }: any) => {
        const prompt = (row.getValue('prompt') as string) || ''
        const preview = prompt.length > 80 ? prompt.slice(0, 80) + '…' : prompt
        return (
          <span className="text-sm text-muted-foreground" title={prompt}>
            {preview || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => {
        const category = (row.getValue('category') as string) || ''
        return <span className="text-sm text-muted-foreground">{category || '-'}</span>
      },
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }: any) => {
        const g = row.getValue('gender') || 'unisex'
        return <span className="text-sm text-muted-foreground capitalize">{g}</span>
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const wardrobe = row.original

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
                      setSelectedWardrobe(wardrobe)
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
                      if (confirm('Are you sure you want to delete this wardrobe?')) {
                        deleteMutation.mutate(wardrobe.id)
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
        data={wardrobes}
        searchKey="label"
        searchPlaceholder="Search wardrobes..."
        onAdd={() => {
          setSelectedWardrobe(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Wardrobe"
        enableBulkTranslation={true}
        onBulkTranslate={handleBulkTranslate}
        bulkTranslateLabel="Bulk Translate"
        isBulkTranslating={isBulkTranslating}
        enableBulkDelete={true}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Bulk Delete"
        isBulkDeleting={isBulkDeleting}
      />

      <WardrobeFormDialog
        wardrobe={selectedWardrobe}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedWardrobe(null)
        }}
      />

      {selectedWardrobe && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          currentTranslations={(selectedWardrobe.translations as Record<string, any>) || {}}
          table="wardrobe"
          rowData={selectedWardrobe}
          onTranslationsUpdated={(newTranslations) => {
            // Update the selected wardrobe with new translations
            setSelectedWardrobe(prev => prev ? { ...prev, translations: newTranslations } : null)
            // Optionally trigger a refetch of the data
            refetch()
          }}
        />
      )}
    </>
  )
}