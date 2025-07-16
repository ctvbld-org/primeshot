'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      color: '#000000',
    },
  })

  // Function to check if form has changes
  const hasChanges = () => {
    if (!originalValuesRef.current) return false
    
    const currentValues = form.getValues()
    const originalValues = originalValuesRef.current
    
    return (
      currentValues.label !== originalValues.label ||
      currentValues.value !== originalValues.value ||
      currentValues.color !== originalValues.color
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

  // Reset form when color changes
  useEffect(() => {
    const newValues: FormData = color ? {
      label: color.label,
      value: color.value,
      color: color.color,
    } : {
      label: '',
      value: '',
      color: '#000000',
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [color, form])

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

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
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to save color: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{color ? 'Edit Color' : 'Create Color'}</SheetTitle>
          <SheetDescription>
            {color ? 'Update the color configuration' : 'Add a new color option'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Black" />
                    </FormControl>
                    <FormDescription>
                      Display name for this color
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
                      <Input {...field} placeholder="e.g., black" />
                    </FormControl>
                    <FormDescription>
                      Internal value used in prompts
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
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Input 
                          {...field} 
                          type="color"
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input 
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save'}
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