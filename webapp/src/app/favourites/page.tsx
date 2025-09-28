'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './styles.module.css'
import { useAuth } from '@/contexts/auth-context'
import { SignInForm } from '@primeshot/common/web/SignInForm'
import { getInferenceImageThumbnail, getInferenceImageCard, getInferenceImageUrl } from '@/lib/utils/get-inference-image'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { InferenceImageViewerDialog } from '@/components/inference/InferenceImageViewerDialog'
import type { InferenceJob } from '@/hooks/useInferenceQueue'
import { Button } from '@primeshot/common/web/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip'
import { Icon } from '@primeshot/common/web/Icon'
import { Loader } from '@primeshot/common/web/ui/loader'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'

type FavouriteRow = {
  id: string
  inference_id: string
  user_id: string
  original_path: string | null
  web_path: string | null
  created_at: string
}

export default function FavouritesPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { openDialog } = useDialogService()
  const [rows, setRows] = useState<FavouriteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Record<string, { fav?: boolean; del?: boolean; dl?: boolean }>>({})
  const [columns, setColumns] = useState(3)
  const [metaByJob, setMetaByJob] = useState<Record<string, any>>({})

  // Stable transition image for unauthenticated view to avoid flicker
  const allTransitionImages = useMemo(() => ([
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-1-w1920.webp` : '/website-images/landing-page-1-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-2-w1920.webp` : '/website-images/landing-page-2-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-3-w1920.webp` : '/website-images/landing-page-3-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-4-w1920.webp` : '/website-images/landing-page-4-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-5-w1920.webp` : '/website-images/landing-page-5-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-6-w1920.webp` : '/website-images/landing-page-6-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-12-w1920.webp` : '/website-images/landing-page-7-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-8-w1920.webp` : '/website-images/landing-page-8-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-9-w1920.webp` : '/website-images/landing-page-9-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-10-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-13-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-15-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
  ]), [])

  const randomTransitionImage = useMemo(() => {
    const shuffled = [...allTransitionImages].sort(() => Math.random() - 0.5)
    return shuffled[Math.floor(Math.random() * shuffled.length)]
  }, [allTransitionImages])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!user?.id) { setLoading(false); return }
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('generated_images')
          .select('id,inference_id,user_id,original_path,web_path,created_at')
          .eq('user_id', user.id)
          .eq('favourite', true)
          .order('created_at', { ascending: false })
        if (error) throw error
        const rows = (data || []) as FavouriteRow[]
        if (mounted) setRows(rows)

        // Fetch job metadata for these favourites to show shoot info in the viewer
        const jobIds = Array.from(new Set(rows.map(r => r.inference_id).filter(Boolean)))
        if (jobIds.length > 0) {
          const { data: jobsMeta } = await supabase
            .from('inference_jobs')
            .select('id, style_id, scene_id, wardrobe_id, color_id, aspect_ratio, quality, character_id')
            .in('id', jobIds)
          const metaMap: Record<string, any> = {}
          ;(jobsMeta || []).forEach((j: any) => { metaMap[j.id] = j })
          // Optionally load character names/thumbs
          try {
            const { charactersApi } = await import('@/lib/api/characters')
            const charIds = Array.from(new Set((jobsMeta || []).map((j: any) => j.character_id).filter(Boolean)))
            if (charIds.length > 0) {
              const chars = await charactersApi.getCharactersByIds(charIds)
              const map: Record<string, any> = {}
              ;(chars || []).forEach((c: any) => { map[c.id] = c })
              Object.values(metaMap).forEach((m: any) => {
                const c = map[m.character_id]
                if (c) { m.character_name = c.name; m.character_thumbnail_url = c.thumbnail_url }
              })
            }
          } catch {}
          if (mounted) setMetaByJob(metaMap)
        }
      } catch (e) {
        if (mounted) setRows([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [user?.id])

  // Track current column count to render placeholders when < columns
  useEffect(() => {
    const calc = () => {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      if (w <= 640) { setColumns(1); return }
      if (w <= 1024) { setColumns(2); return }
      setColumns(3)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const thumbnails = useMemo(() => {
    return rows.map((img, index) => ({
      id: img.id,
      jobId: img.inference_id,
      status: 'completed' as const,
      index,
      progress: 100,
      webImageUrl: img.web_path ? getInferenceImageUrl(img.web_path, true) : undefined,
      imageUrl: img.original_path ? getInferenceImageUrl(img.original_path, false) : undefined,
      imageId: img.id,
      favourite: true,
    }))
  }, [rows])

  // Build a synthetic job grouping all favourites into one viewer stream
  const job: InferenceJob = useMemo(() => {
    // Try to enrich from the selected thumbnail's real job each time the index changes in the viewer; here we set defaults
    // We provide aspectRatio/quality/character info when the dialog opens via the meta map (handled through thumbnails jobId lookup in the dialog)
    return {
      id: 'favourites',
      status: 'completed',
      thumbnails,
      createdAt: new Date(),
      nbTakes: thumbnails.length,
    }
  }, [thumbnails])

  const onClick = useCallback((index: number) => {
    // Before opening, try to project metadata of the clicked image's job onto the synthetic job so the sidebar shows details
    const row = rows[index]
    const meta = row ? metaByJob[row.inference_id] : undefined
    const enriched: InferenceJob = meta ? {
      ...job,
      aspectRatio: meta.aspect_ratio || job.aspectRatio,
      quality: meta.quality || job.quality,
      styleId: meta.style_id || job.styleId,
      sceneId: meta.scene_id || job.sceneId,
      wardrobeId: meta.wardrobe_id || job.wardrobeId,
      colorId: meta.color_id || job.colorId,
      characterId: meta.character_id || job.characterId,
      characterName: meta.character_name || job.characterName,
      characterThumbnailUrl: meta.character_thumbnail_url || job.characterThumbnailUrl,
    } : job
    openDialog(
      <InferenceImageViewerDialog
        job={enriched}
        initialImageIndex={index}
        shootNumber={0}
        fullscreen={true}
        noContainer={true}
        hideHeader={true}
      />,
      {
        title: 'Favourites',
        description: 'Manage your favourites'
      }
    )
  }, [job, rows, metaByJob, openDialog])

  const toggleFavourite = useCallback(async (id: string) => {
    setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), fav: true } }))
    try {
      const { setImageFavourite } = await import('@/lib/api/inference-images')
      await setImageFavourite(id, false)
      setRows(prev => prev.filter(r => r.id !== id))
    } finally {
      setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), fav: false } }))
    }
  }, [])

  const deleteImage = useCallback(async (id: string) => {
    setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), del: true } }))
    try {
      const { deleteGeneratedImage } = await import('@/lib/api/inference-images')
      await deleteGeneratedImage(id)
      setRows(prev => prev.filter(r => r.id !== id))
    } finally {
      setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), del: false } }))
    }
  }, [])

  const downloadImage = useCallback(async (row: FavouriteRow) => {
    const id = row.id
    setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), dl: true } }))
    try {
      const imageUrl = row.original_path ? getInferenceImageUrl(row.original_path, false) : (row.web_path ? getInferenceImageUrl(row.web_path, true) : '')
      if (!imageUrl) return
      const resp = await fetch(imageUrl)
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `primeshot-${(row.inference_id || 'fav').slice(0,8)}-${row.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // no-op
    } finally {
      setBusy(prev => ({ ...prev, [id]: { ...(prev[id] || {}), dl: false } }))
    }
  }, [])

  // Gate rendering until auth resolves to avoid sign-in flicker
  if (isLoading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title + ' ' + styles.titleSkeleton}></h1>
        <div className={styles.masonry}>
          <Skeleton className={styles.placeholderSkeleton} />
          <Skeleton className={styles.placeholderSkeleton} />
          <Skeleton className={styles.placeholderSkeleton} />
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className={styles.main + ' ' + styles.signIn}>
        <SignInForm />
        <img src={randomTransitionImage} alt="Transition" className={styles.transitionImage} />
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Favourites</h1>
      {loading ? (
        <div className={styles.masonry}>
          <Skeleton className={styles.placeholderSkeleton} />
          <Skeleton className={styles.placeholderSkeleton} />
          <Skeleton className={styles.placeholderSkeleton} />
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.masonry}>
          <div className={styles.placeholder} aria-hidden="true" />
          <div className={styles.placeholder}>No favourites yet</div>
          <div className={styles.placeholder} aria-hidden="true" />
        </div>
      ) : (
        <div className={styles.masonry}>
          {rows.map((row, i) => {
            const base = row.web_path ? getInferenceImageUrl(row.web_path, true) : (row.original_path ? getInferenceImageUrl(row.original_path, false) : '')
            const src480 = getInferenceImageThumbnail(base)
            const src720 = getInferenceImageCard(base)
            const b = busy[row.id] || {}
            return (
              <div key={row.id} className={styles.card} onClick={() => onClick(i)} aria-label={`Open favourite ${i+1}`}>
                <img
                  src={src480}
                  srcSet={`${src480} 480w, ${src720} 720w`}
                  sizes="(max-width: 640px) 360px, 33vw"
                  className={styles.image}
                  alt="Favourite"
                  loading="lazy"
                  decoding="async"
                />
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={() => toggleFavourite(row.id)} aria-label="Remove from favourites" disabled={!!b.fav}>
                          {b.fav ? <Loader size="sm" /> : <Icon variant="heart" size={18} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Remove from Favourites</TooltipContent>
                    </Tooltip>
                    <div className={styles.actionsGroupBtns}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={() => deleteImage(row.id)} aria-label="Delete image" disabled={!!b.del}>
                            {b.del ? <Loader size="sm" /> : <Icon variant="bin" size={18} />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Delete</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={() => downloadImage(row)} aria-label="Download image" disabled={!!b.dl}>
                            {b.dl ? <Loader size="sm" /> : <Icon variant="download" size={18} />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Download</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            )
          })}
          {Array.from({ length: Math.max(0, columns - rows.length) }).map((_, i) => (
            <div key={`ph-${i}`} className={styles.placeholder} aria-hidden="true" />
          ))}
        </div>
      )}
    </main>
  )
}


