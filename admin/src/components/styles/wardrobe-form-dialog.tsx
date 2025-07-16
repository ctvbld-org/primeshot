'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Input } from '@primeshot/common/web/ui/input'
import { Button } from '@primeshot/common/web/ui/button'
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValues = useRef<FormData | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      image: '',
    },
  })

  // Track original values when form loads
  useEffect(() => {
    if (open && wardrobe) {
      const values = {
        label: wardrobe.label || '',
        value: wardrobe.value || '',
        image: wardrobe.image || '',
      }
      form.reset(values)
      originalValues.current = values
    } else if (open && !wardrobe) {
      const values = {
        label: '',
        value: '',
        image: '',
      }
      form.reset(values)
      originalValues.current = values
    }
  }, [wardrobe, open, form])

  const hasChanges = (): boolean => {
    if (!originalValues.current) return false
    
    const currentValues = form.getValues()
    return (
      currentValues.label !== originalValues.current.label ||
      currentValues.value !== originalValues.current.value ||
      currentValues.image !== originalValues.current.image
    )
  }

  const resetToOriginal = () => {
    if (originalValues.current) {
      form.reset(originalValues.current)
    }
  }

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmDialog(true)
    } else {
      onOpenChange(false)
    }
  }

  const handleDiscard = () => {
    resetToOriginal()
    setShowConfirmDialog(false)
    onOpenChange(false)
  }

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: result, error } = await supabase
        .from('style_wardrobes')
        .insert([data])
        .select()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobes'] })
      toast.success('Wardrobe created successfully')
      originalValues.current = form.getValues()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error creating wardrobe:', error)
      toast.error('Failed to create wardrobe')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!wardrobe) throw new Error('No wardrobe to update')

      const { data: result, error } = await supabase
        .from('style_wardrobes')
        .update(data)
        .eq('id', wardrobe.id)
        .select()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobes'] })
      toast.success('Wardrobe updated successfully')
      originalValues.current = form.getValues()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating wardrobe:', error)
      toast.error('Failed to update wardrobe')
    },
  })

  const onSubmit = (data: FormData) => {
    if (wardrobe) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {wardrobe ? 'Edit Wardrobe' : 'Create Wardrobe'}
            </SheetTitle>
            <SheetDescription>
              {wardrobe
                ? 'Update the wardrobe details below.'
                : 'Fill in the details to create a new wardrobe.'}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter label" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for this wardrobe option.
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
                      <Input placeholder="Enter value" {...field} />
                    </FormControl>
                    <FormDescription>
                      The internal value used for this wardrobe option.
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
                        styleName={'wardrobe-' + form.watch('value')}
                        uploadPath="app-images/placeholders/options"
                        maxFiles={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? wardrobe
                      ? 'Updating...'
                      : 'Creating...'
                    : wardrobe
                    ? 'Update Wardrobe'
                    : 'Create Wardrobe'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. They will be lost if you continue.
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
    </>
  )
}