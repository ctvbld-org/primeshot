'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Copy, FolderPlus, Upload as UploadIcon, Download as DownloadIcon, Trash as TrashIcon, LayoutList, LayoutGrid, Folder } from 'lucide-react'
import { toast } from 'sonner'
import styles from './styles.module.css'
import { TreeNav } from '@/components/media/TreeNav'
import { SegmentedControl } from '@primeshot/common/web/ui/segmented-control'

function usePersistedPrefix() {
  const search = useSearchParams()
  const router = useRouter()
  const qPrefix = search.get('prefix') || ''
  const [prefix, setPrefix] = useState<string>('')

  useEffect(() => {
    if (qPrefix) {
      setPrefix(qPrefix)
      localStorage.setItem('media:lastPrefix', qPrefix)
    } else {
      const saved = localStorage.getItem('media:lastPrefix') || ''
      setPrefix(saved)
      if (saved) router.replace(`/media?prefix=${encodeURIComponent(saved)}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync when URL changes (back/forward)
  useEffect(() => {
    // Avoid unnecessary updates
    setPrefix((prev) => {
      if (prev === qPrefix) return prev
      localStorage.setItem('media:lastPrefix', qPrefix)
      return qPrefix
    })
  }, [qPrefix])

  const update = (next: string) => {
    setPrefix(next)
    localStorage.setItem('media:lastPrefix', next)
    const url = next ? `/media?prefix=${encodeURIComponent(next)}` : '/media'
    router.push(url)
  }

  return { prefix, setPrefix: update }
}

function usePersistedView() {
  const search = useSearchParams()
  const router = useRouter()
  const qView = (search.get('view') || '').toLowerCase()
  const qPrefix = search.get('prefix') || ''
  const [view, setView] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    if (qView === 'list' || qView === 'grid') {
      setView(qView as 'list' | 'grid')
      localStorage.setItem('media:view', qView)
    } else {
      const saved = (localStorage.getItem('media:view') || 'list') as 'list' | 'grid'
      setView(saved)
      const params = new URLSearchParams()
      if (qPrefix) params.set('prefix', qPrefix)
      params.set('view', saved)
      router.replace(`/media?${params.toString()}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync when URL changes (back/forward)
  useEffect(() => {
    if (qView === 'list' || qView === 'grid') {
      setView((prev) => (prev === qView ? prev : (qView as 'list' | 'grid')))
    }
  }, [qView])

  const update = (next: 'list' | 'grid') => {
    setView(next)
    localStorage.setItem('media:view', next)
    const params = new URLSearchParams()
    if (qPrefix) params.set('prefix', qPrefix)
    params.set('view', next)
    router.push(`/media?${params.toString()}`)
  }

  return { view, setView: update }
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiPath = (p: string) => `${BASE_PATH}${p}`

async function list(prefix: string) {
  const res = await fetch(apiPath(`/api/media/list?prefix=${encodeURIComponent(prefix)}`))
  if (!res.ok) throw new Error('Failed to list')
  return res.json() as Promise<{ folders: string[]; files: { key: string; name: string; size: number; lastModified: string | null }[] }>
}

async function getAllFilesInFolder(folderPrefix: string): Promise<string[]> {
  const data = await list(folderPrefix)
  const allFiles: string[] = []
  
  // Add all files in current folder
  allFiles.push(...data.files.map(f => f.key))
  
  // Recursively get files from subfolders
  for (const subfolder of data.folders) {
    const subfolderFiles = await getAllFilesInFolder(subfolder)
    allFiles.push(...subfolderFiles)
  }
  
  return allFiles
}

export default function MediaPage() {
  const { prefix, setPrefix } = usePersistedPrefix()
  const { view, setView } = usePersistedView()
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const SIZE_OPTIONS = [320, 640, 960, 1280, 1920, 2560] as const
  const [sizeEnabled, setSizeEnabled] = useState<Record<number, boolean>>({
    320: true, 640: true, 960: true, 1280: true, 1920: true, 2560: true
  })
  const [convertToWebp, setConvertToWebp] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExpandingFolders, setIsExpandingFolders] = useState(false)
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set())
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [lastToggledIndex, setLastToggledIndex] = useState<number | null>(null)
  const [failedThumbVariants, setFailedThumbVariants] = useState<Set<string>>(new Set())
  const [failedPreview, setFailedPreview] = useState<Set<string>>(new Set())

  const requestIdRef = useRef(0)
  const refresh = async () => {
    const myId = ++requestIdRef.current
    setLoading(true)
    try {
      const data = await list(prefix)
      // Only apply if this request is the latest
      if (myId === requestIdRef.current) {
        setFolders(data.folders)
        // default sort: newest first
        setFiles([...data.files].sort((a, b) => (new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())))
      }
    } finally {
      if (myId === requestIdRef.current) setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [prefix])

  const cdn = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''
  const toCdnUrl = (key: string) => `${cdn}/${key.split('/').map(encodeURIComponent).join('/')}`
  const getImgSrc = (key: string) => failedThumbs.has(key)
    ? `/api/media/download/file?key=${encodeURIComponent(key)}`
    : toCdnUrl(key)

  // Prefer a smaller sibling thumbnail when available (e.g., web_ prefix alongside orig_)
  const getThumbKey = (key: string) => key.replace(/(^|\/)orig_/, '$1web_')
  const getThumbSrc = (key: string) => {
    // Always generate a dynamic thumb for speed and deduplication safety
    if (failedThumbVariants.has(key)) return getImgSrc(key)
    return `/api/media/thumbnail?key=${encodeURIComponent(key)}&w=480`
  }

  const getPreviewSrc = (key: string) => {
    if (failedPreview.has(key)) return getImgSrc(key)
    return `/api/media/thumbnail?key=${encodeURIComponent(key)}&w=1280`
  }

  // Flatten visible items into an ordered array (folders first, then files)
  const orderedItems = useMemo(() => {
    const folderItems = folders.map((f) => ({ key: f, type: 'folder' as const }))
    const fileItems = files.map((f) => ({ key: f.key as string, type: 'file' as const }))
    return [...folderItems, ...fileItems]
  }, [folders, files])

  const toggleSelect = (key: string, checked: boolean, index: number, shiftKey: boolean) => {
    setSelected((prev) => {
      // If shift, select range based on last toggled
      if (shiftKey && lastToggledIndex !== null) {
        const start = Math.min(lastToggledIndex, index)
        const end = Math.max(lastToggledIndex, index)
        const next = new Set(prev)
        for (let i = start; i <= end; i++) {
          const k = orderedItems[i]?.key
          if (!k) continue
          if (checked) next.add(k); else next.delete(k)
        }
        return next
      }
      // Normal single toggle
      const next = new Set(prev)
      if (checked) next.add(key); else next.delete(key)
      return next
    })
    setLastToggledIndex(index)
  }

  const onCreateFolder = async () => {
    const name = prompt('New folder name')?.trim()
    if (!name) return
    const key = `${prefix}${name.endsWith('/') ? name : name + '/'}`
    const res = await fetch(apiPath('/api/media/folder'), { method: 'POST', body: JSON.stringify({ key }) })
    if (res.ok) refresh()
  }

  // Check if we're in a workflow folder
  const isWorkflowFolder = prefix.includes('workflows')
  
  // Determine if files are images
  const areFilesImages = (files: File[]) => {
    return files.every(file => /\.(png|jpe?g|webp|svg)$/i.test(file.name))
  }

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    setPendingFiles(files)
    setConvertToWebp(true) // default for each selection
    
    console.log('Files selected:', files.map(f => f.name))
    console.log('Is workflow folder:', isWorkflowFolder)
    console.log('Are files images:', areFilesImages(files))
    
    // If in workflow folder and files aren't images, upload directly
    if (isWorkflowFolder && !areFilesImages(files)) {
      console.log('Triggering direct upload')
      doDirectUpload(files)
    } else {
      setShowUpload(true)
    }
  }

  function sanitizeBaseName(name: string) {
    const base = name.replace(/\.[^.]+$/,'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-_]/g,'')
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0,14)
    return base || `img-${stamp}`
  }

  async function convertToWebP(file: File, maxDim: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          let w = img.width, h = img.height
          if (w > maxDim || h > maxDim) {
            const r = w / h
            if (w > h) { w = maxDim; h = w / r } else { h = maxDim; w = h * r }
          }
          canvas.width = Math.round(w)
          canvas.height = Math.round(h)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('blob')), 'image/webp', quality)
        }
        img.onerror = () => reject(new Error('load'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('read'))
      reader.readAsDataURL(file)
    })
  }

  const doDirectUpload = async (filesToUpload?: File[]) => {
    try {
      setIsUploading(true)
      const uploadPath = prefix.replace(/\/$/, '')
      const files = filesToUpload || pendingFiles
      
      console.log('Direct upload starting with files:', files.map(f => f.name))
      console.log('Upload path:', uploadPath)
      
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        form.append('uploadPath', uploadPath)
        form.append('directUpload', 'true') // Flag to indicate direct upload
        
        console.log('Uploading file:', file.name)
        const response = await fetch(apiPath('/api/upload'), { method: 'POST', body: form })
        console.log('Upload response:', response.status, response.ok)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`)
        }
      }
      
      setShowUpload(false)
      setPendingFiles([])
      refresh()
      toast.success(`Uploaded ${files.length} file(s)`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally { 
      setIsUploading(false) 
    }
  }

  const doUploadWithVariants = async () => {
    try {
      setIsUploading(true)
      const uploadPath = prefix.replace(/\/$/, '')
      const enabledSizes = SIZE_OPTIONS.filter((w) => sizeEnabled[w])
      for (const f of pendingFiles) {
        const base = sanitizeBaseName(f.name)
        const baseBlob = await convertToWebP(f, Math.max(...SIZE_OPTIONS), 0.95)
        // base file (no suffix)
        const baseFile = new File([baseBlob], `${base}.webp`, { type: 'image/webp' })
        const baseForm = new FormData()
        baseForm.append('file', baseFile, baseFile.name)
        baseForm.append('uploadPath', uploadPath)
        await fetch(apiPath('/api/upload'), { method: 'POST', body: baseForm })

        // variants
        for (const w of enabledSizes.filter(w => w < Math.max(...SIZE_OPTIONS))) {
          const q = w >= 1280 ? 0.92 : 0.88
          const vb = await convertToWebP(f, w, q)
          const vf = new File([vb], `${base}-w${w}.webp`, { type: 'image/webp' })
          const form = new FormData()
          form.append('file', vf, vf.name)
          form.append('uploadPath', uploadPath)
          await fetch(apiPath('/api/upload'), { method: 'POST', body: form })
        }
      }
      setShowUpload(false)
      setPendingFiles([])
      refresh()
    } finally { setIsUploading(false) }
  }

  const onDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item(s)?`)) return
    const keys = Array.from(selected)
    // Optimistic UI update: remove from folders/files immediately
    const prevFolders = folders
    const prevFiles = files
    const nextFolders = folders.filter(f => !keys.includes(f))
    const nextFiles = files.filter(f => !keys.includes(f.key))
    setFolders(nextFolders)
    setFiles(nextFiles)
    setSelected(new Set())
    const res = await fetch(apiPath('/api/media/delete'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) })
    if (!res.ok) {
      // Revert on failure
      setFolders(prevFolders)
      setFiles(prevFiles)
      toast.error('Failed to delete items')
    }
  }

  const onDownload = async () => {
    const keys = Array.from(selected)
    if (keys.length === 0) return
    
    try {
      setIsExpandingFolders(true)
      
      // Separate folders from files
      const selectedFolders = folders.filter(folder => keys.includes(folder))
      const selectedFiles = files.filter(file => keys.includes(file.key)).map(file => file.key)
      
      let allFilesToDownload = [...selectedFiles]
      
      // Expand folders to include all files within them
      if (selectedFolders.length > 0) {
        toast.info(`Expanding ${selectedFolders.length} folder(s) to include all files...`)
        
        for (const folder of selectedFolders) {
          const folderFiles = await getAllFilesInFolder(folder)
          allFilesToDownload.push(...folderFiles)
        }
        
        // Remove duplicates
        allFilesToDownload = [...new Set(allFilesToDownload)]
        
        if (selectedFolders.length > 0) {
          toast.success(`Found ${allFilesToDownload.length - selectedFiles.length} additional files in ${selectedFolders.length} folder(s)`)
        }
      }
      
      if (allFilesToDownload.length === 0) {
        toast.error('No files found to download')
        return
      }
      
      if (allFilesToDownload.length === 1) {
        // Single file download
        window.location.href = apiPath(`/api/media/download/file?key=${encodeURIComponent(allFilesToDownload[0])}`)
        return
      }
      
      // Multiple files - create zip
      toast.info(`Preparing download of ${allFilesToDownload.length} files...`)
      
      // Preflight to get parts
      const pre = await fetch(apiPath('/api/media/download/zip'), { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ keys: allFilesToDownload }) 
      })
      
      if (!pre.ok) {
        throw new Error('Failed to prepare download')
      }
      
      const { parts } = await pre.json()
      
      for (let i = 0; i < parts.length; i++) {
        const res = await fetch(apiPath(`/api/media/download/zip?part=${i}`), { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ keys: allFilesToDownload }) 
        })
        
        if (!res.ok) {
          throw new Error(`Failed to download part ${i + 1}`)
        }
        
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `media-part-${i + 1}.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
      
      toast.success(`Download started for ${allFilesToDownload.length} files`)
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExpandingFolders(false)
    }
  }

  const crumbs = useMemo(() => {
    const parts = prefix.split('/').filter(Boolean)
    const acc: { label: string; pfx: string }[] = []
    let p = ''
    for (const part of parts) { p += part + '/'; acc.push({ label: part, pfx: p }) }
    return acc
  }, [prefix])

  const copyPath = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast.success('Path copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className={styles.mediaLayout}>
      {/* Left tree (simple: show only current level; expand/collapse and lazy tree could be added with dedicated component) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Folders</div>
        <TreeNav selectedPrefix={prefix} onSelect={setPrefix} />
      </aside>

      {/* Right content */}
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.actions + ' ' + styles.actionsLeft}>
            <Button variant="ghost" onClick={onCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create folder
            </Button>
            <label className={styles.uploadLabel}>
              <input 
                type="file" 
                multiple 
                accept={isWorkflowFolder ? "*/*" : "image/*"} 
                onChange={onPickFiles} 
                hidden 
              />
              <UploadIcon className="mr-2 h-4 w-4" />
              <span>Upload</span>
            </label>
          </div>
          <div className={styles.actionsRight}>
            <Button variant="ghost" onClick={onDownload} disabled={selected.size === 0 || isExpandingFolders}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              {isExpandingFolders ? 'Expanding...' : 'Download'}
            </Button>
            <Button variant="ghost" onClick={onDelete} disabled={selected.size === 0}>
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className={styles.viewToggle}>
              <SegmentedControl
                size="sm"
                fullWidth={false}
                ariaLabel="View mode"
                value={view}
                onChange={(v)=> setView(v as 'list' | 'grid')}
                options={[
                  { value: 'list', content: <div style={{display:'inline-flex',alignItems:'center',gap:6}}><LayoutList size={16}/> <span>List</span></div> },
                  { value: 'grid', content: <div style={{display:'inline-flex',alignItems:'center',gap:6}}><LayoutGrid size={16}/> <span>Thumbnails</span></div> },
                ]}
              />
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <div className={styles.table}>
            {loading ? (
              <div className={styles.loading}>Loading…</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{width: 24}}></th>
                    <th className={styles.sortable} onClick={()=> setFiles(prev => [...prev].sort((a,b)=> a.name.localeCompare(b.name)))}>Name</th>
                    <th className={styles.sortable} onClick={()=> setFiles(prev => [...prev].sort((a,b)=> (b.size - a.size)))}>Size</th>
                    <th className={styles.sortable} onClick={()=> setFiles(prev => [...prev].sort((a,b)=> (new Date(b.lastModified||0).getTime() - new Date(a.lastModified||0).getTime())))}>Last Modified</th>
                    <th style={{width: 40}}></th>
                  </tr>
                </thead>
                <tbody>
                {folders.map((f, fi) => {
                  const key = f
                  const idx = fi // folders come first in orderedItems
                  const checked = selected.has(key)
                    return (
                  <tr key={f}>
                    <td><input type="checkbox" checked={checked} onClick={(e) => toggleSelect(key, (e.target as HTMLInputElement).checked, idx, e.shiftKey)} onChange={()=>{}} /></td>
                      <td>
                        <button className={styles.link} onClick={() => setPrefix(f)}>{f.slice(prefix.length)}</button>
                      </td>
                      <td>—</td>
                      <td>—</td>
                      <td style={{textAlign:'right'}}>
                        <button className={styles.iconBtn} title="Copy S3 path (append to CloudFront)" onClick={() => copyPath(key)}>
                          <Copy size={16} />
                        </button>
                      </td>
                    </tr>)
                  })}
                {files.map((file, fi) => {
                    const isImg = /\.(png|jpe?g|webp|svg)$/i.test(file.name)
                    const key = file.key
                  const idx = folders.length + fi
                    const checked = selected.has(key)
                    return (
                      <tr key={key}>
                      <td><input type="checkbox" checked={checked} onClick={(e) => toggleSelect(key, (e.target as HTMLInputElement).checked, idx, e.shiftKey)} onChange={()=>{}} /></td>
                        <td>
                        {isImg ? (
                          <a className={styles.link} href={toCdnUrl(key)} target="_blank" rel="noreferrer">{file.name}</a>
                          ) : (
                            <span>{file.name}</span>
                          )}
                        </td>
                        <td>{file.size?.toLocaleString?.() || 0}</td>
                        <td>{file.lastModified ? new Date(file.lastModified).toLocaleString() : ''}</td>
                        <td style={{textAlign:'right'}}>
                          <button className={styles.iconBtn} title="Copy S3 path (append to CloudFront)" onClick={() => copyPath(key)}>
                            <Copy size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className={styles.gridArea}>
            {loading ? (
              <div className={styles.loading}>Loading…</div>
            ) : (
              <div className={styles.grid}>
                {folders.map((f, fi) => {
                  const key = f
                  const checked = selected.has(key)
                  const label = f.slice(prefix.length).replace(/\/$/, '')
                  return (
                    <div key={f} className={styles.tile}>
                      <div className={styles.tileHeader}>
                        <input type="checkbox" checked={checked} onClick={(e)=> toggleSelect(key, (e.target as HTMLInputElement).checked, fi, e.shiftKey)} onChange={()=>{}} />
                        <div className={styles.tileActions}>
                          <button className={styles.iconBtn} title="Copy S3 path (append to CloudFront)" onClick={() => copyPath(key)}>
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <button className={styles.folderTile} onClick={()=> setPrefix(f)}>
                        <Folder size={28} />
                      </button>
                      <div className={styles.tileFooter} title={label}>{label}</div>
                    </div>
                  )
                })}
                {files.map((file, fi) => {
                  const isImg = /\.(png|jpe?g|webp|svg)$/i.test(file.name)
                  const key = file.key
                  const checked = selected.has(key)
                  return (
                    <div key={key} className={styles.tile}>
                      <div className={styles.tileHeader}>
                        <input type="checkbox" checked={checked} onClick={(e)=> toggleSelect(key, (e.target as HTMLInputElement).checked, folders.length + fi, e.shiftKey)} onChange={()=>{}} />
                        <div className={styles.tileActions}>
                          <button className={styles.iconBtn} title="Copy S3 path (append to CloudFront)" onClick={() => copyPath(key)}>
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      {isImg ? (
                        <button type="button" className={styles.thumbButton} onClick={()=> setPreviewKey(key)}>
                          <img
                            className={styles.thumb}
                            src={getThumbSrc(key)}
                            alt={file.name}
                            loading="lazy"
                            onError={() => {
                              // If thumb variant fails, mark and fall back to full via CDN->API
                              setFailedThumbVariants(prev => new Set(prev).add(key))
                              setFailedThumbs(prev => new Set(prev).add(key))
                            }}
                          />
                        </button>
                      ) : (
                        <div className={styles.nonImage}>{file.name.split('.').pop()?.toUpperCase()}</div>
                      )}
                      <div className={styles.tileFooter} title={file.name}>{file.name}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
      {previewKey && (
        <Dialog open={!!previewKey} onOpenChange={(v)=> { if (!v) setPreviewKey(null) }}>
          <DialogContent className={styles.previewContent}>
            <DialogBody>
              <div className={styles.previewContainer}>
                <img 
                  src={getPreviewSrc(previewKey)} 
                  className={styles.previewImg} 
                  alt={previewKey.split('/').pop() || 'Image'} 
                  onError={() => setFailedPreview(prev => new Set(prev).add(previewKey))}
                />
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
      <UploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        sizeEnabled={sizeEnabled}
        setSizeEnabled={setSizeEnabled}
        isUploading={isUploading}
        convertToWebp={convertToWebp}
        setConvertToWebp={setConvertToWebp}
        onConfirmConvert={doUploadWithVariants}
        onConfirmDirect={()=> doDirectUpload()}
        fileCount={pendingFiles.length}
      />
    </div>
  )
}

// Mount upload dialog at end of page render

// Upload configuration dialog
function UploadDialog({ open, onOpenChange, sizeEnabled, setSizeEnabled, isUploading, convertToWebp, setConvertToWebp, onConfirmConvert, onConfirmDirect, fileCount }:{
  open: boolean; onOpenChange: (v:boolean)=>void;
  sizeEnabled: Record<number, boolean>;
  setSizeEnabled: (v: Record<number, boolean>)=>void;
  isUploading: boolean;
  convertToWebp: boolean;
  setConvertToWebp: (v: boolean)=>void;
  onConfirmConvert: () => void;
  onConfirmDirect: () => void;
  fileCount: number;
}){
  const sizes = [320,640,960,1280,1920,2560]
  const allOn = sizes.every(w => sizeEnabled[w])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload images</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div style={{marginBottom:8}}>Selected files: {fileCount}</div>
          <label style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
            <input type="checkbox" checked={convertToWebp} onChange={(e)=> setConvertToWebp(e.target.checked)} />
            <span>Convert to WebP</span>
          </label>
          {convertToWebp && (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={allOn} onChange={(e)=>{
                const next: any = {}; for (const s of sizes) next[s]=e.target.checked; setSizeEnabled(next)
              }} />
              <span>All responsive sizes</span>
            </label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8}}>
              {sizes.map(w => (
                <label key={w} style={{display:'flex', alignItems:'center', gap:8}}>
                  <input type="checkbox" checked={!!sizeEnabled[w]} onChange={(e)=> setSizeEnabled({ ...sizeEnabled, [w]: e.target.checked })} />
                  <span>{w}px</span>
                </label>
              ))}
            </div>
          </div>
          )}
        </DialogBody>
        <DialogFooter>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={isUploading}>Cancel</Button>
            {convertToWebp ? (
              <Button onClick={onConfirmConvert} disabled={isUploading}>{isUploading ? 'Uploading…' : 'Upload'}</Button>
            ) : (
              <Button onClick={onConfirmDirect} disabled={isUploading}>{isUploading ? 'Uploading…' : 'Upload as original'}</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


