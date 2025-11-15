'use client'

import { useEffect, useState, useRef } from 'react'
import * as React from 'react'
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
import { Textarea } from '@primeshot/common/web/ui/textarea'
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
import { getSceneOptionImage } from '@/lib/get-options-image'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { getTranslatableColumns, shouldTranslateRow, translateRow } from '@/lib/translation'
import { getApiUrl } from '@/lib/api'
import { processValue } from '@/lib/utils'

type Scene = Database['public']['Tables']['style_scenes']['Row']

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  image: z.string().optional(),
  prompt: z.string().optional(),
  atmosphere: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface SceneFormDialogProps {
  scene: Scene | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SceneFormDialog({
  scene,
  open,
  onOpenChange,
  onSuccess,
}: SceneFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValues = useRef<FormData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      image: '',
      prompt: '',
      atmosphere: '',
    },
  })

  // Track original values when form loads
  useEffect(() => {
    if (open && scene) {
      const values = {
        label: scene.label || '',
        value: scene.value || '',
        image: scene.image || '',
        prompt: ((scene as any).prompt ?? '') as string,
        atmosphere: ((scene as any).atmosphere ?? '') as string,
      }
      form.reset(values)
      originalValues.current = values
    } else if (open && !scene) {
      const values = {
        label: '',
        value: '',
        image: '',
        prompt: '',
        atmosphere: '',
      }
      form.reset(values)
      originalValues.current = values
    }
  }, [scene, open, form])

  const hasChanges = (): boolean => {
    if (!originalValues.current) return false
    
    const currentValues = form.getValues()
    return (
      currentValues.label !== originalValues.current.label ||
      currentValues.value !== originalValues.current.value ||
      currentValues.image !== originalValues.current.image ||
      (currentValues.prompt ?? '') !== (originalValues.current as any).prompt ||
      (currentValues.atmosphere ?? '') !== (originalValues.current as any).atmosphere
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
    mutationFn: async (data: FormData & { translations?: any }) => {
      const res = await fetch(getApiUrl('/api/admin/style-scenes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create scene')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-scenes'] })
      toast.success('Scene created successfully')
      originalValues.current = form.getValues()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error creating scene:', error)
      toast.error('Failed to create scene')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { translations?: any }) => {
      if (!scene) throw new Error('No scene to update')
      const res = await fetch(getApiUrl('/api/admin/style-scenes'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scene.id, ...data }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update scene')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-scenes'] })
      toast.success('Scene updated successfully')
      originalValues.current = form.getValues()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating scene:', error)
      toast.error('Failed to update scene')
    },
  })

  // Defer upload integration
  const uploaders = React.useRef<(() => Promise<string[]>)[]>([])
  const registerUploader = (u: () => Promise<string[]>) => { uploaders.current = [u] } // Replace instead of push to prevent accumulation

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      // perform deferred uploads if any
      for (const up of uploaders.current) { await up() }
      uploaders.current = [] // Clear after upload to prevent duplication on subsequent saves
      
      // Get fresh form data after uploads complete (includes uploaded image URLs)
      const freshData = form.getValues()
      
      // Process the value field to be URL-friendly
      const processedData = {
        ...freshData,
        value: processValue(freshData.value)
      }
      
      const columns = getTranslatableColumns('scene')
      const needsTranslation = shouldTranslateRow(originalValues.current ?? undefined, processedData as any, columns)
      let translations = ((scene as any)?.translations as Record<string, any>) || {}
      if (needsTranslation) {
        try {
          translations = await translateRow('scene', processedData as any)
        } catch (err: any) {
          toast.error('Translation failed: ' + (err?.message || 'Unknown error'))
          setIsSaving(false)
          return
        }
      }

      if (scene) {
        updateMutation.mutate({ ...(processedData as any), translations })
      } else {
        createMutation.mutate({ ...(processedData as any), translations })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = isSaving || createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {scene ? 'Edit Scene' : 'Create Scene'}
            </SheetTitle>
            <SheetDescription>
              {scene
                ? 'Update the scene details below.'
                : 'Fill in the details to create a new scene.'}
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
                      The display name for this scene option.
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
                      The internal value used for this scene option.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional prompt to guide generation"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Internal text prompt for this scene option.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="atmosphere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atmosphere</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional atmosphere description (e.g., 'warm golden hour', 'moody cinematic')"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Atmosphere description that can be used in style prompts via [atmosphere] placeholder.
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
                        styleName={form.watch('value')}
                        uploadPath="app-images/placeholders/options/scenes"
                        deferUpload
                        onRegisterUploader={registerUploader}
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
                    ? scene
                      ? 'Updating...'
                      : 'Creating...'
                    : scene
                    ? 'Update Scene'
                    : 'Create Scene'}
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