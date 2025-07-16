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

type CreditCost = Database['public']['Tables']['credit_costs']['Row']

const formSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  value: z.number().min(0, 'Value must be positive'),
})

type FormData = z.infer<typeof formSchema>

interface CreditCostFormDialogProps {
  creditCost: CreditCost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreditCostFormDialog({
  creditCost,
  open,
  onOpenChange,
  onSuccess,
}: CreditCostFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      value: 0,
    },
  })

  // Function to check if form has changes
  const hasChanges = () => {
    if (!originalValuesRef.current) return false
    
    const currentValues = form.getValues()
    const originalValues = originalValuesRef.current
    
    return (
      currentValues.type !== originalValues.type ||
      currentValues.value !== originalValues.value
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

  // Reset form when creditCost changes
  useEffect(() => {
    const newValues: FormData = creditCost ? {
      type: creditCost.type,
      value: creditCost.value,
    } : {
      type: '',
      value: 0,
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [creditCost, form])

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (creditCost) {
        // Update
        const response = await fetch(`/api/credit-costs/${creditCost.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update credit cost')
        }
      } else {
        // Create
        const response = await fetch('/api/credit-costs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create credit cost')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-costs'] })
      toast.success(creditCost ? 'Credit cost updated successfully' : 'Credit cost created successfully')
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to save credit cost: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] !max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{creditCost ? 'Edit Credit Cost' : 'Create Credit Cost'}</SheetTitle>
          <SheetDescription>
            {creditCost ? 'Update the credit cost configuration' : 'Add a new credit cost'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 1K, 2K, 4K, FACE_MODEL_TRAINING" />
                    </FormControl>
                    <FormDescription>
                      The operation type that consumes credits
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
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        placeholder="e.g., 1, 2, 3, 30"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of credits required for this operation
                    </FormDescription>
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