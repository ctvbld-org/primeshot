'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { shouldTranslateRow, translateRow, getTranslatableColumns } from '@/lib/translation'
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
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@primeshot/common/web/ui/select'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import type { Database } from '@/types/supabase'
import { ImageUpload } from '@/components/ui/image-upload'
import { getApiUrl } from '@/lib/api'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

interface FormData {
  name: string
  display_name: string
  description?: string
  monthly_price: number
  yearly_price: number
  original_price: number
  credits: number
  character_training_included: number
  max_characters: number
  max_quality: string
  concurrent_jobs: number
  concurrent_trainings: number
  popular: boolean
  disabled: boolean
  features?: Record<string, any>
  translations?: Record<string, any>
  image_url?: string
}

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
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      original_price: 0,
      credits: 0,
      character_training_included: 0,
      max_characters: 0,
      max_quality: '1K',
      concurrent_jobs: 1,
      concurrent_trainings: 2,
      popular: false,
      disabled: false,
      features: {},
      translations: {},
      image_url: '',
    },
  })

  // Function to check if form has changes
  const hasChanges = () => {
    if (!originalValuesRef.current) return false
    
    const currentValues = form.getValues()
    const originalValues = originalValuesRef.current
    
    return (
      currentValues.name !== originalValues.name ||
      currentValues.display_name !== originalValues.display_name ||
      currentValues.description !== originalValues.description ||
      currentValues.monthly_price !== originalValues.monthly_price ||
      currentValues.yearly_price !== originalValues.yearly_price ||
      currentValues.original_price !== originalValues.original_price ||
      currentValues.credits !== originalValues.credits ||
      currentValues.character_training_included !== originalValues.character_training_included ||
      currentValues.max_characters !== originalValues.max_characters ||
      currentValues.max_quality !== originalValues.max_quality ||
      currentValues.concurrent_jobs !== originalValues.concurrent_jobs ||
      currentValues.concurrent_trainings !== originalValues.concurrent_trainings ||
      currentValues.popular !== originalValues.popular ||
      currentValues.disabled !== originalValues.disabled ||
      JSON.stringify(currentValues.features) !== JSON.stringify(originalValues.features)
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

  // Reset form when subscription changes
  useEffect(() => {
    const newValues: FormData = subscription ? {
      name: subscription.name,
      display_name: subscription.display_name,
      description: subscription.description || '',
      monthly_price: subscription.monthly_price,
      yearly_price: subscription.yearly_price,
      original_price: subscription.original_price,
      credits: subscription.credits,
      character_training_included: subscription.character_training_included,
      max_characters: subscription.max_characters,
      max_quality: (subscription as any).max_quality,
      concurrent_jobs: subscription.concurrent_jobs,
      concurrent_trainings: subscription.concurrent_trainings ?? 0,
      popular: subscription.popular || false,
      disabled: (subscription as any).disabled || false,
      features: (subscription.features as Record<string, any>) || {},
      translations: (subscription.translations as Record<string, any>) || {},
      image_url: (subscription as any).image_url || '',
    } : {
      name: '',
      display_name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      original_price: 0,
      credits: 0,
      character_training_included: 0,
      max_characters: 0,
      max_quality: '1K',
      concurrent_jobs: 1,
      concurrent_trainings: 2,
      popular: false,
      disabled: false,
      features: {},
      translations: {},
      image_url: '',
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [subscription, form, open])

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: FormData & { translations?: any }) => {
      // Basic validation
      if (!data.name || !data.display_name) {
        throw new Error('Name and display name are required')
      }
      // Allow 0 for free plans, just prevent negative values
      if (data.monthly_price < 0 || data.yearly_price < 0 || data.original_price < 0) {
        throw new Error('Prices cannot be negative')
      }
      if (data.credits < 0 || data.concurrent_jobs < 1) {
        throw new Error('Invalid credit or job configuration')
      }

      if (subscription) {
        // Update
        const response = await fetch(getApiUrl(`/api/subscriptions/${subscription.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update subscription')
        }
      } else {
        // Create
        const response = await fetch(getApiUrl('/api/subscriptions'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create subscription')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast({
        title: "Success",
        description: subscription ? 'Subscription updated successfully' : 'Subscription created successfully'
      })
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to save subscription: ' + error.message,
        variant: "destructive"
      })
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const columns = getTranslatableColumns('subscriptions')
      const needsTranslation = shouldTranslateRow(originalValuesRef.current ?? undefined, data, columns)
      let translations = (subscription?.translations as Record<string, any>) || {}
      if (needsTranslation) {
        try {
          translations = await translateRow('subscriptions', data)
        } catch (err: any) {
          toast({
            title: "Translation failed",
            description: err.message,
            variant: "destructive"
          })
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
          <SheetTitle>{subscription ? 'Edit Subscription' : 'Create Subscription'}</SheetTitle>
          <SheetDescription>
            {subscription ? 'Update the subscription plan configuration' : 'Add a new subscription plan'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
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
                        <Input {...field} placeholder="e.g., Tier 1" />
                      </FormControl>
                      <FormDescription>
                        Display name shown to users
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
                      <Textarea {...field} placeholder="Description of this subscription plan" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image upload for Stripe product image */}
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormDescription>Shown in Stripe Checkout and Customer Portal</FormDescription>
                    <FormControl>
                      <div>
                        <ImageUpload
                          value={field.value ? [field.value] : []}
                          onChange={(names) => {
                            const first = names[0] || ''
                            const url = first && !first.startsWith('http')
                              ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''}/website-images/stripes/${first}`
                              : first
                            field.onChange(url)
                          }}
                          styleName={form.watch('display_name') || form.watch('name')}
                          maxFiles={1}
                          maxSizeMB={10}
                          uploadPath="website-images/stripes"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4 items-start">
                <FormField
                  control={form.control}
                  name="monthly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 9.00"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Set to $0 for free plans
                      </FormDescription>
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
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 6.75"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
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
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 12.00"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
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

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Credits</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        placeholder="e.g., 40"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                  control={form.control}
                  name="concurrent_jobs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concurrent Jobs</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          placeholder="e.g., 1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Max concurrent generation jobs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                <FormField
                    control={form.control}
                    name="concurrent_trainings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concurrent Trainings</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="e.g., 1"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Max concurrent generation jobs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

              <div className="grid grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control}
                  name="character_training_included"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Included Character Training</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="e.g., 1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Free character trainings per month
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_characters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Characters</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="e.g., 1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum characters allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="max_quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quality</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                           <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1K">1K</SelectItem>
                          <SelectItem value="2K">2K</SelectItem>
                          <SelectItem value="4K">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Maximum image quality allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="popular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mark as Popular</FormLabel>
                      <FormDescription>
                        Highlight this plan on the pricing page
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Disabled</FormLabel>
                      <FormDescription>
                        Disable this subscription tier - it won't be available for new subscriptions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || mutation.isPending}
                  className="w-full"
                >
                  {isLoading || mutation.isPending ? 'Saving...' : (subscription ? 'Update Subscription' : 'Create Subscription')}
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