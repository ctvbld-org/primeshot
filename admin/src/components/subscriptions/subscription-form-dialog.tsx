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
import { Checkbox } from '@primeshot/common/web/ui/checkbox'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  monthly_price: z.number().min(0, 'Monthly price must be positive'),
  yearly_price: z.number().min(0, 'Yearly price must be positive'),
  original_price: z.number().min(0, 'Original price must be positive'),
  credits: z.number().min(0, 'Credits must be positive'),
  face_model_training_included: z.number().min(0, 'Must be 0 or positive'),
  max_face_models: z.number().min(1, 'Must be at least 1'),
  max_resolution: z.string().min(1, 'Max resolution is required'),
  stripe_product_id_monthly: z.string().optional(),
  stripe_product_id_yearly: z.string().optional(),
  popular: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface SubscriptionFormDialogProps {
  subscription: Subscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SubscriptionFormDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      original_price: 0,
      credits: 0,
      face_model_training_included: 0,
      max_face_models: 1,
      max_resolution: '1024x1024',
      stripe_product_id_monthly: '',
      stripe_product_id_yearly: '',
      popular: false,
    },
  })

  // Reset form when subscription changes
  useEffect(() => {
    if (subscription) {
      form.reset({
        name: subscription.name,
        display_name: subscription.display_name,
        description: subscription.description || '',
        monthly_price: subscription.monthly_price,
        yearly_price: subscription.yearly_price,
        original_price: subscription.original_price,
        credits: subscription.credits,
        face_model_training_included: subscription.face_model_training_included,
        max_face_models: subscription.max_face_models,
        max_resolution: subscription.max_resolution,
        stripe_product_id_monthly: subscription.stripe_product_id_monthly || '',
        stripe_product_id_yearly: subscription.stripe_product_id_yearly || '',
        popular: subscription.popular,
      })
    } else {
      form.reset()
    }
  }, [subscription, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Prepare data for database
      const dbData = {
        ...data,
        stripe_product_id_monthly: data.stripe_product_id_monthly || null,
        stripe_product_id_yearly: data.stripe_product_id_yearly || null,
      }

      if (subscription) {
        // Update
        const { error } = await supabase
          .from('subscriptions')
          .update(dbData)
          .eq('id', subscription.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('subscriptions')
          .insert([dbData])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success(subscription ? 'Subscription updated successfully' : 'Subscription created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save subscription: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subscription ? 'Edit Subscription' : 'Create Subscription'}</DialogTitle>
          <DialogDescription>
            {subscription ? 'Update the subscription tier' : 'Add a new subscription tier'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., tier_1" />
                    </FormControl>
                    <FormDescription>
                      Used internally for identification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Basic Plan" />
                    </FormControl>
                    <FormDescription>
                      Shown to users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Plan description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="monthly_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearly_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Monthly rate when paid yearly
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      For showing discounts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Credits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Resolution</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 4096x4096" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="face_model_training_included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Included Face Models</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of free LoRA trainings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_face_models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Face Models</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormDescription>
                      Total allowed LoRAs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stripe_product_id_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Monthly Product ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="price_..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stripe_product_id_yearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Yearly Product ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="price_..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="popular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as Popular
                    </FormLabel>
                    <FormDescription>
                      Highlight this plan on the pricing page
                    </FormDescription>
                  </div>
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