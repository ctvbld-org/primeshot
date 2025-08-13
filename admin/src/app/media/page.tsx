'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Copy, FolderPlus, Upload as UploadIcon, Download as DownloadIcon, Trash as TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import styles from './styles.module.css'
import { TreeNav } from '@/components/media/TreeNav'

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

  const update = (next: string) => {
    setPrefix(next)
    localStorage.setItem('media:lastPrefix', next)
    const url = next ? `/media?prefix=${encodeURIComponent(next)}` : '/media'
    router.push(url)
  }

  return { prefix, setPrefix: update }
}

async function list(prefix: string) {
  const res = await fetch(`/api/media/list?prefix=${encodeURIComponent(prefix)}`)
  if (!res.ok) throw new Error('Failed to list')
  return res.json() as Promise<{ folders: string[]; files: { key: string; name: string; size: number; lastModified: string | null }[] }>
}

export default function MediaPage() {
  const { prefix, setPrefix } = usePersistedPrefix()
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
  const [isUploading, setIsUploading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await list(prefix)
      setFolders(data.folders)
      // default sort: newest first
      setFiles([...data.files].sort((a, b) => (new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [prefix])

  const cdn = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''

  const onCreateFolder = async () => {
    const name = prompt('New folder name')?.trim()
    if (!name) return
    const key = `${prefix}${name.endsWith('/') ? name : name + '/'}`
    const res = await fetch('/api/media/folder', { method: 'POST', body: JSON.stringify({ key }) })
    if (res.ok) refresh()
  }

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    setPendingFiles(files)
    setShowUpload(true)
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
        await fetch('/api/upload', { method: 'POST', body: baseForm })

        // variants
        for (const w of enabledSizes.filter(w => w < Math.max(...SIZE_OPTIONS))) {
          const q = w >= 1280 ? 0.92 : 0.88
          const vb = await convertToWebP(f, w, q)
          const vf = new File([vb], `${base}-w${w}.webp`, { type: 'image/webp' })
          const form = new FormData()
          form.append('file', vf, vf.name)
          form.append('uploadPath', uploadPath)
          await fetch('/api/upload', { method: 'POST', body: form })
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
    const res = await fetch('/api/media/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) })
    if (res.ok) { setSelected(new Set()); refresh() }
  }

  const onDownload = async () => {
    const keys = Array.from(selected)
    if (keys.length === 0) return
    if (keys.length === 1) {
      // trigger native download
      window.location.href = `/api/media/download/file?key=${encodeURIComponent(keys[0])}`
      return
    }
    // Preflight to get parts
    const pre = await fetch('/api/media/download/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) })
    const { parts } = await pre.json()
    for (let i = 0; i < parts.length; i++) {
      const res = await fetch(`/api/media/download/zip?part=${i}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) })
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
              <input type="file" multiple accept="image/*" onChange={onPickFiles} hidden />
              <UploadIcon className="mr-2 h-4 w-4" />
              <span>Upload</span>
            </label>
          </div>
          <div className={styles.actionsRight}>
            <Button variant="ghost" onClick={onDownload} disabled={selected.size === 0}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" onClick={onDelete} disabled={selected.size === 0}>
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

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
                {folders.map((f) => {
                  const key = f
                  const checked = selected.has(key)
                  return (
                  <tr key={f}>
                    <td><input type="checkbox" checked={checked} onChange={(e) => {
                      const next = new Set(selected); if (e.target.checked) next.add(key); else next.delete(key); setSelected(next)
                    }} /></td>
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
                {files.map((file) => {
                  const isImg = /\.(png|jpe?g|webp|svg)$/i.test(file.name)
                  const key = file.key
                  const checked = selected.has(key)
                  return (
                    <tr key={key}>
                      <td><input type="checkbox" checked={checked} onChange={(e) => {
                        const next = new Set(selected); if (e.target.checked) next.add(key); else next.delete(key); setSelected(next)
                      }} /></td>
                      <td>
                        {isImg ? (
                          <a className={styles.link} href={`${cdn}/${key}`} target="_blank" rel="noreferrer">{file.name}</a>
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
      </main>
      <UploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        sizeEnabled={sizeEnabled}
        setSizeEnabled={setSizeEnabled}
        isUploading={isUploading}
        onConfirm={doUploadWithVariants}
        fileCount={pendingFiles.length}
      />
    </div>
  )
}

// Mount upload dialog at end of page render

// Upload configuration dialog
export function UploadDialog({ open, onOpenChange, sizeEnabled, setSizeEnabled, isUploading, onConfirm, fileCount }:{
  open: boolean; onOpenChange: (v:boolean)=>void;
  sizeEnabled: Record<number, boolean>;
  setSizeEnabled: (v: Record<number, boolean>)=>void;
  isUploading: boolean;
  onConfirm: () => void;
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
        </DialogBody>
        <DialogFooter>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={isUploading}>Cancel</Button>
            <Button onClick={onConfirm} disabled={isUploading}>{isUploading ? 'Uploading…' : 'Upload'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


