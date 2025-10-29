'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@primeshot/common/web/ui/sheet'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@primeshot/common/web/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@primeshot/common/web/ui/alert-dialog'
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { getApiUrl } from '@/lib/api'

interface Row { key: string; value: any }

const formSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(2, 'Value (JSON) is required'),
})
type FormData = z.infer<typeof formSchema>

export function InferenceSettingsFormDialog({ row, open, onOpenChange, onSuccess }: { row: Row | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { key: '', value: '' },
  })

  const originalRef = useRef<FormData | null>(null)

  useEffect(() => {
    const newValues: FormData = row ? { key: row.key, value: JSON.stringify(row.value, null, 2) } : { key: '', value: '' }
    form.reset(newValues)
    originalRef.current = newValues
  }, [row, form])

  const hasChanges = () => {
    if (!originalRef.current) return false
    const now = form.getValues()
    return now.key !== originalRef.current.key || now.value !== originalRef.current.value
  }

  const handleClose = () => {
    if (hasChanges()) setShowConfirmDialog(true)
    else onOpenChange(false)
  }

  const handleDiscard = () => {
    if (originalRef.current) form.reset(originalRef.current)
    setShowConfirmDialog(false)
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      let parsed: any
      try { parsed = data.value ? JSON.parse(data.value) : null } catch { throw new Error('Value must be valid JSON') }
      const res = await fetch(getApiUrl('/api/admin/inference-settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: data.key, value: parsed })
      })
      if (!res.ok) throw new Error('Failed to save setting')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-settings'] })
      onSuccess()
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] !max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{row ? 'Edit Setting' : 'Create Setting'}</SheetTitle>
          <SheetDescription>JSON-based runtime configuration for inference UI and validation</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., qualities" disabled={!!row} />
                    </FormControl>
                    <FormDescription>Setting name (immutable when editing)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (JSON)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={14} className="font-mono" />
                    </FormControl>
                    <FormDescription>Provide valid JSON (array or object)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close?</AlertDialogTitle>
            <AlertDialogDescription>All changes made will be lost. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}


