'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { SceneFormDialog } from './scene-form-dialog'
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
import getOptionsImage from '@/lib/get-options-image'

type Scene = Database['public']['Tables']['style_scenes']['Row']

export function ScenesTable() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch scenes
  const { data: scenes = [], isLoading } = useQuery({
    queryKey: ['style-scenes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_scenes')
        .select('*')
        .order('label')
      
      if (error) throw error
      return data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, fetch the scene to get its image
      const { data: scene, error: fetchError } = await supabase
        .from('style_scenes')
        .select('image')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Delete the scene record
      const { error: deleteError } = await supabase
        .from('style_scenes')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError

      // Delete associated image if it exists
      if (scene.image) {
        try {
          await fetch('/api/images/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: [scene.image],
              s3Path: 'app-images/placeholders/options'
            })
          })
        } catch (error) {
          console.error('Failed to delete scene image:', error)
          // Don't fail the whole operation if image deletion fails
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-scenes'] })
      toast.success('Scene deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete scene: ' + error.message)
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
            src={getOptionsImage(image)}
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
        const scene = row.original
        return (
          <div className="flex items-center gap-2">
            {label}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                setSelectedScene(scene)
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
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const scene = row.original

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
                      setSelectedScene(scene)
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
                      if (confirm('Are you sure you want to delete this scene?')) {
                        deleteMutation.mutate(scene.id)
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
        data={scenes}
        searchKey="label"
        searchPlaceholder="Search scenes..."
        onAdd={() => {
          setSelectedScene(null)
          setIsFormOpen(true)
        }}
        addButtonLabel="Add Scene"
      />

      <SceneFormDialog
        scene={selectedScene}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false)
          setSelectedScene(null)
        }}
      />

      {selectedScene && (
        <TranslationDialog
          open={isTranslationOpen}
          onOpenChange={setIsTranslationOpen}
          currentTranslations={(selectedScene.translations as Record<string, any>) || {}}
        />
      )}
    </>
  )
}