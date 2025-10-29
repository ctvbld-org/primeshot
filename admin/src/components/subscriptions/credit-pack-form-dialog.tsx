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
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { ImageUpload } from '@/components/ui/image-upload'
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
import { getApiUrl } from '@/lib/api'

type CreditPack = Database['public']['Tables']['credit_packs']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  credits: z.number().min(1, 'Credits must be positive'),
  price: z.number().min(0, 'Price must be positive'),
  validity_days: z.number().min(1, 'Validity days must be positive'),
  translations: z.record(z.any()).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
})

type FormData = z.infer<typeof formSchema>

interface CreditPackFormDialogProps {
  creditPack: CreditPack | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreditPackFormDialog({
  creditPack,
  open,
  onOpenChange,
  onSuccess,
}: CreditPackFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      credits: 0,
      price: 0,
      validity_days: 30,
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
      currentValues.credits !== originalValues.credits ||
      currentValues.price !== originalValues.price ||
      currentValues.validity_days !== originalValues.validity_days ||
      JSON.stringify(currentValues.translations) !== JSON.stringify(originalValues.translations)
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

  // Reset form when creditPack changes
  useEffect(() => {
    const newValues: FormData = creditPack ? {
      name: creditPack.name,
      credits: creditPack.credits,
      price: creditPack.price,
      validity_days: creditPack.validity_days,
      translations: (creditPack.translations as Record<string, any>) || {},
      image_url: (creditPack as any).image_url || '',
    } : {
      name: '',
      credits: 0,
      price: 0,
      validity_days: 30,
      translations: {},
      image_url: '',
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [creditPack, form, open])

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: FormData & { translations?: any }) => {
      if (creditPack) {
        // Update
        const response = await fetch(getApiUrl(`/api/credit-packs/${creditPack.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update credit pack')
        }
      } else {
        // Create
        const response = await fetch(getApiUrl('/api/credit-packs'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create credit pack')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-packs'] })
      toast.success(creditPack ? 'Credit pack updated successfully' : 'Credit pack created successfully')
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to save credit pack: ' + error.message)
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const columns = getTranslatableColumns('credit_packs')
      const needsTranslation = shouldTranslateRow(originalValuesRef.current ?? undefined, data, columns)
      let translations = (creditPack?.translations as Record<string, any>) || {}
      if (needsTranslation) {
        try {
          translations = await translateRow('credit_packs', data)
        } catch (err: any) {
          toast.error('Translation failed: ' + err.message)
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
          <SheetTitle>{creditPack ? 'Edit Credit Pack' : 'Create Credit Pack'}</SheetTitle>
          <SheetDescription>
            {creditPack ? 'Update the credit pack configuration' : 'Add a new credit pack'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Starter Pack" />
                    </FormControl>
                    <FormDescription>
                      Display name for this credit pack
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="e.g., 90"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of credits included in this pack
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 19.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Price in US dollars
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validity_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Days</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="e.g., 30"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days the credits remain valid
                    </FormDescription>
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
                          styleName={form.watch('name')}
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

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || mutation.isPending}
                  className="w-full"
                >
                  {isLoading || mutation.isPending ? 'Saving...' : (creditPack ? 'Update Credit Pack' : 'Create Credit Pack')}
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