'use client'

import { useState, useEffect, useRef } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@primeshot/common/web/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@primeshot/common/web/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@primeshot/common/web/ui/alert-dialog'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { shouldTranslateRow, translateRow, getTranslatableColumns } from '@/lib/translation'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { getSceneOptionImage, getWardrobeOptionImage } from '@/lib/get-options-image'

// Add TagWithImage component
function TagWithImage({ label, img, color }: { label: string; img?: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 text-muted-foreground">
      {img && (
        <img
          src={img}
          alt={label}
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      {color && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  )
}

type Style = Database['public']['Tables']['styles']['Row']
type Scene = Database['public']['Tables']['style_scenes']['Row']
type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']
type Color = Database['public']['Tables']['style_colors']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  prompt: z.string().optional(),
  lora_path: z.string().optional(),
  preview_images: z.array(z.string()).min(1, 'At least one preview image is required'),
  available_scenes: z.array(z.string()).min(1, 'At least one scene is required'),
  available_wardrobes: z.array(z.string()).min(1, 'At least one wardrobe is required'),
  available_colors: z.array(z.string()).min(1, 'At least one color is required'),
})

type FormData = z.infer<typeof formSchema>

interface StyleFormDialogProps {
  style: Style | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StyleFormDialog({ style, open, onOpenChange, onSuccess }: StyleFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  // Fetch options
  const { data: scenes = [] } = useQuery({
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

  const { data: wardrobes = [] } = useQuery({
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

  const { data: colors = [] } = useQuery({
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      prompt: '',
      lora_path: '',
      preview_images: [],
      available_scenes: [],
      available_wardrobes: [],
      available_colors: [],
    },
  })

  // Function to check if form has changes
  const hasChanges = () => {
    if (!originalValuesRef.current) return false
    
    const currentValues = form.getValues()
    const originalValues = originalValuesRef.current
    
    return (
      currentValues.name !== originalValues.name ||
      currentValues.prompt !== originalValues.prompt ||
      currentValues.lora_path !== originalValues.lora_path ||
      JSON.stringify(currentValues.preview_images.sort()) !== JSON.stringify(originalValues.preview_images.sort()) ||
      JSON.stringify(currentValues.available_scenes.sort()) !== JSON.stringify(originalValues.available_scenes.sort()) ||
      JSON.stringify(currentValues.available_wardrobes.sort()) !== JSON.stringify(originalValues.available_wardrobes.sort()) ||
      JSON.stringify(currentValues.available_colors.sort()) !== JSON.stringify(originalValues.available_colors.sort())
    )
  }

  // Function to reset form to original values
  const resetToOriginal = () => {
    if (originalValuesRef.current) {
      form.reset(originalValuesRef.current)
    }
  }

  // Handle close with confirmation
  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true)
    } else {
      onOpenChange(false)
    }
  }

  // Handle discard changes
  const handleDiscard = () => {
    resetToOriginal()
    setShowConfirmDialog(false)
    onOpenChange(false)
  }

  // Reset form when style changes
  useEffect(() => {
    const newValues: FormData = style ? {
      name: style.name,
      prompt: style.prompt || '',
      lora_path: style.lora_path || '',
      preview_images: style.preview_images as string[] || [],
      available_scenes: style.available_scenes || [],
      available_wardrobes: style.available_wardrobes || [],
      available_colors: style.available_colors || [],
    } : {
      name: '',
      prompt: '',
      lora_path: '',
      preview_images: [],
      available_scenes: [],
      available_wardrobes: [],
      available_colors: [],
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [style, form])

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: FormData & { translations?: any }) => {
      if (style) {
        // Update (retain S3 images even if removed from this style)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/admin/styles`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: style.id, ...data }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update style')
        }
      } else {
        // Create
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/admin/styles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create style')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] })
      toast({ title: style ? 'Style updated successfully' : 'Style created successfully' })
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({ title: 'Failed to save style', description: error.message, variant: 'destructive' })
    },
  })

  // Defer upload integration for preview images
  const uploaders = React.useRef<(() => Promise<string[]>)[]>([])
  const registerUploader = (u: () => Promise<string[]>) => { uploaders.current.push(u) }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      for (const up of uploaders.current) { await up() }
      const columns = getTranslatableColumns('styles')
      const needsTranslation = shouldTranslateRow(style ?? undefined, data, columns)
      let translations = style?.translations || null
      if (needsTranslation) {
        try {
          translations = await translateRow('styles', data)
        } catch (err: any) {
          toast({ title: 'Translation failed', description: err.message, variant: 'destructive' })
          setIsLoading(false)
          return
        }
      }
      mutation.mutate({ ...data, translations })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] !max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{style ? 'Edit Style' : 'Create Style'}</SheetTitle>
          <SheetDescription>
            {style ? 'Update the style details below.' : 'Fill in the details to create a new style.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Professional Studio" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="AI generation prompt for this style" rows={3} />
                    </FormControl>
                    <FormDescription>
                      Optional prompt to guide AI generation for this style
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lora_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LoRA Path</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="/data/style_loras/.../wan_lora_****_****.safetensors" />
                    </FormControl>
                    <FormDescription>
                      Optional path to the LoRA model file for this style
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preview_images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Images</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        styleName={form.watch('name')}
                        uploadPath="app-images/placeholders/styles"
                        deferUpload
                        onRegisterUploader={registerUploader}
                        maxFiles={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_scenes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Scenes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={scenes.map(s => ({
                          value: s.value,
                          label: s.label,
                          image: s.image,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select scenes"
                        showImages
                        className="border-input bg-background hover:bg-background"
                        resolveImageUrl={(opt)=> opt.image ? (getSceneOptionImage as any)(opt.image) : ''}
                        renderTag={(option) => (
                          <Badge variant="outline" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              img={option.image ? getSceneOptionImage(option.image) : undefined} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_wardrobes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Wardrobes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={wardrobes.map(w => ({
                          value: w.value,
                          label: w.label,
                          image: w.image,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select wardrobes"
                        showImages
                        className="border-input bg-background hover:bg-background"
                        resolveImageUrl={(opt)=> opt.image ? (getWardrobeOptionImage as any)(opt.image) : ''}
                        renderTag={(option) => (
                          <Badge variant="secondary" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              img={option.image ? getWardrobeOptionImage(option.image) : undefined} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_colors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Colors</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={colors.map(c => ({
                          value: c.value,
                          label: c.label,
                          color: c.color,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select colors"
                        showColors
                        className="border-input bg-background hover:bg-background"
                        renderTag={(option) => (
                          <Badge variant="secondary" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              color={option.color} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || isLoading}>
                  {mutation.isPending || isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close?</AlertDialogTitle>
            <AlertDialogDescription>
              All changes made will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Continue editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}