'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@primeshot/common/web/ui/sheet'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@primeshot/common/web/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@primeshot/common/web/ui/alert-dialog'
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'

interface Row { key: string; value: any }

export function InferenceSettingsFormDialog({ row, open, onOpenChange, onSuccess }: { row: Row | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [keyValue, setKeyValue] = useState(row?.key || '')
  const [jsonValue, setJsonValue] = useState(row ? JSON.stringify(row.value, null, 2) : '')
  const originalRef = useRef<{ key: string; json: string } | null>(null)

  useEffect(() => {
    setKeyValue(row?.key || '')
    setJsonValue(row ? JSON.stringify(row.value, null, 2) : '')
    originalRef.current = { key: row?.key || '', json: row ? JSON.stringify(row.value, null, 2) : '' }
  }, [row])

  const hasChanges = () => {
    const original = originalRef.current
    if (!original) return false
    return keyValue !== original.key || jsonValue !== original.json
  }

  const handleClose = () => {
    if (hasChanges()) setShowConfirmDialog(true)
    else onOpenChange(false)
  }

  const handleDiscard = () => {
    if (originalRef.current) {
      setKeyValue(originalRef.current.key)
      setJsonValue(originalRef.current.json)
    }
    setShowConfirmDialog(false)
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let parsed: any
      try { parsed = jsonValue ? JSON.parse(jsonValue) : null } catch (e: any) { throw new Error('Value must be valid JSON') }
      const res = await fetch('/api/admin/inference-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyValue, value: parsed })
      })
      if (!res.ok) throw new Error('Failed to save setting')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inference-settings'] }); onSuccess() },
  })

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate() }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] !max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{row ? 'Edit Setting' : 'Create Setting'}</SheetTitle>
          <SheetDescription>JSON-based runtime configuration for inference UI and validation</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form>
            <form onSubmit={onSubmit} className="space-y-6">
              <FormField
                name="key"
                render={() => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder="e.g., qualities" disabled={!!row} />
                    </FormControl>
                    <FormDescription>Setting name (immutable when editing)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="value"
                render={() => (
                  <FormItem>
                    <FormLabel>Value (JSON)</FormLabel>
                    <FormControl>
                      <Textarea value={jsonValue} onChange={(e) => setJsonValue(e.target.value)} rows={14} className="font-mono" />
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


