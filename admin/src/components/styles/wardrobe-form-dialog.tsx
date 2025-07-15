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

type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  image: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface WardrobeFormDialogProps {
  wardrobe: Wardrobe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WardrobeFormDialog({
  wardrobe,
  open,
  onOpenChange,
  onSuccess,
}: WardrobeFormDialogProps) {
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

  // Reset form when wardrobe changes
  useEffect(() => {
    if (wardrobe) {
      form.reset({
        label: wardrobe.label,
        value: wardrobe.value,
        image: wardrobe.image || '',
      })
    } else {
      form.reset()
    }
  }, [wardrobe, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (wardrobe) {
        // Update
        const { error } = await supabase
          .from('style_wardrobes')
          .update(data)
          .eq('id', wardrobe.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('style_wardrobes')
          .insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-wardrobes'] })
      toast.success(wardrobe ? 'Wardrobe updated successfully' : 'Wardrobe created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save wardrobe: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{wardrobe ? 'Edit Wardrobe' : 'Create Wardrobe'}</DialogTitle>
          <DialogDescription>
            {wardrobe ? 'Update the wardrobe option' : 'Add a new wardrobe option'}
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
                    <Input {...field} placeholder="e.g., Business Casual" />
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
                    <Input {...field} placeholder="e.g., business_casual" />
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
                    Representative image for this wardrobe option
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