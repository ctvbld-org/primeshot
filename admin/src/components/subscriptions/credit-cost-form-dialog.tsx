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
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type CreditCost = Database['public']['Tables']['credit_costs']['Row']

const formSchema = z.object({
  action_type: z.string().min(1, 'Action type is required'),
  credit_cost: z.number().min(0, 'Credit cost must be 0 or positive'),
  description: z.string().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action_type: '',
      credit_cost: 1,
      description: '',
    },
  })

  // Reset form when credit cost changes
  useEffect(() => {
    if (creditCost) {
      form.reset({
        action_type: creditCost.action_type,
        credit_cost: creditCost.credit_cost,
        description: creditCost.description || '',
      })
    } else {
      form.reset()
    }
  }, [creditCost, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (creditCost) {
        // Update
        const { error } = await supabase
          .from('credit_costs')
          .update(data)
          .eq('id', creditCost.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('credit_costs')
          .insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-costs'] })
      toast.success(creditCost ? 'Credit cost updated successfully' : 'Credit cost created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save credit cost: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{creditCost ? 'Edit Credit Cost' : 'Create Credit Cost'}</DialogTitle>
          <DialogDescription>
            {creditCost ? 'Update the credit cost' : 'Add a new credit cost'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="action_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Type</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., image_generation, face_model_training" />
                  </FormControl>
                  <FormDescription>
                    The type of action this cost applies to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credit_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of credits required for this action
                  </FormDescription>
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
                    <Textarea {...field} placeholder="Description of this action" rows={3} />
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