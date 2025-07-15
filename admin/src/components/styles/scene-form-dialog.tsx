'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@primeshot/common/web/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Scene = Database['public']['Tables']['style_scenes']['Row']

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  image: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface SceneFormDialogProps {
  scene: Scene | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SceneFormDialog({
  scene,
  open,
  onOpenChange,
  onSuccess,
}: SceneFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      image: '',
    },
  })

  // Reset form when scene changes
  useEffect(() => {
    if (scene) {
      form.reset({
        label: scene.label,
        value: scene.value,
        image: scene.image || '',
      })
    } else {
      form.reset()
    }
  }, [scene, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (scene) {
        // Update
        const { error } = await supabase
          .from('style_scenes')
          .update(data)
          .eq('id', scene.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('style_scenes')
          .insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-scenes'] })
      toast.success(scene ? 'Scene updated successfully' : 'Scene created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save scene: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{scene ? 'Edit Scene' : 'Create Scene'}</DialogTitle>
          <DialogDescription>
            {scene ? 'Update the scene option' : 'Add a new scene option'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Office Background" />
                  </FormControl>
                  <FormDescription>
                    Display name shown to users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., office_background" />
                  </FormControl>
                  <FormDescription>
                    Internal value used in the system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => field.onChange(urls[0] || '')}
                      uploadPath="app-images/styles"
                      maxFiles={1}
                    />
                  </FormControl>
                  <FormDescription>
                    Representative image for this scene option
                  </FormDescription>
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