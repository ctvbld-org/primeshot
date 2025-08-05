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

type CreditPack = Database['public']['Tables']['credit_packs']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  credits: z.number().min(1, 'Credits must be at least 1'),
  price: z.number().min(0.01, 'Price must be at least $0.01'),
  stripe_product_id: z.string().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      credits: 100,
      price: 10,
      stripe_product_id: '',
    },
  })

  // Reset form when credit pack changes
  useEffect(() => {
    if (creditPack) {
      form.reset({
        name: creditPack.name,
        description: creditPack.description || '',
        credits: creditPack.credits,
        price: creditPack.price,
        stripe_product_id: creditPack.stripe_product_id || '',
      })
    } else {
      form.reset()
    }
  }, [creditPack, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Prepare data for database
      const dbData = {
        ...data,
        stripe_product_id: data.stripe_product_id || null,
      }

      if (creditPack) {
        // Update
        const { error } = await supabase
          .from('credit_packs')
          .update(dbData)
          .eq('id', creditPack.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('credit_packs')
          .insert([dbData])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-packs'] })
      toast.success(creditPack ? 'Credit pack updated successfully' : 'Credit pack created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error('Failed to save credit pack: ' + error.message)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  // Calculate price per credit
  const credits = form.watch('credits')
  const price = form.watch('price')
  const pricePerCredit = credits > 0 ? (price / credits).toFixed(3) : '0'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{creditPack ? 'Edit Credit Pack' : 'Create Credit Pack'}</DialogTitle>
          <DialogDescription>
            {creditPack ? 'Update the credit pack' : 'Add a new credit pack'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 100 Credits Pack" />
                  </FormControl>
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
                    <Textarea {...field} placeholder="Pack description" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {credits > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Price per credit: <span className="font-medium text-foreground">${pricePerCredit}</span>
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="stripe_product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Product ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="price_..." />
                  </FormControl>
                  <FormDescription>
                    The Stripe price ID for this credit pack
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