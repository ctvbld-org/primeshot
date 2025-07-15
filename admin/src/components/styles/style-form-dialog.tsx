'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@primeshot/common/web/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@primeshot/common/web/ui/form'
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Style = Database['public']['Tables']['styles']['Row']
type Scene = Database['public']['Tables']['style_scenes']['Row']
type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']
type Color = Database['public']['Tables']['style_colors']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  preview_images: z.array(z.string()).min(1, 'At least one preview image is required'),
  available_genders: z.array(z.string()).min(1, 'At least one gender is required'),
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
      tagline: '',
      description: '',
      preview_images: [],
      available_genders: [],
      available_scenes: [],
      available_wardrobes: [],
      available_colors: [],
    },
  })

  // Reset form when style changes
  useEffect(() => {
    if (style) {
      form.reset({
        name: style.name,
        tagline: style.tagline || '',
        description: style.description || '',
        preview_images: style.preview_images || [],
        available_genders: style.available_genders || [],
        available_scenes: style.available_scenes || [],
        available_wardrobes: style.available_wardrobes || [],
        available_colors: style.available_colors || [],
      })
    } else {
      form.reset()
    }
  }, [style, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (style) {
        // Update
        const { error } = await supabase
          .from('styles')
          .update(data)
          .eq('id', style.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('styles')
          .insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] })
      toast.success(style ? 'Style updated successfully' : 'Style created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save style: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{style ? 'Edit Style' : 'Create Style'}</DialogTitle>
          <DialogDescription>
            {style ? 'Update the style configuration' : 'Add a new photography style'}
          </DialogDescription>
        </DialogHeader>

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
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Short description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Detailed description of the style" />
                  </FormControl>
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
                      uploadPath="app-images/options"
                      maxFiles={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload up to 5 preview images for this style
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available_genders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Genders</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={genderOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select genders"
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}