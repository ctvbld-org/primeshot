'use client'

import { useState, useEffect, useRef } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@primeshot/common'
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
import { Badge } from '@primeshot/common/web/ui/badge'
import { Input } from '@primeshot/common/web/ui/input'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Button } from '@primeshot/common/web/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { shouldTranslateRow, translateRow, getTranslatableColumns } from '@/lib/translation'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { getSceneOptionImage, getWardrobeOptionImage } from '@/lib/get-options-image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@primeshot/common/web/ui/dialog'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@primeshot/common/web/ui/accordion'
import { Icon } from '@primeshot/common/web/Icon'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Add TagWithImage component
function TagWithImage({ label, img, color }: { label: string; img?: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 text-muted-foreground">
      {img && (
        <img
          src={img}
          alt={label}
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      {color && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  )
}

type Style = Database['public']['Tables']['styles']['Row']
type Scene = Database['public']['Tables']['style_scenes']['Row']
type Wardrobe = Database['public']['Tables']['style_wardrobes']['Row']
type Color = Database['public']['Tables']['style_colors']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  prompt: z.string().optional(),
  lora_path: z.string().optional(),
  settings: z.string().optional(),
  preview_images: z.array(z.string()), // Validation moved to onSubmit after deferred uploads
  available_scenes: z.array(z.string()).min(1, 'At least one scene is required'),
  available_wardrobes: z.array(z.string()).min(1, 'At least one wardrobe is required'),
  available_colors: z.array(z.string()), // No minimum required - colors are optional
  // NEW optional ordering fields
  wardrobe_category_order: z.array(z.string()).optional(),
  wardrobe_order: z.record(z.array(z.string())).optional(),
})

type FormData = z.infer<typeof formSchema>

interface StyleFormDialogProps {
  style: Style | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StyleFormDialog({ style, open, onOpenChange, onSuccess }: StyleFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const originalValuesRef = useRef<FormData | null>(null)

  // Fetch options
  const { data: scenes = [] } = useQuery({
    queryKey: ['style-scenes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_scenes')
        .select('*')
        .order('label')
      if (error) throw error
      return data
    },
  })

  const { data: wardrobes = [] } = useQuery({
    queryKey: ['style-wardrobes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_wardrobes')
        .select('*')
        .order('label')
      if (error) throw error
      return data
    },
  })

  const { data: colors = [] } = useQuery({
    queryKey: ['style-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_colors')
        .select('*')
        .order('label')
      if (error) throw error
      return data
    },
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      prompt: '',
      lora_path: '',
      settings: '{}',
      preview_images: [],
      available_scenes: [],
      available_wardrobes: [],
      available_colors: [],
      // NEW
      wardrobe_category_order: [],
      wardrobe_order: {},
    },
  })

  // Function to check if form has changes
  const hasChanges = () => {
    if (!originalValuesRef.current) return false

    const currentValues = form.getValues()
    const originalValues = originalValuesRef.current

    return (
      currentValues.name !== originalValues.name ||
      currentValues.prompt !== originalValues.prompt ||
      currentValues.lora_path !== originalValues.lora_path ||
      currentValues.settings !== originalValues.settings ||
      JSON.stringify(currentValues.preview_images.sort()) !== JSON.stringify(originalValues.preview_images.sort()) ||
      JSON.stringify(currentValues.available_scenes.sort()) !== JSON.stringify(originalValues.available_scenes.sort()) ||
      JSON.stringify(currentValues.available_wardrobes.sort()) !== JSON.stringify(originalValues.available_wardrobes.sort()) ||
      JSON.stringify(currentValues.available_colors.sort()) !== JSON.stringify(originalValues.available_colors.sort()) ||
      JSON.stringify(currentValues.wardrobe_category_order || []) !== JSON.stringify(originalValues.wardrobe_category_order || []) ||
      JSON.stringify(currentValues.wardrobe_order || {}) !== JSON.stringify(originalValues.wardrobe_order || {})
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

  // Reset form when style changes
  useEffect(() => {
    const newValues: FormData = style ? {
      name: style.name,
      prompt: style.prompt || '',
      lora_path: style.lora_path || '',
      settings: JSON.stringify(style.settings || {}, null, 2),
      preview_images: style.preview_images as string[] || [],
      available_scenes: style.available_scenes || [],
      available_wardrobes: style.available_wardrobes || [],
      available_colors: style.available_colors || [],
      wardrobe_category_order: ((style as any)?.wardrobe_category_order || []) as string[],
      wardrobe_order: ((style as any)?.wardrobe_order || {}) as Record<string, string[]>,
    } : {
      name: '',
      prompt: '',
      lora_path: '',
      settings: '{}',
      preview_images: [],
      available_scenes: [],
      available_wardrobes: [],
      available_colors: [],
      wardrobe_category_order: [],
      wardrobe_order: {},
    }
    
    form.reset(newValues)
    originalValuesRef.current = newValues
  }, [style, form])

  // --- NEW: Local ordering state derived from form values and wardrobes list ---
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [perCategoryOrder, setPerCategoryOrder] = useState<Record<string, string[]>>({})
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [draftCategoryOrder, setDraftCategoryOrder] = useState<string[]>([])
  const [draftPerCategoryOrder, setDraftPerCategoryOrder] = useState<Record<string, string[]>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // Derive available categories from selected wardrobes
  const availableWardrobeValues = form.watch('available_wardrobes') || []
  useEffect(() => {
    const present = new Map<string, { value: string; label: string }[]>()
    for (const w of wardrobes as any[]) {
      if (!availableWardrobeValues.includes(w.value)) continue
      const cat = (w.category || 'Other') as string
      const list = present.get(cat) || []
      list.push({ value: w.value as string, label: w.label as string })
      present.set(cat, list)
    }

    // Initialize or sanitize category order
    const currentCatOrder = (form.getValues().wardrobe_category_order || []) as string[]
    const existingCats = Array.from(present.keys())
    const baseOrder = currentCatOrder.length
      ? currentCatOrder.filter(c => present.has(c))
      : existingCats.sort((a,b)=>a.localeCompare(b))
    const missingCats = existingCats.filter(c => !baseOrder.includes(c)).sort((a,b)=>a.localeCompare(b))
    const nextCatOrder = [...baseOrder, ...missingCats]
    setCategoryOrder(nextCatOrder)

    // Initialize or sanitize per-category item order
    const currentPerCat = (form.getValues().wardrobe_order || {}) as Record<string, string[]>
    const nextPerCat: Record<string, string[]> = {}
    for (const cat of nextCatOrder) {
      const options = (present.get(cat) || [])
      const desired = Array.isArray(currentPerCat[cat]) ? currentPerCat[cat] : []
      // Keep only available, then append remaining by label
      const availableSet = new Set(options.map(o => o.value))
      const head = desired.filter(v => availableSet.has(v))
      const tail = options
        .filter(o => !head.includes(o.value))
        .sort((a,b)=>a.label.localeCompare(b.label))
        .map(o => o.value)
      nextPerCat[cat] = [...head, ...tail]
    }
    setPerCategoryOrder(nextPerCat)

    // Reflect in form state so Save includes them
    form.setValue('wardrobe_category_order', nextCatOrder, { shouldDirty: true })
    form.setValue('wardrobe_order', nextPerCat, { shouldDirty: true })
  }, [wardrobes, availableWardrobeValues])

  // Reordering helpers
  const moveInArray = (arr: string[], from: number, to: number) => {
    const copy = [...arr]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  }

  const moveCategory = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= categoryOrder.length) return
    const next = moveInArray(categoryOrder, index, to)
    setCategoryOrder(next)
    form.setValue('wardrobe_category_order', next, { shouldDirty: true })
  }

  const moveWardrobe = (cat: string, index: number, delta: number) => {
    const list = perCategoryOrder[cat] || []
    const to = index + delta
    if (to < 0 || to >= list.length) return
    const next = moveInArray(list, index, to)
    const updated = { ...perCategoryOrder, [cat]: next }
    setPerCategoryOrder(updated)
    form.setValue('wardrobe_order', updated, { shouldDirty: true })
  }

  // Dialog open -> snapshot current state to drafts
  const openOrderDialog = () => {
    setDraftCategoryOrder(categoryOrder)
    setDraftPerCategoryOrder(perCategoryOrder)
    setOrderDialogOpen(true)
  }
  const cancelOrderDialog = () => {
    setOrderDialogOpen(false)
  }
  const saveOrderDialog = () => {
    setCategoryOrder(draftCategoryOrder)
    setPerCategoryOrder(draftPerCategoryOrder)
    form.setValue('wardrobe_category_order', draftCategoryOrder, { shouldDirty: true })
    form.setValue('wardrobe_order', draftPerCategoryOrder, { shouldDirty: true })
    setOrderDialogOpen(false)
  }

  // Draft-side reordering for dialog
  const moveDraftCategory = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= draftCategoryOrder.length) return
    setDraftCategoryOrder(moveInArray(draftCategoryOrder, index, to))
  }
  const moveDraftWardrobe = (cat: string, index: number, delta: number) => {
    const list = draftPerCategoryOrder[cat] || []
    const to = index + delta
    if (to < 0 || to >= list.length) return
    setDraftPerCategoryOrder(prev => ({ ...prev, [cat]: moveInArray(list, index, to) }))
  }

  // Sortable item components
  function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    } as React.CSSProperties
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    )
  }

  // Reset confirmation dialog when sheet closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: async (data: FormData & { translations?: any }) => {
      // Parse settings from JSON string to object
      let parsedSettings = {}
      if (data.settings) {
        try {
          parsedSettings = JSON.parse(data.settings)
        } catch (error) {
          throw new Error('Invalid JSON in settings field. Please check your syntax.')
        }
      }

      // Sanitize ordering payload to only include present categories/items
      const presentCats = new Set((form.getValues().wardrobe_category_order || []) as string[])
      const sanitizedOrder: Record<string, string[]> = {}
      for (const cat of Object.keys(form.getValues().wardrobe_order || {})) {
        if (!presentCats.has(cat)) continue
        const allAvail = new Set(availableWardrobeValues)
        const list = (form.getValues().wardrobe_order || {})[cat] || []
        sanitizedOrder[cat] = list.filter(v => allAvail.has(v))
      }

      const processedData = {
        ...data,
        settings: parsedSettings,
        wardrobe_category_order: (form.getValues().wardrobe_category_order || []) as string[],
        wardrobe_order: sanitizedOrder,
      }

      if (style) {
        // Update (retain S3 images even if removed from this style)
        const res = await fetch(getApiUrl('/api/admin/styles'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: style.id, ...processedData }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update style')
        }
      } else {
        // Create
        const res = await fetch(getApiUrl('/api/admin/styles'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processedData),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create style')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] })
      toast({ title: style ? 'Style updated successfully' : 'Style created successfully' })
      // Reset original values to current values to prevent confirmation dialog
      originalValuesRef.current = form.getValues()
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({ title: 'Failed to save style', description: error.message, variant: 'destructive' })
    },
  })

  // Defer upload integration for preview images
  const uploaders = React.useRef<(() => Promise<string[]>)[]>([])
  const registerUploader = (u: () => Promise<string[]>) => { uploaders.current.push(u) }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      for (const up of uploaders.current) { await up() }
      
      // Get fresh form data after uploads complete (includes uploaded image URLs)
      const freshData = form.getValues()
      
      // Custom validation for preview images after deferred uploads complete
      if (!freshData.preview_images || freshData.preview_images.length === 0) {
        toast({ title: 'Validation Error', description: 'At least one preview image is required', variant: 'destructive' })
        setIsLoading(false)
        return
      }
      
      const columns = getTranslatableColumns('styles')
      const needsTranslation = shouldTranslateRow(style ?? undefined, freshData, columns)
      let translations = style?.translations || null
      if (needsTranslation) {
        try {
          translations = await translateRow('styles', freshData)
        } catch (err: any) {
          toast({ title: 'Translation failed', description: err.message, variant: 'destructive' })
          setIsLoading(false)
          return
        }
      }
      mutation.mutate({ ...freshData, translations })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] !max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{style ? 'Edit Style' : 'Create Style'}</SheetTitle>
          <SheetDescription>
            {style ? 'Update the style details below.' : 'Fill in the details to create a new style.'}
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
                      <Input {...field} placeholder="e.g., Professional Studio" />
                    </FormControl>
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
                      <Textarea {...field} placeholder="AI generation prompt for this style" rows={3} />
                    </FormControl>
                    <FormDescription>
                      Optional prompt to guide AI generation for this style
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lora_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LoRA Path</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="/data/style_loras/.../wan_lora_****_****.safetensors" />
                    </FormControl>
                    <FormDescription>
                      Optional path to the LoRA model file for this style
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settings</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="{}" rows={6} />
                    </FormControl>
                    <FormDescription>
                      JSON settings for per-style ComfyUI node overrides. Example: {`{"FilmGrain": {"grain_intensity": 0.1}}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preview_images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Images</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        styleName={form.watch('name')}
                        uploadPath="app-images/placeholders/styles"
                        deferUpload
                        onRegisterUploader={registerUploader}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_scenes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Scenes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={scenes.map(s => ({
                          value: s.value,
                          label: s.label,
                          image: s.image,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select scenes"
                        showImages
                        className="border-input bg-background hover:bg-background"
                        resolveImageUrl={(opt)=> opt.image ? (getSceneOptionImage as any)(opt.image) : ''}
                        renderTag={(option) => (
                          <Badge variant="outline" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              img={option.image ? getSceneOptionImage(option.image) : undefined} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_wardrobes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Wardrobes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={wardrobes.map(w => ({
                          value: w.value,
                          label: w.label,
                          image: w.image,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select wardrobes"
                        showImages
                        className="border-input bg-background hover:bg-background"
                        resolveImageUrl={(opt)=> opt.image ? (getWardrobeOptionImage as any)(opt.image) : ''}
                        renderTag={(option) => (
                          <Badge variant="secondary" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              img={option.image ? getWardrobeOptionImage(option.image) : undefined} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                    {/* Button to open ordering dialog */}
                    <div className="pt-2">
                      <Button type="button" variant="outline" onClick={openOrderDialog}>
                        Wardrobe Category Order
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Ordering is now handled in dialog */}

              <FormField
                control={form.control}
                name="available_colors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Colors</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={colors.map(c => ({
                          value: c.value,
                          label: c.label,
                          color: c.color,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select colors"
                        showColors
                        className="border-input bg-background hover:bg-background"
                        renderTag={(option) => (
                          <Badge variant="secondary" className="text-xs px-0 flex-shrink-0">
                            <TagWithImage 
                              label={option.label} 
                              color={option.color} 
                            />
                          </Badge>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || isLoading}>
                  {mutation.isPending || isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>

      {/* Ordering Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wardrobe Category Order</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              {draftCategoryOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select wardrobes first to configure ordering.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
                  const { active, over } = e
                  if (!over || active.id === over.id) return
                  // Category drag
                  if (draftCategoryOrder.includes(String(active.id)) && draftCategoryOrder.includes(String(over.id))) {
                    const oldIndex = draftCategoryOrder.indexOf(String(active.id))
                    const newIndex = draftCategoryOrder.indexOf(String(over.id))
                    setDraftCategoryOrder((prev) => arrayMove(prev, oldIndex, newIndex))
                    return
                  }
                  // Wardrobe drag within a category (id format cat::value)
                  const [aCat, aVal] = String(active.id).split('::')
                  const [oCat, oVal] = String(over.id).split('::')
                  if (aCat && oCat && aVal && oVal && aCat === oCat) {
                    const list = draftPerCategoryOrder[aCat] || []
                    const oldIndex = list.indexOf(aVal)
                    const newIndex = list.indexOf(oVal)
                    if (oldIndex !== -1 && newIndex !== -1) {
                      setDraftPerCategoryOrder(prev => ({ ...prev, [aCat]: arrayMove(list, oldIndex, newIndex) }))
                    }
                  }
                }}>
                  <SortableContext items={draftCategoryOrder} strategy={verticalListSortingStrategy}>
                    <Accordion type="multiple" className="w-full">
                      {draftCategoryOrder.map((cat, cIdx) => {
                        const values = draftPerCategoryOrder[cat] || []
                        const items = values.map(val => {
                          const w = (wardrobes as any[]).find(x => x.value === val)
                          return { value: val, label: (w?.label as string) || val, image: (w?.image as string | undefined) }
                        })
                        return (
                          <SortableRow key={cat} id={cat}>
                            <AccordionItem value={cat} className="rounded-md border cursor-move">
                              <AccordionTrigger className="px-3">
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      aria-label="Move up"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cIdx > 0) moveDraftCategory(cIdx, -1) }}
                                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && cIdx > 0) { e.preventDefault(); e.stopPropagation(); moveDraftCategory(cIdx, -1) } }}
                                      className={`inline-flex items-center justify-center rounded-md border px-1 py-1 ${cIdx === 0 ? 'opacity-40 pointer-events-none' : 'hover:bg-accent'}`}
                                    >
                                      <Icon variant="arrowLeft" size={16} style={{ transform: 'rotate(90deg)' }} />
                                    </span>
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      aria-label="Move down"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cIdx < draftCategoryOrder.length - 1) moveDraftCategory(cIdx, +1) }}
                                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && cIdx < draftCategoryOrder.length - 1) { e.preventDefault(); e.stopPropagation(); moveDraftCategory(cIdx, +1) } }}
                                      className={`inline-flex items-center justify-center rounded-md border px-1 py-1 ${cIdx === draftCategoryOrder.length - 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-accent'}`}
                                    >
                                      <Icon variant="arrowRight" size={16} style={{ transform: 'rotate(90deg)' }} />
                                    </span>
                                    <span className="text-sm font-medium min-w-[300px]">{cat}</span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3">
                                <SortableContext items={items.map(i => `${cat}::${i.value}`)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-1">
                                    {items.map((it, idx) => (
                                      <SortableRow key={`${cat}::${it.value}`} id={`${cat}::${it.value}`}>
                                        <div className="flex items-center justify-between rounded-md border px-2 py-1">
                                          <div className="inline-flex items-center gap-2">
                                            {it.image && (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={getWardrobeOptionImage(it.image)} alt={it.label} className="w-5 h-5 rounded object-cover" />
                                            )}
                                            <span className="text-sm">{it.label}</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button type="button" size="icon" variant="ghost" onClick={() => moveDraftWardrobe(cat, idx, -1)} disabled={idx === 0}>
                                              <Icon variant="arrowLeft" size={16} style={{ transform: 'rotate(90deg)' }} />
                                            </Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => moveDraftWardrobe(cat, idx, +1)} disabled={idx === items.length - 1}>
                                              <Icon variant="arrowRight" size={16} style={{ transform: 'rotate(90deg)' }} />
                                            </Button>
                                          </div>
                                        </div>
                                      </SortableRow>
                                    ))}
                                  </div>
                                </SortableContext>
                              </AccordionContent>
                            </AccordionItem>
                          </SortableRow>
                        )
                      })}
                    </Accordion>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={cancelOrderDialog}>Cancel</Button>
            <Button type="button" onClick={saveOrderDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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