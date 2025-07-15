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
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Color = Database['public']['Tables']['style_colors']['Row']

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color (e.g., #FF0000)'),
})

type FormData = z.infer<typeof formSchema>

interface ColorFormDialogProps {
  color: Color | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ColorFormDialog({
  color,
  open,
  onOpenChange,
  onSuccess,
}: ColorFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      color: '#000000',
    },
  })

  // Reset form when color changes
  useEffect(() => {
    if (color) {
      form.reset({
        label: color.label,
        value: color.value,
        color: color.color,
      })
    } else {
      form.reset()
    }
  }, [color, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (color) {
        // Update
        const { error } = await supabase
          .from('style_colors')
          .update(data)
          .eq('id', color.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('style_colors')
          .insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-colors'] })
      toast.success(color ? 'Color updated successfully' : 'Color created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save color: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{color ? 'Edit Color' : 'Create Color'}</DialogTitle>
          <DialogDescription>
            {color ? 'Update the color option' : 'Add a new color option'}
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
                    <Input {...field} placeholder="e.g., Navy Blue" />
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
                    <Input {...field} placeholder="e.g., navy_blue" />
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="color"
                        className="h-10 w-20 cursor-pointer"
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Hex color code (e.g., #FF0000 for red)
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