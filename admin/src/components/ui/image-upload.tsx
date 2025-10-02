'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Progress } from '@primeshot/common/web/ui/progress'
import { toast } from 'sonner'
import { uploadImageToS3 } from '@/lib/upload'
import getStyleImages from '@/lib/get-styles-images'
import getOptionsImage, { getSceneOptionImage, getWardrobeOptionImage } from '@/lib/get-options-image'
import { getApiUrl } from '@/lib/api'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  styleName: string
  maxFiles?: number
  maxSizeMB?: number
  uploadPath?: string // <-- Add this
  deferUpload?: boolean
  onRegisterUploader?: (uploader: () => Promise<string[]>) => void
}

export function ImageUpload({
  value,
  onChange,
  styleName,
  maxFiles,
  maxSizeMB = 10,
  uploadPath = 'app-images/placeholders/styles', // <-- Default to styles
  deferUpload = false,
  onRegisterUploader,
}: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [files, setFiles] = useState<{ filename: string; key: string; size: number; lastModified: string | null }[]>([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name'|'newest'>('newest')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [staged, setStaged] = useState<{ file: File; preview: string }[]>([])
  
  // Use ref to store current styleName so deferred upload can access the latest value
  const styleNameRef = useRef(styleName)
  
  // Update ref whenever styleName changes
  useEffect(() => {
    styleNameRef.current = styleName
  }, [styleName])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // If uploading style images, require a non-empty style name to avoid img-* fallbacks
      const isStyleUpload = (uploadPath || '').includes('app-images/placeholders/styles')
      const slug = (styleName || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
      if (!deferUpload && isStyleUpload && !slug) {
        toast.error('Enter a style name before uploading images')
        return
      }
      if (maxFiles && value.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} images`)
        return
      }

      if (deferUpload) {
        const next: { file: File; preview: string }[] = []
        for (const f of acceptedFiles) {
          if (f.size > maxSizeMB * 1024 * 1024) {
            toast.error(`${f.name} is too large. Max size is ${maxSizeMB}MB`)
            continue
          }
          next.push({ file: f, preview: URL.createObjectURL(f) })
        }
        setStaged((prev) => [...prev, ...next])
        toast.success(`${next.length} image(s) staged. They will upload on Save.`)
      } else {
        setIsUploading(true)
        const newFilenames: string[] = []
        try {
          for (const file of acceptedFiles) {
            if (file.size > maxSizeMB * 1024 * 1024) {
              toast.error(`${file.name} is too large. Max size is ${maxSizeMB}MB`)
              continue
            }
            const filename = await uploadImageToS3(
              file,
              styleName,
              value,
              (progress) => {
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: progress,
                }))
              },
              uploadPath
            )
            newFilenames.push(filename)
          }
          onChange([...value, ...newFilenames])
          toast.success(`Uploaded ${newFilenames.length} image(s) successfully`)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error('Failed to upload images')
        } finally {
          setIsUploading(false)
          setUploadProgress({})
        }
      }
    },
    [value, onChange, styleName, maxFiles, maxSizeMB, uploadPath, deferUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: maxFiles ? maxFiles - value.length : undefined,
    disabled: isUploading || (maxFiles ? value.length >= maxFiles : false),
  })

  const removeImage = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const removeStaged = (index: number) => {
    setStaged((prev) => {
      const next = [...prev]
      try { URL.revokeObjectURL(next[index]?.preview) } catch {}
      next.splice(index, 1)
      return next
    })
  }

  // Register uploader for deferred mode
  useEffect(() => {
    if (!deferUpload || !onRegisterUploader) return
    const uploadNow = async (): Promise<string[]> => {
      if (staged.length === 0) return []
      // Validate style name at upload time for deferred mode
      const isStyleUpload = (uploadPath || '').includes('app-images/placeholders/styles')
      const slug = (styleNameRef.current || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
      if (isStyleUpload && !slug) {
        toast.error('Enter a style name before uploading images')
        return []
      }
      setIsUploading(true)
      const newNames: string[] = []
      try {
        for (const s of staged) {
          const name = await uploadImageToS3(
            s.file,
            styleNameRef.current, // Use ref to get the current styleName value at upload time
            [...value, ...newNames],
            undefined,
            uploadPath
          )
          newNames.push(name)
        }
        if (newNames.length) onChange([...value, ...newNames])
        // clear staged
        staged.forEach(s => { try { URL.revokeObjectURL(s.preview) } catch {} })
        setStaged([])
        return newNames
      } catch (e) {
        console.error('Deferred upload failed', e)
        toast.error('Failed to upload staged images')
        return []
      } finally {
        setIsUploading(false)
      }
    }
    onRegisterUploader(uploadNow)
  }, [deferUpload, onRegisterUploader, staged, uploadPath, value, onChange])

  const loadExisting = useCallback(async () => {
    try {
      setIsListing(true)
      const params = new URLSearchParams({ prefix: uploadPath, max: '100' })
      const res = await fetch(getApiUrl(`/api/images/list?${params.toString()}`))
      if (!res.ok) throw new Error('Failed to list images')
      const json = await res.json()
      const list = (json?.files || []) as any[]
      const originalsOnly = list
        .filter(f => typeof f?.filename === 'string')
        // exclude responsive variants like *-w320.webp, *-w1280.jpg, etc.
        .filter(f => !/-w\d+\.(webp|png|jpe?g)$/i.test(String(f.filename)))
      setFiles(originalsOnly)
    } catch (e) {
      toast.error('Failed to load existing images')
    } finally {
      setIsListing(false)
    }
  }, [uploadPath])

  const openPicker = useCallback(() => {
    setIsPickerOpen(true)
    setSelection(new Set())
    setQuery('')
    setSort('newest')
    loadExisting()
  }, [loadExisting])

  const toggleSelect = (name: string) => {
    setSelection(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const resolveThumb = (name: string) => {
    if (!name) return ''
    if (name.startsWith('http')) return name
    if (uploadPath?.includes('website-images/stripes')) {
      const base = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''
      return `${base}/website-images/stripes/${name}`
    }
    if (uploadPath?.includes('options/wardrobes')) return getWardrobeOptionImage(name)
    if (uploadPath?.includes('options/scenes')) return getSceneOptionImage(name)
    if (uploadPath?.includes('options')) return getOptionsImage(name)
    return getStyleImages([name])[0]
  }

  const onAddSelected = () => {
    if (selection.size === 0) return
    const remaining = maxFiles ? Math.max(0, maxFiles - value.length) : selection.size
    const chosen = Array.from(selection).slice(0, remaining)
    const dedup = Array.from(new Set([...value, ...chosen]))
    onChange(dedup)
    setIsPickerOpen(false)
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-gray-400'
        } ${
          isUploading || (maxFiles && value.length >= maxFiles)
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the images here'
            : `Drag & drop images here, or click to select`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {maxFiles ? `${maxFiles - value.length} of ${maxFiles} slots available` : `${value.length} images uploaded (unlimited)`}
        </p>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <div key={filename} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="truncate">{filename}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ))}

      {/* Staged (deferred) images */}
      {deferUpload && staged.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Pending upload</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {staged.map((s, i) => (
              <div key={i} className="relative group">
                <img src={s.preview} alt={`Staged ${i+1}`} className="w-full h-24 object-cover rounded-lg" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeStaged(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Images (already uploaded or selected from existing) */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => {
            // Use appropriate image utility based on upload path (supports subfolders)
            const imgUrl = uploadPath?.includes('options/wardrobes')
              ? getWardrobeOptionImage(url)
              : uploadPath?.includes('options/scenes')
                ? getSceneOptionImage(url)
                : uploadPath?.includes('options')
                  ? getOptionsImage(url)
                  : getStyleImages([url])[0];
            return (
              <div key={index} className="relative group">
                <img
                  src={imgUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Browse existing */}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={openPicker} disabled={isUploading}>Browse existing</Button>
      </div>

      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent fullscreen>
          <DialogHeader>
            <DialogTitle>Browse existing images</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {/* Sticky filter bar */}
            <div className="sticky top-0 bg-background z-10 py-2">
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by filename"
                  className="w-full h-10 rounded border bg-background px-3"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="h-10 rounded border bg-background px-3"
                >
                  <option value="newest">Newest</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {isListing ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {files
                  .filter(f => !query || f.filename.toLowerCase().includes(query.toLowerCase()))
                  .sort((a, b) => sort === 'name'
                    ? a.filename.localeCompare(b.filename)
                    : (new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())
                  )
                  .map((f) => {
                    const name = f.filename
                    const url = resolveThumb(name)
                    const already = value.includes(name)
                    const selected = selection.has(name)
                    const capacityFull = maxFiles ? value.length + selection.size >= maxFiles : false
                    const disabled = already || (!selected && capacityFull)
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => !disabled && toggleSelect(name)}
                        className={`relative rounded overflow-hidden border ${selected ? 'ring-2 ring-primary' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-pressed={selected}
                      >
                        <img src={url} alt={name} className="w-full h-32 object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{name}</div>
                      </button>
                    )
                  })}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPickerOpen(false)}>Cancel</Button>
              <Button type="button" onClick={onAddSelected} disabled={selection.size === 0}>Add selected</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and converting to WebP...
        </div>
      )}
    </div>
  )
}