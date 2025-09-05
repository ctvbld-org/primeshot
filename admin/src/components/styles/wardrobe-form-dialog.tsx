'use client'

import { useEffect, useState, useRef } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@primeshot/common/web/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@primeshot/common/web/ui/command'
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
import { getWardrobeOptionImage } from '@/lib/get-options-image'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { getTranslatableColumns, shouldTranslateRow, translateRow } from '@/lib/translation'

type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  image: z.string().optional(),
  gender: z.enum(['man', 'woman', 'unisex']),
  prompt: z.string().optional(),
  category: z
    .string()
    .min(1, 'Category is required')
    .refine((v) => v.trim().length > 0, { message: 'Category is required' }),
})

type WardrobeFormValues = z.infer<typeof formSchema>

interface WardrobeFormDialogProps {
  wardrobe: Wardrobe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WardrobeFormDialog({
  wardrobe,
  open,
  onOpenChange,
  onSuccess,
}: WardrobeFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValues = useRef<WardrobeFormValues | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<WardrobeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
      image: '',
      gender: 'unisex',
      prompt: '',
      category: '',
    },
  })

  // Category options state
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const defaultCategoryOptions = ['Professional', 'Smart Casual']

  // Load category options on open
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('style_wardrobes')
          .select('category')
          .not('category', 'is', null)

        if (error) throw error
        const cats = (data || [])
          .map((r: any) => (r?.category as string) || '')
          .filter((c: string) => c && c.trim().length > 0)
        const unique = Array.from(new Set([...defaultCategoryOptions, ...cats]))
        setCategoryOptions(unique)
      } catch (e) {
        // Fallback to defaults
        setCategoryOptions(defaultCategoryOptions)
      }
    }
    if (open) {
      loadCategories()
    }
  }, [open, supabase])

  // Track original values when form loads
  useEffect(() => {
    if (open && wardrobe) {
      const values: WardrobeFormValues = {
        label: wardrobe.label || '',
        value: wardrobe.value || '',
        image: wardrobe.image || '',
        gender: ((wardrobe as any).gender ?? 'unisex') as WardrobeFormValues['gender'],
        prompt: ((wardrobe as any).prompt ?? '') as string,
        category: ((wardrobe as any).category ?? '') as string,
      }
      form.reset(values)
      originalValues.current = values
    } else if (open && !wardrobe) {
      const values: WardrobeFormValues = {
        label: '',
        value: '',
        image: '',
        gender: 'unisex',
        prompt: '',
        category: '',
      }
      form.reset(values)
      originalValues.current = values
    }
  }, [wardrobe, open, form])

  const hasChanges = (): boolean => {
    if (!originalValues.current) return false
    
    const inputValues = form.getValues()
    const currentValues: WardrobeFormValues = {
      label: inputValues.label || '',
      value: inputValues.value || '',
      image: inputValues.image,
      gender: (inputValues.gender ?? 'unisex') as WardrobeFormValues['gender'],
      prompt: (inputValues.prompt ?? '') as string,
      category: (inputValues.category ?? '') as string,
    }
    return (
      currentValues.label !== originalValues.current.label ||
      currentValues.value !== originalValues.current.value ||
      currentValues.image !== originalValues.current.image ||
      currentValues.gender !== originalValues.current.gender ||
      (currentValues.prompt ?? '') !== (originalValues.current.prompt ?? '') ||
      (currentValues.category ?? '') !== (originalValues.current.category ?? '')
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
    mutationFn: async (data: WardrobeFormValues & { translations?: any }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/admin/style-wardrobes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create wardrobe')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-wardrobes'] })
      toast.success('Wardrobe created successfully')
      const gv = form.getValues()
      originalValues.current = {
        label: gv.label || '',
        value: gv.value || '',
        image: gv.image,
        gender: (gv.gender ?? 'unisex') as WardrobeFormValues['gender'],
        prompt: (gv.prompt ?? '') as string,
        category: (gv.category ?? '') as string,
      }
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error creating wardrobe:', error)
      toast.error('Failed to create wardrobe')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: WardrobeFormValues & { translations?: any }) => {
      if (!wardrobe) throw new Error('No wardrobe to update')
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/admin/style-wardrobes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wardrobe.id, ...data }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update wardrobe')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-wardrobes'] })
      toast.success('Wardrobe updated successfully')
      const gv = form.getValues()
      originalValues.current = {
        label: gv.label || '',
        value: gv.value || '',
        image: gv.image,
        gender: (gv.gender ?? 'unisex') as WardrobeFormValues['gender'],
        prompt: (gv.prompt ?? '') as string,
        category: (gv.category ?? '') as string,
      }
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating wardrobe:', error)
      toast.error('Failed to update wardrobe')
    },
  })

  // Defer upload integration (single uploader for this form)
  const uploaderRef = React.useRef<(() => Promise<string[]>) | null>(null)
  const registerUploader = (u: () => Promise<string[]>) => { uploaderRef.current = u }

  // Reset uploader when dialog opens/closes to avoid stale closures across entries
  useEffect(() => {
    if (!open) {
      uploaderRef.current = null
    }
  }, [open])

  const onSubmit = async (data: WardrobeFormValues) => {
    setIsSaving(true)
    try {
      if (uploaderRef.current) {
        await uploaderRef.current()
      }
      // Re-read latest form values after deferred uploads may have updated fields (e.g., image)
      const latest = form.getValues()
      const columns = getTranslatableColumns('wardrobe')
      const needsTranslation = shouldTranslateRow(originalValues.current ?? undefined, latest, columns)
      let translations = ((wardrobe as any)?.translations as Record<string, any>) || {}
      if (needsTranslation) {
        try {
          translations = await translateRow('wardrobe', latest)
        } catch (err: any) {
          toast.error('Translation failed: ' + (err?.message || 'Unknown error'))
          setIsSaving(false)
          return
        }
      }

      if (wardrobe) {
        updateMutation.mutate({ ...latest, translations })
      } else {
        createMutation.mutate({ ...latest, translations })
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
              {wardrobe ? 'Edit Wardrobe' : 'Create Wardrobe'}
            </SheetTitle>
            <SheetDescription>
              {wardrobe
                ? 'Update the wardrobe details below.'
                : 'Fill in the details to create a new wardrobe.'}
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
                      The display name for this wardrobe option.
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
                      The internal value used for this wardrobe option.
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
                        uploadPath="app-images/placeholders/options/wardrobes"
                        deferUpload
                        onRegisterUploader={registerUploader}
                        maxFiles={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                          <div
                            role="combobox"
                            aria-expanded={categoryOpen}
                            className="flex h-10 w-full items-center justify-between gap-1 rounded-md border bg-transparent px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                          >
                            <span className="truncate text-muted-foreground">
                              {field.value && field.value.trim().length > 0 ? field.value : 'Select or create a category'}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">▼</span>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" sideOffset={4}>
                          <Command className="rounded-lg border shadow-md">
                            <CommandInput
                              placeholder="Search or type to create"
                              value={categorySearch}
                              onValueChange={setCategorySearch}
                              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <CommandList className="max-h-[260px] overflow-y-auto">
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup className="py-2">
                                {categorySearch && !categoryOptions.some(c => c.toLowerCase() === categorySearch.toLowerCase()) && (
                                  <CommandItem
                                    key={`create-${categorySearch}`}
                                    onSelect={() => {
                                      const newVal = categorySearch.trim()
                                      if (newVal.length > 0 && !categoryOptions.includes(newVal)) {
                                        setCategoryOptions(prev => [...prev, newVal])
                                      }
                                      field.onChange(newVal)
                                      setCategorySearch('')
                                      setCategoryOpen(false)
                                    }}
                                    className="cursor-pointer py-2 px-4"
                                  >
                                    Create "{categorySearch}"
                                  </CommandItem>
                                )}
                                {categoryOptions
                                  .filter(opt => !categorySearch || opt.toLowerCase().includes(categorySearch.toLowerCase()))
                                  .map((opt) => (
                                  <CommandItem
                                    key={opt}
                                    onSelect={() => {
                                      field.onChange(opt)
                                      setCategoryOpen(false)
                                    }}
                                    className="cursor-pointer py-2 px-4"
                                  >
                                    {opt}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormDescription>
                      Optional. Choose an existing category or create a new one.
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
                      Optional. Internal text prompt for this wardrobe option.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value as WardrobeFormValues['gender'])}
                        className="w-full h-10 rounded border bg-background px-3"
                      >
                        <option value="unisex">Unisex</option>
                        <option value="man">Man</option>
                        <option value="woman">Woman</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Target gender for this wardrobe item
                    </FormDescription>
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
                    ? wardrobe
                      ? 'Updating...'
                      : 'Creating...'
                    : wardrobe
                    ? 'Update Wardrobe'
                    : 'Create Wardrobe'}
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