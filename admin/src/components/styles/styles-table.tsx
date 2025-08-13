'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StyleFormDialog } from './style-form-dialog'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Input } from '@primeshot/common/web/ui/input'
import { Pencil, Trash, Languages, Search, Plus } from 'lucide-react'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { TranslationDialog } from '@/components/ui/translation-dialog'
import type { Database } from '@/types/supabase'
import getStyleImages from '@/lib/get-styles-images'
import { getSceneOptionImage, getWardrobeOptionImage } from '@/lib/get-options-image'

type Style = Database['public']['Tables']['styles']['Row']

export function StylesTable() {
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTranslationOpen, setIsTranslationOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { toast } = useToast()

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

  // Fetch all scenes, wardrobes, and colors
  const { data: scenes = [] } = useQuery({
    queryKey: ['style_scenes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_scenes')
        .select('*')
      if (error) throw error
      return data
    },
  })
  const { data: wardrobes = [] } = useQuery({
    queryKey: ['style_wardrobes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_wardrobes')
        .select('*')
      if (error) throw error
      return data
    },
  })
  const { data: colors = [] } = useQuery({
    queryKey: ['style_colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_colors')
        .select('*')
      if (error) throw error
      return data
    },
  })

  // Build lookup maps
  const sceneMap = Object.fromEntries(scenes.map((s: any) => [s.value, s]))
  const wardrobeMap = Object.fromEntries(wardrobes.map((w: any) => [w.value, w]))
  const colorMap = Object.fromEntries(colors.map((c: any) => [c.value, c]))

  // Filter styles based on search term
  const filteredStyles = styles.filter((style: Style) =>
    style.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/styles/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete style')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['styles'] })
      toast({ 
        title: 'Style deleted successfully',
        description: data.deletedImages > 0 ? `${data.deletedImages} associated images were also deleted` : undefined
      })
    },
    onError: (error) => {
      console.error('Failed to delete style:', error)
      toast({ title: 'Failed to delete style', description: error.message, variant: 'destructive' })
    },
  })

  // Helper to render a tag with image or color swatch and label
  function TagWithImage({ label, img, color }: { label: string; img?: string; color?: string }) {
    return (
      <span className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5">
        {img && (
          <img
            src={img}
            alt=""
            className="w-5 h-5 rounded-full object-cover border"
            style={{ minWidth: 20, minHeight: 20 }}
          />
        )}
        {color && (
          <span
            className="w-5 h-5 rounded-full border"
            style={{ backgroundColor: color, minWidth: 20, minHeight: 20, display: 'inline-block' }}
          />
        )}
        <span className="font-normal">{label}</span>
      </span>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search styles..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setSelectedStyle(null)
            setIsFormOpen(true)
          }}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Style
        </Button>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredStyles.map((style: Style) => {
          const images = getStyleImages(style.preview_images as string[])
          return (
            <div
              key={style.id}
              className="bg-card rounded-lg shadow-sm border flex flex-col overflow-hidden"
            >
              {images[0] ? (
                <img
                  src={images[0]}
                  alt={style.name}
                  className="w-full h-40 object-cover object-[50%_30%] border-b"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-muted text-muted-foreground text-sm border-b">
                  No image
                </div>
              )}
              <div className="py-4 flex-1 flex flex-col gap-2">
                <div className="px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">{style.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setSelectedStyle(style)
                        setIsTranslationOpen(true)
                      }}
                    >
                      <Languages className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="px-4 text-sm text-muted-foreground truncate">
                  {style.prompt || <span className="italic">No prompt</span>}
                </div>
                {/* Scenes Section */}
                <div className="mt-4">
                  <div className="px-4 text-sm text-muted-foreground font-medium mb-3">Scenes</div>
                  <div className="px-4 flex gap-1 overflow-x-auto hide-scrollbar whitespace-nowrap">
                    {(style.available_scenes as string[] | undefined)?.map((scene) => {
                      const meta = sceneMap[scene]
                      return (
                        <Badge key={scene} variant="outline" className="text-xs px-0 flex-shrink-0">
                          <TagWithImage label={meta?.label || scene} img={meta?.image ? getSceneOptionImage(meta.image) : undefined} />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                {/* Wardrobes Section */}
                <div className="mt-2">
                  <div className="px-4 text-sm text-muted-foreground font-medium mb-3">Wardrobes</div>
                  <div className="px-4 flex gap-1 overflow-x-auto hide-scrollbar whitespace-nowrap">
                    {(style.available_wardrobes as string[] | undefined)?.map((wardrobe) => {
                      const meta = wardrobeMap[wardrobe]
                      return (
                        <Badge key={wardrobe} variant="secondary" className="text-xs px-0 flex-shrink-0">
                          <TagWithImage label={meta?.label || wardrobe} img={meta?.image ? getWardrobeOptionImage(meta.image) : undefined} />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                {/* Colors Section */}
                <div className="mt-2">
                  <div className="px-4 text-sm text-muted-foreground font-medium mb-3">Colors</div>
                  <div className="px-4 flex gap-1 overflow-x-auto hide-scrollbar whitespace-nowrap">
                    {(style.available_colors as string[] | undefined)?.map((color) => {
                      const meta = colorMap[color]
                      return (
                        <Badge key={color} variant="secondary" className="text-xs px-0 flex-shrink-0">
                          <TagWithImage label={meta?.label || color} color={meta?.color} />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="px-4 pt-4 mt-auto">
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this style?')) {
                          deleteMutation.mutate(style.id)
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedStyle(style)
                        setIsFormOpen(true)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
          currentTranslations={(selectedStyle.translations as Record<string, any>) || {}}
        />
      )}
    </>
  )
}