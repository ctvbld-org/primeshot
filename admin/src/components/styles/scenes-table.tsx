'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { SceneFormDialog } from './scene-form-dialog'
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

type Scene = Database['public']['Tables']['style_scenes']['Row']

export function ScenesTable() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
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
      const { error } = await supabase
        .from('style_scenes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
            src={image}
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
        const scene = row.original

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
                  setSelectedScene(scene)
                  setIsFormOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to delete this scene?')) {
                    deleteMutation.mutate(scene.id)
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
    </>
  )
}