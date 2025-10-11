"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
// Embla type import replaced with any to avoid cross-package type issues
import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { useTranslation } from 'react-i18next'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useScenesFromContext, useWardrobesFromContext, useColorsFromContext } from '@/contexts/style-data-context'
import { useTranslatedScenes, useTranslatedWardrobes, useTranslatedColors } from '@/hooks/useTranslatedStyles'

import { getStyleImages } from '@/lib/utils/get-styles-images'
// For options we will use a custom CloudFront loader that selects the nearest variant
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { storeSelectedStyleIndex, getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { sortColorsByPalette, isLightColor } from '@/lib/utils/colorSort'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useCreditCosts, calculateImageCredits } from '@/hooks/usePricingConfig'
import { useGenerationConfig } from '@/hooks/useGenerationConfig'
import styles from './GenerateBar.module.css'
import { useAuth } from '@/contexts/auth-context'
import { useCharactersApi } from '@/lib/api/characters'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { getApiUrl } from '@/lib/api/client'
import { useJobsApi } from '@/lib/api/jobs'
import { useActionGate } from '@/hooks/useActionGate'
import type { ActiveTrainingJob } from '@/hooks/useActiveTrainingJob'
import { useTrainingProgress, useInferenceProgress } from '@/hooks/useJobProgress'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { Countdown } from '@/components/character/Countdown'
import { useInferenceQueue } from '@/contexts/inference-queue-context'
import { useCallback as useCallbackReact, useRef } from 'react'
// Batched counts replace per-card image fetch

import { OptionsPanel } from './OptionsPanel/OptionsPanel'
import { Loader } from '@primeshot/common/web/ui/loader'
import { GenerateBarSelect } from './GenerateBarSelect'
import { useCreateCharacter } from './useCreateCharacter'
import { Button } from '@primeshot/common/web/ui/button'
import { SegmentedControl } from '@primeshot/common/web/ui/segmented-control'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useQueryClient } from '@tanstack/react-query'
import { confirmationService } from '@/lib/services/confirmationService'
const AdminInferenceOptionsDialog = dynamic(() => import('./AdminInferenceOptionsDialog'), { ssr: false })

type PanelKey = 'styles' | 'scenes' | 'wardrobe' | 'characters' | 'settings' | null

interface GenerateBarProps { emblaApi: any | null; onPanelToggle?: (open: boolean) => void }

export function GenerateBar({ emblaApi, onPanelToggle }: GenerateBarProps) {
  const { t } = useTranslation(['styles', 'common', 'generate'])
  const scenesLoader = makeCloudfrontLoader('app-images/placeholders/options/scenes')
  const wardrobesLoader = makeCloudfrontLoader('app-images/placeholders/options/wardrobes')
  const stylesLoader = makeCloudfrontLoader('app-images/placeholders/styles')
  const { selectedStyleIndex, setSelectedStyleIndex, stylesData } = useStyleSelection()
  
  // Auth state for conditional data loading
  const { isAuthenticated, user: authUser } = useAuth()
  const authReady = isAuthenticated !== undefined // Auth state has been resolved
  
  // Only load option data once auth is ready - now using centralized context
  const { data: rawScenes = [] } = useScenesFromContext()
  const { data: rawWardrobes = [] } = useWardrobesFromContext()
  const { data: rawColors = [] } = useColorsFromContext()
  
  // Apply translations to the loaded data
  const scenes = useTranslatedScenes(rawScenes) || []
  const wardrobes = useTranslatedWardrobes(rawWardrobes) || []
  const colors = useTranslatedColors(rawColors) || []

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  // Wardrobe panel local UI state
  const [selectedWardrobeValue, setSelectedWardrobeValue] = useState<string | null>(null)
  const [selectedGender, setSelectedGender] = useState<'man' | 'woman'>(() => {
    try {
      const raw = localStorage.getItem('generation-wardrobe-gender')
      const v = raw ? JSON.parse(raw) : null
      return v === 'man' || v === 'woman' ? v : 'woman'
    } catch { return 'woman' }
  })
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [isSwitchingGender, setIsSwitchingGender] = useState(false)

  // Validation error state for required selectors
  const [errors, setErrors] = useState<{ character?: boolean; scene?: boolean; wardrobe?: boolean; color?: boolean }>({})
  
  // Helper function to clear specific error fields
  const clearError = useCallback((field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: false }))
  }, [])

  // Settings state stored in localStorage-compatible keys
  const STORAGE_KEYS = {
    NB_TAKES: 'generation-controls-nb-takes',
    ASPECT_RATIO: 'generation-controls-aspect-ratio',
    QUALITY: 'generation-controls-quality',
    WARDROBE_GENDER: 'generation-wardrobe-gender'
  }

  const load = (k: string, def: any) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def }
  }
  const save = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }

  // Normalize various gender strings to 'man' | 'woman'
  const mapGenderToWardrobe = React.useCallback((raw: string | null | undefined): ('man' | 'woman' | null) => {
    const g = String(raw || '').trim().toLowerCase()
    if (!g) { return null }
    if (g === 'm' || g.startsWith('man') || g.startsWith('male')) { return 'man' }
    if (g === 'f' || g === 'w' || g.startsWith('woman') || g.startsWith('female')) { return 'woman' }
    return null
  }, [])

  type QualityCode = string
  const sanitizeQuality = (q: any, allowed: string[]): QualityCode =>
    (allowed.includes(String(q)) ? String(q) : (allowed[0] ?? String(q) ?? ''))

  // Conditional data loading - only fetch generation config after auth is ready
  const { 
    data: generationConfig, 
    isLoading: isLoadingGenerationConfig,
    error: generationConfigError 
  } = useGenerationConfig()
  const inferenceSettings = generationConfig?.inferenceSettings
  const generationCreditCosts = generationConfig?.creditCosts
  
  const [nbTakes, setNbTakes] = useState<number>(() => load(STORAGE_KEYS.NB_TAKES, null))
  const [quality, setQuality] = useState<QualityCode>(() => String(load(STORAGE_KEYS.QUALITY, '')))
  const [aspectRatio, setAspectRatio] = useState<string>(() => load(STORAGE_KEYS.ASPECT_RATIO, ''))

  // Selected character tracking (for selector thumbnail progress overlay)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('character-selection')
      return saved ? JSON.parse(saved).modelId : null
    } catch { return null }
  })

  // Auth-dependent data loading - only fetch when authenticated
  const { data: subscription, isLoading: isLoadingSubscription } = useCurrentSubscription()
  const { data: creditCosts, isLoading: isLoadingCreditCosts } = useCreditCosts() 
  const { hasActiveSubscription, isLoading: isLoadingSubscriptionStatus } = useSubscriptionStatus()
  
  // Calculate overall loading state for GenerateBar
  const isDataLoading = !authReady || isLoadingGenerationConfig || (isAuthenticated && (isLoadingSubscription || isLoadingCreditCosts))
  const hasError = generationConfigError
  const requiredCredits = useMemo(() => {
    const allowed = (inferenceSettings?.qualities || []) as string[]
    const effectiveQuality = quality || (inferenceSettings?.defaults?.quality as string) || allowed[0] || ''
    const takes = typeof nbTakes === 'number' && nbTakes > 0
      ? nbTakes
      : (inferenceSettings?.defaults?.nb_takes as number) || 1
    // Use generation credit costs from batched endpoint, fallback to individual hook
    const costs = generationCreditCosts || creditCosts
    return calculateImageCredits(effectiveQuality, takes, costs) || 0
  }, [nbTakes, quality, generationCreditCosts, creditCosts, inferenceSettings?.defaults?.quality, inferenceSettings?.defaults?.nb_takes, inferenceSettings?.qualities])
  const guard = useCreditGuard(requiredCredits)

  // Jobs API (moved to top-level to avoid creating a new instance in handler)
  const { startInference } = useJobsApi()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const queryClient = useQueryClient()

  const stylesWithPreview = useMemo(() => {
    return stylesData.map((s) => ({
      ...s,
      preview: getStyleImages([s.preview_images?.[0]]).at(0) || ''
    }))
  }, [stylesData])

  const currentStyle = stylesWithPreview[selectedStyleIndex]

  const selectedLabels = useMemo(() => {
    if (!currentStyle) return { scene: '', wardrobe: '', color: '' }
    const sel = getStoredStyleSelections(currentStyle.id)
    const sceneLabel = scenes.find(sc => sc.value.toLowerCase() === sel.scene?.toLowerCase())?.label || ''
    const wardrobeLabel = wardrobes.find(w => w.value.toLowerCase() === sel.wardrobe?.toLowerCase())?.label || ''
    const colorLabel = colors.find(c => c.value.toLowerCase() === sel.color?.toLowerCase())?.label || ''
    return { scene: sceneLabel, wardrobe: wardrobeLabel, color: colorLabel }
  }, [currentStyle?.id, scenes, wardrobes, colors, selectedStyleIndex, selectionVersion])

  // Refresh labels/UI when selections change externally (e.g., via URL init)
  useEffect(() => {
    const bump = () => setSelectionVersion(v => v + 1)
    try { window.addEventListener('style-selections-updated', bump as any) } catch {}
    try { window.addEventListener('storage', bump) } catch {}
    return () => {
      try { window.removeEventListener('style-selections-updated', bump as any) } catch {}
      try { window.removeEventListener('storage', bump) } catch {}
    }
  }, [])

  const checkSticky = useCallback(() => {
    const el = barRef.current
    const container = document.querySelector('[data-styles-container]') as HTMLElement | null
    if (!el || !container) return
    
    const elRect = el.getBoundingClientRect()
    const rect = container.getBoundingClientRect()
    const getHeaderHeight = () => (document.querySelector('header')?.offsetHeight || 56)
    
    const nextSticky = (rect.y + rect.height - elRect.height - getHeaderHeight() - 6) < 6
    setIsSticky(nextSticky)
  }, [])

  const open = (panel: PanelKey) => { 
    setOpenPanel(panel); 
    onPanelToggle?.(true)
    // When opening wardrobe, prefer selected character gender; otherwise keep current (localStorage/default)
    if (panel === 'wardrobe') {
      try {
        if (selectedCharacterId) {
          if (Array.isArray(characters) && characters.length) {
            const char = characters.find((c: any) => c.id === selectedCharacterId)
            const rawCache = (char as any)?.gender ?? (char as any)?.metadata?.gender
            const mapped = mapGenderToWardrobe(rawCache as any)
            if (!mapped && authUser?.id) {
              ;(async () => {
                try {
                  const c = await getCharacter(selectedCharacterId, authUser.id)
                  const rawFetched = (c as any)?.gender ?? (c as any)?.metadata?.gender
                  const fetched = mapGenderToWardrobe(rawFetched as any)
                  if (fetched && fetched !== selectedGender) {
                    setSelectedGender(fetched)
                    save(STORAGE_KEYS.WARDROBE_GENDER, fetched)
                  }
                } catch (e) {
                }
              })()
            }
            if (mapped && mapped !== selectedGender) {
              setSelectedGender(mapped)
              save(STORAGE_KEYS.WARDROBE_GENDER, mapped)
            }
          } else if (authUser?.id) {
            ;(async () => {
              try {
                const c = await getCharacter(selectedCharacterId, authUser.id)
                const mapped = mapGenderToWardrobe((c as any)?.gender)
                if (mapped && mapped !== selectedGender) {
                  setSelectedGender(mapped)
                  save(STORAGE_KEYS.WARDROBE_GENDER, mapped)
                }
              } catch {}
            })()
          }
        }
      } catch {}
    }
    // Check sticky state after panel opens
    setTimeout(checkSticky, 300)
    
    // Scroll to selected item after panel renders
    if (panel === 'styles' || panel === 'scenes' || panel === 'wardrobe') {
      setTimeout(() => scrollToSelectedItem(panel), 300)
    }
    
    // Apply animation to character cards
    if (panel === 'characters') {
      setTimeout(() => {
        const viewport = viewportRef.current
        if (viewport) {
          const itemsContainer = viewport.firstElementChild as HTMLElement
          if (itemsContainer) {
            const allButtons = Array.from(itemsContainer.children) as HTMLElement[]
            allButtons.forEach((button) => {
              button.classList.add(styles.itemCardLoaded)
            })
          }
        }
      }, 300)
    }
  }
  const close = () => { 
    setOpenPanel(null); 
    setSelectedWardrobeValue(null); 
    setPanelQuery(''); 
    onPanelToggle?.(false)
    // Check sticky state after panel closes
    setTimeout(checkSticky, 300)
  }

  const onSelectStyle = useCallback((index: number) => {
    if (!stylesWithPreview[index]) return
    setSelectedStyleIndex(index)
    storeSelectedStyleIndex(index)
    emblaApi?.scrollTo(index)
    close()
  }, [emblaApi, setSelectedStyleIndex, stylesWithPreview])

  

  const qualityOptions = useMemo(() => {
    const codes = (inferenceSettings?.qualities || []) as QualityCode[]
    const labels = (inferenceSettings?.quality_labels || {}) as Record<string, string>
    return codes.map(code => ({
      value: code as QualityCode,
      // Title-friendly label (e.g., Basic, Standard, High)
      label: t(`qualities.${code}` as any, { ns: 'styles', defaultValue: labels[code] || String(code) }),
      // Segmented display now uses DB-provided label to avoid duplicating sources
      display: (() => {
        const raw = labels[code] || String(code).toUpperCase()
        const i18nKey = String(raw).toLowerCase().replace(/[^a-z]/g, '')
        return t(`qualities.${i18nKey}` as any, { ns: 'styles', defaultValue: raw })
      })()
    }))
  }, [inferenceSettings?.qualities, inferenceSettings?.quality_labels, t])

  // Removed current quality title adornment; pills already show the active choice

  // Aspect ratio title label (falls back to defaults when unset)
  const currentAspectLabel = useMemo(() => {
    const effective = aspectRatio || (inferenceSettings?.defaults?.aspect_ratio as string) || ((inferenceSettings?.aspect_ratios?.[0] as string) || '')
    return effective
  }, [aspectRatio, inferenceSettings?.defaults?.aspect_ratio, inferenceSettings?.aspect_ratios])

  // Map aspect ratio string to icon variant id
  const getAspectIcon = (ratio: string): any => {
    const norm = String(ratio).replace(/\s/g, '')
    if (norm === '1:1') return 'ar11'
    if (norm === '2:3') return 'ar23'
    if (norm === '3:2') return 'ar32'
    return 'ar11'
  }

  // Ensure stored quality stays valid if settings change (future-proof for new qualities like 8K)
  React.useEffect(() => {
    const allowed = (inferenceSettings?.qualities || []) as string[]
    if (allowed.length === 0) return
    if (!allowed.includes(String(quality))) {
      const next = sanitizeQuality(
        (inferenceSettings?.defaults?.quality as string) || allowed[0],
        allowed
      )
      setQuality(next as QualityCode)
      save(STORAGE_KEYS.QUALITY, next)
    }
  }, [inferenceSettings?.qualities, inferenceSettings?.defaults?.quality])

  // Panel contents
  // Characters panel hooks and logic (top-level to respect rules of hooks)
  // Use authUser from above
  const { getUserCharacters, getCharacter } = useCharactersApi()
  const [characters, setCharacters] = React.useState<any[]>([])
  const [characterThumbs, setCharacterThumbs] = React.useState<Record<string, string>>({})
  const { runWithGates } = useActionGate(requiredCredits, 'inference')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inferenceJobId, setInferenceJobId] = useState('')
  const [showAdminInfer, setShowAdminInfer] = useState(false)
  const [adminOverride, setAdminOverride] = useState<{ prompt_override: { enabled: boolean; prompt: string } | null; settings_override: { character?: { strength_model?: number; strength_clip?: number }; style?: { strength_model?: number; strength_clip?: number } } | null } | null>(null)
  const { toast } = useToast()
  const hasClearedFailedSelectionRef = useRef<boolean>(false)
  
  // Inference queue integration (only for job creation, not thumbnail management)
  const { createQueuedThumbnails, updateJobWithRealId, updateJobStatus, updateJobMessage, isGenerating } = useInferenceQueue()
  
  const lastClickTimeRef = useRef<number>(0)

  const runGenerate = useCallback(async (override: { prompt_override: { enabled: boolean; prompt: string } | null; settings_override: { character?: { strength_model?: number; strength_clip?: number }; style?: { strength_model?: number; strength_clip?: number } } | null } | null) => {
    let placeholderId: string | null = null;
    
    try {
      // Debouncing - prevent rapid clicks
      const now = Date.now()
      if (now - lastClickTimeRef.current < 1000) {
        return // Ignore clicks within 1 second
      }
      lastClickTimeRef.current = now

      if (isSubmitting) return

      // Basic client-side validation BEFORE mutating state
      const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
      const missing: { character?: boolean; scene?: boolean; wardrobe?: boolean; color?: boolean } = {}
      if (!selectedCharacterId) missing.character = true
      if (!sel?.scene) missing.scene = true
      if (!sel?.wardrobe) missing.wardrobe = true
      if (!sel?.color) missing.color = true

      const allowed = (inferenceSettings?.qualities || []) as string[]
      const defaultsLoaded = Boolean(
        (inferenceSettings?.defaults?.quality as string) &&
        (inferenceSettings?.defaults?.nb_takes as number) &&
        (inferenceSettings?.defaults?.aspect_ratio as string) &&
        allowed.length
      )

      if (Object.keys(missing).length > 0 || !defaultsLoaded || !authUser?.id || !currentStyle) {
        setErrors(missing)
        if (!defaultsLoaded) console.warn('Inference settings defaults not loaded yet')
        if (!authUser?.id) console.warn('User not authenticated')
        if (!currentStyle) console.warn('No style selected')
        return
      }

      const effectiveQuality = (quality || (inferenceSettings?.defaults?.quality as string)) as string
      const effectiveTakes = (nbTakes || (inferenceSettings?.defaults?.nb_takes as number)) as number
      const effectiveAspect = (aspectRatio || (inferenceSettings?.defaults?.aspect_ratio as string)) as string

      const scene_id = sel?.scene || ''
      const wardrobe_id = sel?.wardrobe || ''
      const color_id = sel?.color || ''
      const character_id = selectedCharacterId || ''

      const payload = {
        user_id: authUser.id,
        character_id,
        style_id: currentStyle.id,
        wardrobe_id,
        color_id,
        scene_id,
        params: {
          nb_takes: effectiveTakes,
          quality: effectiveQuality,
          aspect_ratio: effectiveAspect
        }
      }


      // Make API call to get real job ID first
      const data = (await runWithGates(async () => {
        // Create queued thumbnails only after passing gates
        placeholderId = createQueuedThumbnails(effectiveTakes, {
          styleId: currentStyle.id,
          sceneId: scene_id,
          wardrobeId: wardrobe_id,
          colorId: color_id,
          aspectRatio: effectiveAspect,
          quality: effectiveQuality,
          characterId: character_id,
        })

        setIsSubmitting(true)
        try {
          return await startInference({ ...(payload as any), ...(override?.prompt_override ? { prompt_override: override.prompt_override } : {}), ...(override?.settings_override ? { settings_override: override.settings_override } : {}) })
        } catch (err) {
          // Mark placeholder as failed on API error
          if (placeholderId) {
            try { updateJobStatus(placeholderId, 'failed' as any) } catch {}
          }
          throw err
        }
      })) as any
      
      const realJobId = (data as any)?.job_id
      const responseStatus = (data as any)?.status
      if (realJobId) {
        setInferenceJobId(realJobId)
        
        // Update thumbnails with real job ID and status from inference-create response
        if (placeholderId) {
          updateJobWithRealId(placeholderId, realJobId)
        }
        
        // Update status based on inference-create response (queued/pending)
        if (responseStatus) {
          updateJobStatus(realJobId, responseStatus)
          
          // Update message based on response (support i18n keys from API)
          const responseMessage = (data as any)?.message
          const responseKey = (data as any)?.i18n_key
          const responseParams = ((data as any)?.i18n_params || {}) as Record<string, any>
          const translatedMessage = responseKey
            ? t(responseKey as any, { ns: 'styles', defaultValue: responseMessage, ...responseParams })
            : responseMessage
          if (translatedMessage) {
            updateJobMessage(realJobId, translatedMessage)
          }
          
        }
      }
    } catch (e) {
      console.error('Generate error', e)
      
      // Error handling for failed job creation
      // Thumbnail error states will be handled by the job queue component
      
      // Show user-friendly error message
      // TODO: Integrate with toast/notification system
      console.error(t('errors.failedToStartGeneration', { ns: 'generate' }));
      try {
        const msg = (e as any)?.message || ''
        if (typeof msg === 'string' && (msg.includes('Insufficient credits') || msg.includes('402'))) {
          // Open credit packs dialog and refresh credit balance
          try { openCreditPackDialog(requiredCredits) } catch {}
          try {
            await queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
            await queryClient.refetchQueries({ queryKey: ['creditBalance'] })
          } catch {}
        }
      } catch {}
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, authUser?.id, currentStyle?.id, selectedCharacterId, nbTakes, quality, aspectRatio, inferenceSettings, runWithGates, createQueuedThumbnails, updateJobWithRealId])

  const onGenerate = useCallback(async () => {
    if (authUser?.admin) {
      setShowAdminInfer(true)
      return
    }
    await runGenerate(null)
  }, [authUser?.admin, runGenerate])

  // Introduce TTL for character list refresh when panel opens
  const CHARACTER_LIST_TTL_MS = 60_000
  const lastCharactersRefreshRef = React.useRef<number>(0)
  const isRefreshingRef = React.useRef<boolean>(false)
  const selectedCharacterIdRef = React.useRef<string | null>(selectedCharacterId)
  React.useEffect(() => { selectedCharacterIdRef.current = selectedCharacterId }, [selectedCharacterId])

  // Batched uploaded counts and active jobs for all characters
  const [uploadedCounts, setUploadedCounts] = useState<Record<string, number>>({})
  const [activeJobs, setActiveJobs] = useState<Record<string, ActiveTrainingJob | null>>({})

  const fetchBatchedCharacterData = React.useCallback(async (ids: string[]) => {
    if (!ids.length) { setUploadedCounts({}); setActiveJobs({}); return }
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      // Uploaded counts
      const { data: countRows, error: countErr } = await supabase.rpc('get_uploaded_image_counts', { character_ids: ids })
      if (!countErr && Array.isArray(countRows)) {
        const map: Record<string, number> = {}
        for (const row of countRows as any[]) { if (row?.character_id) map[row.character_id] = Number(row.uploaded_count) || 0 }
        setUploadedCounts(map)
      } else {
        setUploadedCounts({})
      }
      // Active jobs (latest per character)
      const { data: jobRows, error: jobErr } = await supabase.rpc('get_active_training_jobs')
      if (!jobErr && Array.isArray(jobRows)) {
        const map: Record<string, ActiveTrainingJob | null> = {}
        for (const row of jobRows as any[]) { if (row?.character_id) map[row.character_id] = row as ActiveTrainingJob }
        setActiveJobs(map)
      } else {
        setActiveJobs({})
      }
    } catch {
      setUploadedCounts({})
      setActiveJobs({})
    }
  }, [])

  const refreshCharacters = React.useCallback(async () => {
    if (isRefreshingRef.current) return
    if (!authUser?.id) { setCharacters([]); return }
    try {
      isRefreshingRef.current = true
      const list = await getUserCharacters(authUser.id)
      setCharacters(list)
      // Convert any stored S3/CloudFront URL or key into our proxied /api/app-images URL
      const toAppImagesUrl = (raw: string | null | undefined): string => {
        try {
          if (!raw) return ''
          // If already a key path, pass through
          if (raw.startsWith('user-images/') || raw.startsWith('app-images/')) {
            return getApiUrl(`/api/app-images?path=${encodeURIComponent(raw)}`)
          }
          // Otherwise parse as URL and extract the S3 key
          const u = new URL(raw)
          const pathname = decodeURIComponent(u.pathname.replace(/^\/+/, ''))
          if (!pathname) return ''
          // Strip any leading bucket segment if present and keep from user-images/ or app-images/
          const idxUser = pathname.indexOf('user-images/')
          const idxApp = pathname.indexOf('app-images/')
          const key = idxUser >= 0 ? pathname.slice(idxUser) : (idxApp >= 0 ? pathname.slice(idxApp) : pathname)
          return getApiUrl(`/api/app-images?path=${encodeURIComponent(key)}`)
        } catch { return '' }
      }

      const map: Record<string,string> = {}
      for (const m of list) {
        if (m.thumbnail_url) {
          map[m.id] = toAppImagesUrl(m.thumbnail_url)
        }
      }
      setCharacterThumbs(map)

      // If the currently selected character is failed/deleted/missing, clear selection (no toast on page load)
      if (selectedCharacterIdRef.current) {
        const selected = list.find((m: any) => m.id === selectedCharacterIdRef.current)
        if (!selected || selected.status === 'failed' || selected.status === 'deleted') {
          try { localStorage.removeItem('character-selection') } catch {}
          setSelectedCharacterId(null)
        }
      }
      // Fetch batched data for current list
      try { await fetchBatchedCharacterData(list.map((m:any)=>m.id).filter(Boolean)) } catch {}

      // stamp last refresh
      try { lastCharactersRefreshRef.current = Date.now() } catch {}
    } catch { setCharacters([]) }
    finally { isRefreshingRef.current = false }
  }, [authUser?.id, getUserCharacters, fetchBatchedCharacterData])

  // Ensure characters are fetched once auth is ready (fixes empty chip after hard refresh)
  React.useEffect(() => {
    if (!authUser?.id) return
    const isNeverFetched = !lastCharactersRefreshRef.current
    const isStale = (Date.now() - (lastCharactersRefreshRef.current || 0)) > CHARACTER_LIST_TTL_MS
    if ((isNeverFetched || isStale) && !isRefreshingRef.current) {
      try { refreshCharacters() } catch {}
    }
  }, [authUser?.id, refreshCharacters])

  // If a selected character exists but its thumbnail isn't loaded yet, refresh in background
  React.useEffect(() => {
    if (!selectedCharacterId) return
    if (characterThumbs[selectedCharacterId]) return
    if (isRefreshingRef.current) return
    try { refreshCharacters() } catch {}
  }, [selectedCharacterId, characterThumbs, refreshCharacters])

  // Realtime updates for active jobs and uploaded image counts (single channel)
  React.useEffect(() => {
    if (!authUser?.id) return

    let supabase: any
    let channel: any

    ;(async () => {
      try {
        const mod = await import('@/lib/supabase/client')
        supabase = mod.createClient()

        const ACTIVE_STATUSES = ['initializing', 'queued', 'pending', 'running']

        channel = supabase
          .channel(`genbar-realtime-${authUser.id}`)
          // Training jobs updates for this user
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'training_jobs',
            filter: `user_id=eq.${authUser.id}`,
          }, (payload: any) => {
            const row = (payload.new || payload.old) as any
            if (!row?.character_id) return
            const charId = row.character_id as string
            const status = String(row.status || '')

            setActiveJobs(prev => {
              const current = prev[charId] || null
              // If job is active, keep the latest by created_at
              if (ACTIVE_STATUSES.includes(status)) {
                if (!current) return { ...prev, [charId]: row }
                const next = (new Date(row.created_at).getTime() >= new Date((current as any).created_at).getTime()) ? row : current
                if (next !== current) return { ...prev, [charId]: next as any }
                return prev
              }
              // If job finished and it matches current, clear it
              if (current && (current as any).id === row.id) {
                const copy = { ...prev }
                copy[charId] = null
                return copy
              }
              return prev
            })
          })
          // Uploaded images changes for this user → adjust counts
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'uploaded_images',
            filter: `user_id=eq.${authUser.id}`,
          }, (payload: any) => {
            const isInsert = payload.eventType === 'INSERT'
            const isDelete = payload.eventType === 'DELETE'
            const row = (isDelete ? payload.old : payload.new) as any
            const charId = row?.character_id as (string | undefined)
            if (!charId) return
            setUploadedCounts(prev => {
              const current = prev[charId] || 0
              const next = isInsert ? current + 1 : (isDelete ? Math.max(0, current - 1) : current)
              if (next === current) return prev
              return { ...prev, [charId]: next }
            })
          })
          .subscribe()
      } catch {}
    })()

    return () => {
      try { if (supabase && channel) supabase.removeChannel(channel) } catch {}
    }
  }, [authUser?.id])

  const onSelectCharacter = (modelId: string, gender?: string, metaGender?: string) => {
    try { localStorage.setItem('character-selection', JSON.stringify({ modelId })) } catch {}
    setSelectedCharacterId(modelId)
    // Apply gender immediately based on selected character metadata
    try {
      const raw = gender ?? metaGender ?? (characters.find((c: any) => c.id === modelId)?.gender ?? (characters.find((c: any) => c.id === modelId)?.metadata?.gender))
      const mapped = mapGenderToWardrobe(raw)
      if (mapped && mapped !== selectedGender) {
        setSelectedGender(mapped)
        save(STORAGE_KEYS.WARDROBE_GENDER, mapped)
      }
    } catch {}
    clearError('character')
    close()
  }

  // Character creation hook
  const { createCharacterAction, handleCreateCharacterClick, requiresCreditsForTraining, trainingCost, remainingIncludedTrainings, isOnHighestTier } = useCreateCharacter({
    characters,
    onSelectCharacter,
    refreshCharacters
  })

  // Selected-character active job/progress for the small selector thumbnail
  const selectedJob: ActiveTrainingJob | null = selectedCharacterId ? (activeJobs[selectedCharacterId] || null) : null
  // Always call hook; provide empty jobId when no job to keep order stable
  const selectedTraining = useTrainingProgress({
    jobId: selectedJob?.id || '',
    onComplete: (success) => {
      if (!success && selectedCharacterId) {
        try { localStorage.removeItem('character-selection') } catch {}
        setSelectedCharacterId(null)
        toast({
          title: t('character.trainingFailedTitle', { ns: 'styles', defaultValue: 'Training failed' }),
          description: t('character.trainingFailedDesc', { ns: 'styles', defaultValue: 'This character cannot be used for generation. Please delete it and try again.' }),
          variant: 'destructive'
        })
      }
    }
  })
  const selectedWsStatus = (selectedTraining as any)?.progress?.status as string | undefined
  // Prefer WS status when available to decide if overlay should be visible immediately on completion
  const selectedHasActiveJob = selectedWsStatus
    ? (selectedWsStatus !== 'completed' && selectedWsStatus !== 'failed')
    : (!!selectedJob && (
        selectedJob.status === 'running' ||
        selectedJob.status === 'pending' ||
        selectedJob.status === 'queued' ||
        selectedJob.status === 'initializing'
      ))
  const selectedPct = selectedHasActiveJob ? (selectedTraining.getProgressPercentage?.() ?? 0) : 0

  // When the selected character's training fails, immediately clear selection and show a persistent error toast
  useEffect(() => {
    if (selectedWsStatus === 'failed' && selectedCharacterId && !hasClearedFailedSelectionRef.current) {
      hasClearedFailedSelectionRef.current = true
      try { localStorage.removeItem('character-selection') } catch {}
      setSelectedCharacterId(null)
      toast({
        title: t('character.trainingFailedTitle', { ns: 'styles', defaultValue: 'Training failed' }),
        description: t('character.trainingFailedDesc', { ns: 'styles', defaultValue: 'This character cannot be used for generation. Please delete it and try again.' }),
        variant: 'destructive'
      })
    }
  }, [selectedWsStatus, selectedCharacterId, toast, t])

  // Handle Character button click: always open the panel (credit checks happen on create action)
  const handleButtonClick = useCallback(() => {
    // Open immediately for better responsiveness; refresh in background if stale
    open('characters')
    const isStale = (Date.now() - (lastCharactersRefreshRef.current || 0)) > CHARACTER_LIST_TTL_MS
    if (isStale && !isRefreshingRef.current) {
      try { refreshCharacters() } catch {}
    }
  }, [refreshCharacters]);

  // Carousel + search state shared by panels
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [panelQuery, setPanelQuery] = useState('')
  const [navState, setNavState] = useState({ canPrev: false, canNext: false })
  
  // Utility function to scroll to selected item in carousel
  const scrollToSelectedItem = useCallback((panel: PanelKey) => {
    
    if (!viewportRef.current) {
      console.log('viewportRef.current is null')
      return
    }
    
    const viewport = viewportRef.current
    const itemsContainer = viewport.firstElementChild as HTMLElement
    if (!itemsContainer) return

    // Hide all items initially by removing the loaded class
    const allButtons = Array.from(itemsContainer.children) as HTMLElement[]
    allButtons.forEach(button => {
      button.classList.add(styles.itemCardLoaded)
    })

    let selectedIndex = -1
    let itemWidth = 0

    if (panel === 'styles') {
      // Find the selected style directly in the DOM using the data-value attribute
      const selectedStyle = stylesWithPreview[selectedStyleIndex]
      if (selectedStyle) {
        const selectedButton = itemsContainer.querySelector(`[data-value="${selectedStyle.id}"]`) as HTMLElement
        if (selectedButton) {
          // Count how many buttons come before this one
          selectedIndex = allButtons.indexOf(selectedButton)
        }
      }
      
      const firstItem = itemsContainer.firstElementChild as HTMLElement
      if (firstItem) {
        itemWidth = firstItem.offsetWidth
        const computedStyle = window.getComputedStyle(firstItem)
        const marginRight = parseInt(computedStyle.marginRight) || 0
        itemWidth += marginRight
      }
    } else if (panel === 'scenes' && currentStyle) {
      const selections = getStoredStyleSelections(currentStyle.id)
      if (selections.scene) {
        // Find the selected item directly in the DOM using the data-value attribute
        const selectedButton = itemsContainer.querySelector(`[data-value="${selections.scene}"]`) as HTMLElement
        if (selectedButton) {
          // Count how many buttons come before this one
          selectedIndex = allButtons.indexOf(selectedButton)
        }
      }
      
      const firstItem = itemsContainer.firstElementChild as HTMLElement
      if (firstItem) {
        itemWidth = firstItem.offsetWidth
        const computedStyle = window.getComputedStyle(firstItem)
        const marginRight = parseInt(computedStyle.marginRight) || 0
        itemWidth += marginRight
      }
    } else if (panel === 'wardrobe' && currentStyle && !selectedWardrobeValue) {
      const selections = getStoredStyleSelections(currentStyle.id)
      if (selections.wardrobe) {
        // Instead of trying to replicate the complex filtering logic,
        // find the selected item directly in the DOM using the data-value attribute
        const selectedButton = itemsContainer.querySelector(`[data-value="${selections.wardrobe}"]`) as HTMLElement
        if (selectedButton) {
          // Count how many buttons come before this one
          selectedIndex = allButtons.indexOf(selectedButton)
        }
      }
      
      const firstItem = itemsContainer.firstElementChild as HTMLElement
      if (firstItem) {
        itemWidth = firstItem.offsetWidth
        const computedStyle = window.getComputedStyle(firstItem)
        const marginRight = parseInt(computedStyle.marginRight) || 0
        itemWidth += marginRight
      }
    }

      if (selectedIndex >= 0 && itemWidth > 0) {
        // Position the selected item as the first visible item (leftmost position)
        const scrollPosition = selectedIndex * itemWidth
        const maxScroll = Math.max(0, itemsContainer.scrollWidth - viewport.clientWidth)
        const targetScroll = Math.min(scrollPosition, maxScroll)
        
        // Temporarily disable smooth scrolling to make it instant
        const originalScrollBehavior = viewport.style.scrollBehavior
        viewport.style.scrollBehavior = 'auto'
        
        viewport.scrollTo({
          left: targetScroll
        })
        
        // Restore original scroll behavior
        viewport.style.scrollBehavior = originalScrollBehavior
      }

    // Fade in all items after scroll position is set
    setTimeout(() => {
      allButtons.forEach(button => {
        button.classList.add(styles.itemCardLoaded)
      })
    }, 50)
  }, [selectedStyleIndex, currentStyle, scenes, wardrobes, selectedGender, selectedWardrobeValue, stylesWithPreview, panelQuery])

  const updateNavButtons = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const contentWidth = (el.firstElementChild as HTMLElement)?.scrollWidth || el.scrollWidth
    const maxScrollLeft = Math.max(0, contentWidth - el.clientWidth)
    // Use small epsilon to avoid floating rounding
    const EPS = 1
    setNavState({
      canPrev: el.scrollLeft > EPS,
      canNext: maxScrollLeft > EPS && el.scrollLeft < (maxScrollLeft - EPS),
    })
  }, [])
  useEffect(() => {
    updateNavButtons()
    // Defer once more to ensure tab/panel transitions completed
    const t0 = setTimeout(updateNavButtons, 0)
    const raf = requestAnimationFrame(updateNavButtons)
    const t = setTimeout(updateNavButtons, 350)
    const el = viewportRef.current
    let ro: ResizeObserver | undefined
    if (el && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => updateNavButtons())
      ro.observe(el)
      if (el.firstElementChild instanceof HTMLElement) ro.observe(el.firstElementChild)
    }
    const onResize = () => updateNavButtons()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); clearTimeout(t); clearTimeout(t0); window.removeEventListener('resize', onResize); ro?.disconnect() }
  }, [openPanel, stylesWithPreview, scenes, wardrobes, colors, panelQuery, updateNavButtons])
  const handlePrev = useCallback(() => {
    const el = viewportRef.current; if (!el) return
    const current = el.scrollLeft
    const target = Math.max(0, current - el.clientWidth)
    // Fallback for browsers/environments that ignore smooth behavior
    try { el.scrollTo({ left: target, behavior: 'smooth' }) } catch { el.scrollLeft = target }
    setTimeout(updateNavButtons, 360)
  }, [updateNavButtons])
  const handleNext = useCallback(() => {
    const el = viewportRef.current; if (!el) return
    const rowWidth = (el.firstElementChild as HTMLElement)?.scrollWidth || el.scrollWidth
    const maxScrollLeft = Math.max(0, rowWidth - el.clientWidth)
    const current = el.scrollLeft
    const target = Math.min(maxScrollLeft, current + el.clientWidth)
    try { el.scrollTo({ left: target, behavior: 'smooth' }) } catch { el.scrollLeft = target }
    setTimeout(updateNavButtons, 360)
  }, [updateNavButtons])

  // Colors compact mode: switch to carousel with fixed 50px swatches when
  // the flexible width would drop below 50px
  const colorsContainerRef = React.useRef<HTMLDivElement>(null)
  const [isColorsCompact, setIsColorsCompact] = useState(false)
  const setColorsViewportRefs = React.useCallback((el: HTMLDivElement | null) => {
    // Share the same viewport element with the generic carousel logic
    viewportRef.current = el as any
    colorsContainerRef.current = el as any
  }, [])

  // Precompute available colors for current style (count used for threshold calc)
  const colorsForCurrentStyle = useMemo(() => {
    const available = (currentStyle?.available_colors || []) as string[]
    const filtered = colors.filter(c => available.includes(c.value))
    return sortColorsByPalette(filtered)
  }, [colors, currentStyle?.available_colors])

  const updateColorsCompact = React.useCallback(() => {
    const el = colorsContainerRef.current
    if (!el) return
    const count = colorsForCurrentStyle.length
    if (!count) { setIsColorsCompact(false); return }
    const GAP = 1 // matches CSS gap
    const containerWidth = el.clientWidth
    const candidate = (containerWidth - Math.max(0, count - 1) * GAP) / count
    setIsColorsCompact(candidate <= 50)
  }, [colorsForCurrentStyle.length])

  // Effect to scroll to selected item when wardrobe panel switches back from color selection
  useEffect(() => {
    if (openPanel === 'wardrobe' && !selectedWardrobeValue && currentStyle) {
      // When going back from color selection to wardrobe selection, scroll to selected item
      setTimeout(() => scrollToSelectedItem('wardrobe'), 300)
    }
  }, [selectedWardrobeValue, openPanel, currentStyle, scrollToSelectedItem])

  React.useEffect(() => {
    // Observe only when wardrobe panel is open and a wardrobe is selected (colors shown)
    if (openPanel !== 'wardrobe') return
    if (!selectedWardrobeValue) return
    const el = colorsContainerRef.current
    if (!el) return
    updateColorsCompact()
    // Defer once to ensure layout is complete
    const raf = requestAnimationFrame(() => updateColorsCompact())
    let ro: ResizeObserver | undefined
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => updateColorsCompact())
      ro.observe(el)
    }
    const onResize = () => updateColorsCompact()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', onResize) }
  }, [openPanel, selectedWardrobeValue, updateColorsCompact, isColorsCompact])

  const renderPanel = () => {
    if (!openPanel) return null
    // Shared carousel/search state
    const [/*local*/] = []
    switch (openPanel) {
      case 'styles':
        return (
          <OptionsPanel title={t('titles.photoStyle', { ns: 'styles' })} onClose={close} onSearchChange={setPanelQuery} searchValue={panelQuery} canPrev={navState.canPrev} canNext={navState.canNext} onPrev={handlePrev} onNext={handleNext}>
            <div ref={viewportRef} className={styles.carouselViewport} onScroll={updateNavButtons}>
              <div className={styles.itemsRow} style={{ width: 'max-content' }}>
              {stylesWithPreview.filter(s => !panelQuery || s.name.toLowerCase().includes(panelQuery.toLowerCase())).map((s, idx) => (
                <button key={s.id} data-value={s.id} className={`${styles.itemCard} ${idx === selectedStyleIndex ? styles.itemSelected : ''}`} onClick={() => onSelectStyle(idx)}>
                  {s.preview_images?.[0] && (
                    <Image loader={stylesLoader} src={s.preview_images[0]} alt={s.name} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel} title={s.name}>{s.name}</div>
                </button>
              ))}
              </div>
            </div>
          </OptionsPanel>
        )
      case 'scenes': {
        const available = (currentStyle?.available_scenes || [])
        const availableLower = available.map(v => v.toLowerCase())
        const items = scenes.filter(s => availableLower.includes(s.value.toLowerCase())).filter(s => !panelQuery || s.label.toLowerCase().includes(panelQuery.toLowerCase()))
        return (
          <OptionsPanel title={t('titles.sceneLabel', { ns: 'styles' })} onClose={close} onSearchChange={setPanelQuery} searchValue={panelQuery} canPrev={navState.canPrev} canNext={navState.canNext} onPrev={handlePrev} onNext={handleNext}>
            <div ref={viewportRef} className={styles.carouselViewport} onScroll={updateNavButtons}>
              <div className={styles.itemsRow} style={{ width: 'max-content' }}>
              {items.map(opt => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                const isSelected = sel?.toLowerCase() === opt.value.toLowerCase()
                return (
                <button key={opt.value} data-value={opt.value} className={`${styles.itemCard} ${isSelected ? styles.itemSelected : ''}`} onClick={() => { storeStyleSelections(currentStyle.id, { scene: opt.value }); setSelectionVersion(v=>v+1); clearError('scene'); close() }}>
                  {opt.image && (
                    <Image loader={scenesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel} title={opt.label}>{opt.label}</div>
                </button>)
              })}
              </div>
            </div>
          </OptionsPanel>
        )
      }
      case 'wardrobe': {
        const availableWardrobes = (currentStyle?.available_wardrobes || [])
        const availableColors = (currentStyle?.available_colors || [])
        const availableWardrobesLower = availableWardrobes.map(v => v.toLowerCase())
        // Base filtered list by availability, search, and gender
        const baseWardrobes = wardrobes
          .filter(w => availableWardrobesLower.includes(w.value.toLowerCase()))
          .filter(w => !panelQuery || w.label.toLowerCase().includes(panelQuery.toLowerCase()))
          .filter(w => {
            const raw = (w as any).gender as (string | undefined)
            const gender = raw ? String(raw).toLowerCase() as ('man'|'woman'|'unisex') : undefined
            if (!gender || gender === 'unisex') return true
            return gender === selectedGender
          })

        // Group by normalized category (trimmed, case-insensitive key)
        const normalizeCat = (c: any) => String(c || 'Other').trim()
        const byCategory = new Map<string, typeof baseWardrobes>()
        for (const w of baseWardrobes) {
          const key = normalizeCat((w as any).category)
          const list = byCategory.get(key) || []
          list.push(w)
          byCategory.set(key, list)
        }

        // Determine category order for this style (normalize to match)
        const rawOrder = Array.isArray((currentStyle as any)?.wardrobe_category_order)
          ? ((currentStyle as any).wardrobe_category_order as string[])
          : []
        const normalizedOrder = [...new Set(rawOrder.map(normalizeCat))]
        const existingCats = Array.from(byCategory.keys())
        const remainingCats = existingCats
          .filter(c => !normalizedOrder.includes(c))
          .sort((a,b)=>a.localeCompare(b))
        const orderedCategories = [...normalizedOrder.filter(c => byCategory.has(c)), ...remainingCats]

        // Per-category item desired order, with case-insensitive category key matching
        const perCategoryOrder = ((currentStyle as any)?.wardrobe_order || {}) as Record<string, string[]>
        const getDesiredOrderForCat = (catKey: string): string[] => {
          // Find key in object whose normalized form matches
          for (const k of Object.keys(perCategoryOrder)) {
            if (normalizeCat(k) === catKey) return Array.isArray(perCategoryOrder[k]) ? perCategoryOrder[k] : []
          }
          return []
        }

        const orderedWardrobes: typeof baseWardrobes = []
        for (const cat of orderedCategories) {
          const items = byCategory.get(cat) || []
          const desiredOrder = getDesiredOrderForCat(cat)
          const indexOf = (v: string) => {
            const idx = desiredOrder.indexOf(v)
            return idx === -1 ? Number.POSITIVE_INFINITY : idx
          }
          const listed = items
            .slice()
            .sort((a, b) => {
              const ia = indexOf(a.value)
              const ib = indexOf(b.value)
              if (ia !== ib) return ia - ib
              // Fallback alphabetical by label when both not listed or same index
              return a.label.localeCompare(b.label)
            })
          orderedWardrobes.push(...listed)
        }

        const filteredWardrobes = orderedWardrobes
        const availableColorsLower = availableColors.map(v => v.toLowerCase())
        const filteredColors = sortColorsByPalette(colors.filter(c => availableColorsLower.includes(c.value.toLowerCase())))
        const showingColors = !!selectedWardrobeValue

        return (
            <OptionsPanel
            title={t('titles.wardrobeLabel', { ns: 'styles' })}
            onClose={close}
            onSearchChange={showingColors ? undefined : setPanelQuery}
            showSearch={!showingColors}
            searchValue={panelQuery}
            canPrev={(showingColors ? (isColorsCompact && navState.canPrev) : navState.canPrev)}
            canNext={(showingColors ? (isColorsCompact && navState.canNext) : navState.canNext)}
            onPrev={(showingColors ? (isColorsCompact ? handlePrev : undefined) : handlePrev)}
            onNext={(showingColors ? (isColorsCompact ? handleNext : undefined) : handleNext)}
            leftHeader={(
              showingColors ? (
                <button className={styles.backBtn} onClick={() => setSelectedWardrobeValue(null)} aria-label="Back">
                  {t('buttons.back', { ns: 'common' })}
                </button>
              ) : (
                <SegmentedControl
                  className={styles.segmentedGender}
                  options={[
                    { value: 'woman', content: t('labels.woman', { ns: 'generate' }) },
                    { value: 'man', content: t('labels.man', { ns: 'generate' }) }
                  ]}
                  value={selectedGender}
                  onChange={(val) => {
                    const v = String(val) as 'man' | 'woman'
                    if (selectedGender === v) return
                    setIsSwitchingGender(true)
                    
                    // Reset all cards to initial state (including unisex ones)
                    const viewport = viewportRef.current
                    if (viewport) {
                      const itemsContainer = viewport.firstElementChild as HTMLElement
                      if (itemsContainer) {
                        const allButtons = Array.from(itemsContainer.children) as HTMLElement[]
                        allButtons.forEach((button) => {
                          button.classList.remove(styles.itemCardLoaded)
                          // Remove any existing transition delays
                          button.style.transitionDelay = ''
                        })
                      }
                    }
                    
                    setTimeout(() => {
                      setSelectedGender(v)
                      save(STORAGE_KEYS.WARDROBE_GENDER, v)
                      
                      // Add 100ms delay then animate all cards back in without staggered timing
                      setTimeout(() => {
                        if (viewport) {
                          const itemsContainer = viewport.firstElementChild as HTMLElement
                          if (itemsContainer) {
                            const allButtons = Array.from(itemsContainer.children) as HTMLElement[]
                            allButtons.forEach((button) => {
                              // Remove any transition delays for consistent animation
                              button.style.transitionDelay = ''
                              button.classList.add(styles.itemCardLoaded)
                            })
                          }
                        }
                        setIsSwitchingGender(false)
                      }, 100)
                    }, 120)
                  }}
                  size="sm"
                />
              )
            )}
          >
            {!showingColors ? (
              <div ref={viewportRef} className={`${styles.carouselViewport} ${styles.fadeSwitch} ${isSwitchingGender ? styles.fadeSwitchHidden : ''}`} onScroll={updateNavButtons}>
                <div className={styles.itemsRow} style={{ width: 'max-content' }}>
                {filteredWardrobes.map(opt => {
                  const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).wardrobe : null
                  const isSelected = sel?.toLowerCase() === opt.value.toLowerCase()
                  return (
                  <button key={opt.value} data-value={opt.value} className={`${styles.itemCard} ${isSelected ? styles.itemSelected : ''}`} onClick={() => {
                    setSelectedWardrobeValue(opt.value)
                    const g = (opt as any).gender as ('man'|'woman'|'unisex'|undefined)
                    if (g === 'man' || g === 'woman') { if (g !== selectedGender) setSelectedGender(g); save(STORAGE_KEYS.WARDROBE_GENDER, g) }
                    clearError('wardrobe')
                  }}>
                    {opt.image && (
                      <Image loader={wardrobesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                    )}
                    <div className={styles.itemLabel} title={opt.label}>{opt.label}</div>
                  </button>)
                })}
                </div>
              </div>
            ) : (
              <>
                {!isColorsCompact ? (
                  <div ref={colorsContainerRef} className={styles.colorsRow}>
                    {filteredColors.map(col => (
                      <button key={col.value} className={styles.colorSwatch} style={{ backgroundColor: col.color || '#fff' }} onClick={() => {
                        storeStyleSelections(currentStyle.id, { wardrobe: selectedWardrobeValue!, color: col.value });
                        setSelectionVersion(v=>v+1);
                        clearError('color');
                        close()
                      }} title={col.label} value={col.value} data-light-bg={isLightColor(col.color || '#fff')} />
                    ))}
                  </div>
                ) : (
                  <div ref={setColorsViewportRefs} className={styles.carouselViewport} onScroll={updateNavButtons}>
                    <div className={styles.colorItemsRow} style={{ width: 'max-content' }}>
                      {filteredColors.map(col => (
                        <button key={col.value} className={`${styles.colorSwatch} ${styles.colorSwatchFixed}`} style={{ backgroundColor: col.color || '#fff' }} onClick={() => {
                          storeStyleSelections(currentStyle.id, { wardrobe: selectedWardrobeValue!, color: col.value });
                          setSelectionVersion(v=>v+1);
                          clearError('color');
                          close()
                        }} title={col.label} value={col.value} data-light-bg={isLightColor(col.color || '#fff')} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </OptionsPanel>
        )
      }
      case 'characters': {
        return (
          <OptionsPanel title={t('titles.characterLabel', { ns: 'styles' })} onClose={close} onSearchChange={setPanelQuery} searchValue={panelQuery} canPrev={navState.canPrev} canNext={navState.canNext} onPrev={handlePrev} onNext={handleNext}>
            <div ref={viewportRef} className={styles.carouselViewport} onScroll={updateNavButtons}>
              <div className={styles.itemsRow} style={{ width: 'max-content' }}>
              <button className={`${styles.itemCard} ${styles.createCard}`} onClick={handleCreateCharacterClick} disabled={createCharacterAction.type === 'limit_reached' && !authUser?.admin}>
                <Icon className={styles.createIcon} variant="plus" size={32} />
                <div className={styles.itemLabel}>
                  {createCharacterAction.type === 'upgrade_subscription' && t('labels.upgradePlanAddMore', { ns: 'styles' })}
                  {createCharacterAction.type === 'credit_pack' && t('labels.buyCredits', { ns: 'styles' })}
                  {createCharacterAction.type === 'upgrade_or_credit_pack' && t('labels.upgradeOrBuyCredits', { ns: 'styles' })}
                  {createCharacterAction.type === 'limit_reached' && !authUser?.admin && t('labels.limitReached', { ns: 'styles' })}
                  {(createCharacterAction.type === 'create' || (createCharacterAction.type === 'limit_reached' && authUser?.admin)) && t('buttons.create', { ns: 'generate' })}
                  {createCharacterAction.type === 'subscription' && t('buttons.create', { ns: 'generate' })}
                  {createCharacterAction.type === 'auth' && t('buttons.create', { ns: 'generate' })}
                </div>
                {createCharacterAction.type === 'auth' && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.requiresActiveSubscription', { ns: 'generate' })}
                  </div>
                )}
                {createCharacterAction.type === 'subscription' && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.requiresActiveSubscription', { ns: 'generate' })}
                  </div>
                )}
                {createCharacterAction.type === 'create' && remainingIncludedTrainings > 0 && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.includedInPlan', { ns: 'styles', count: remainingIncludedTrainings })}
                  </div>
                )}
                {createCharacterAction.type === 'create' && remainingIncludedTrainings === 0 && requiresCreditsForTraining && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.credits', { ns: 'styles', count: trainingCost })}
                  </div>
                )}
                {createCharacterAction.type === 'credit_pack' && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.credits', { ns: 'styles', count: createCharacterAction.credits || trainingCost })}
                  </div>
                )}
                {createCharacterAction.type === 'upgrade_subscription' && (
                  <div className={styles.itemSubLabel}>
                    {t('labels.limitReached', { ns: 'styles' })}
                  </div>
                )}
              </button>
              {characters
                .filter(m => m.status !== 'deleted')
                .filter(m => !panelQuery || (m.name || '').toLowerCase().includes(panelQuery.toLowerCase()))
                .map((m) => (
                <CharacterCard
                  key={m.id}
                  character={m}
                  thumbUrl={characterThumbs[m.id]}
                  uploadedCount={uploadedCounts[m.id] || 0}
                  job={activeJobs[m.id] || null}
                  selectedId={selectedCharacterId || ''}
                  onSelect={() => onSelectCharacter(m.id, (m as any)?.gender, (m as any)?.metadata?.gender)}
                  onDeleted={(id) => {
                    // Optimistically remove from UI
                    setCharacters(prev => prev.filter(c => c.id !== id))
                    setCharacterThumbs(prev => { const copy = { ...prev }; delete (copy as any)[id]; return copy })
                    // Also trigger a refresh to keep in sync with server
                    refreshCharacters()
                  }}
                />
              ))}
              </div>
            </div>
          </OptionsPanel>
        )
      }
      case 'settings': {
        const gated = (res: QualityCode) => {
          if (!hasActiveSubscription) return false
          const order = (inferenceSettings?.qualities || []) as string[]
          if (order.length === 0) return false
          const idx = order.indexOf(String(res))
          const maxQ = (subscription as any)?.max_quality || order[0]
          const maxIdx = order.indexOf(String(maxQ))
          if (idx === -1 || maxIdx === -1) return false
          return idx > maxIdx
        }
        return (
          <OptionsPanel className={styles.settingsPanel} title={t('titles.settingsLabel', { ns: 'styles' })} onClose={close} showDone showSearch={false} leftHeader={(
            <p className={styles.settingsTitle}>{t('titles.settingsLabel', { ns: 'styles' })}</p>
          )}>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>{t('settings.numberOfTakes', { ns: 'styles' })}</span>
              <SegmentedControl
                options={(inferenceSettings?.nb_takes_options || []).map(n => ({ value: n, content: n }))}
                value={nbTakes}
                onChange={(n) => { const v = Number(n); setNbTakes(v); save(STORAGE_KEYS.NB_TAKES, v) }}
                fullWidth
              />
            </div>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>{t('settings.quality', { ns: 'styles' })}</span>
              <SegmentedControl
                options={qualityOptions.map(opt => ({ value: opt.value, content: opt.display, disabled: gated(opt.value) }))}
                value={quality}
                onChange={(v) => {
                  const allowed = (inferenceSettings?.qualities || []) as string[]
                  const q = sanitizeQuality(v, allowed.length ? allowed : [String(v)])
                  setQuality(q)
                  save(STORAGE_KEYS.QUALITY, q)
                }}
                fullWidth
              />
            </div>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>{t('settings.aspectRatio', { ns: 'styles' })} <span className={styles.currentLabel}>{currentAspectLabel}</span></span>
              <SegmentedControl
                options={(inferenceSettings?.aspect_ratios || []).map(r => ({ value: r, content: <Icon variant={getAspectIcon(String(r))} size={16} /> }))}
                value={aspectRatio || (inferenceSettings?.defaults?.aspect_ratio as string) || ((inferenceSettings?.aspect_ratios?.[0] as string) || '')}
                onChange={(r) => { const v = String(r); setAspectRatio(v); save(STORAGE_KEYS.ASPECT_RATIO, v) }}
                fullWidth
              />
            </div>
          </OptionsPanel>
        )
      }
    }
  }

  const [panelHeight, setPanelHeight] = useState<number>(0)
  const panelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (openPanel && panelRef.current) {
      const h = panelRef.current.scrollHeight /* breathing padding */
      setPanelHeight(h)
    }
  }, [openPanel])

  // Sticky behavior: stick below header when bar reaches top
  const barRef = React.useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const header = document.querySelector('header') as HTMLElement | null
    const container = document.querySelector('[data-styles-container]') as HTMLElement | null
    const getHeaderHeight = () => (header?.offsetHeight || 56)
    const setHeaderVar = () => {
      const h = getHeaderHeight()
      document.documentElement.style.setProperty('--header-height', `${h}px`)
    }
    const onScroll = () => {
      const el = barRef.current
      if (!el) return
      const elRect = el.getBoundingClientRect()
      let nextSticky = isSticky
      let slidePx = 0

      // Unstick when styles container shows 6px at bottom
      if (container) {
        const rect = container.getBoundingClientRect()
        const threshold = 6
        const expr = (rect.y + rect.height - elRect.height - getHeaderHeight() - threshold)
        if (expr >= threshold) {
          nextSticky = false
        } else {
          nextSticky = true
          // How far into the sticky region we are, in px (0..headerHeight)
          const delta = threshold - expr
          slidePx = Math.min(Math.max(0, delta), getHeaderHeight())
        }
      }
      setIsSticky(nextSticky)
      // Drive header slide via CSS variable (negative to move up)
      document.documentElement.style.setProperty('--header-slide', nextSticky ? `-${slidePx}px` : '0px')
    }
    setHeaderVar()
    onScroll()
    window.addEventListener('resize', setHeaderVar)
    window.addEventListener('scroll', onScroll as any, { passive: true } as any)
    return () => {
      window.removeEventListener('resize', setHeaderVar)
      window.removeEventListener('scroll', onScroll as any)
      // Reset header slide on cleanup
      try { document.documentElement.style.setProperty('--header-slide', '0px') } catch {}
    }
  }, [])

  // Determine CSS classes for loading states
  const barClasses = [
    styles.bar,
    isSticky ? styles.barSticky : '',
    openPanel ? styles.panelOpen : '',
    isDataLoading ? styles.barLoading : styles.barReady,
    !isDataLoading && authReady ? styles.barFadeIn : ''
  ].filter(Boolean).join(' ')

  return (
    <div ref={barRef} className={barClasses} style={openPanel ? ({ ['--panel-height' as any]: `${panelHeight}px` }) : undefined}>
      <div className={`${styles.content} ${openPanel ? styles.contentHidden : ''}`}>
        <div className={styles.leftContent}>
            {/* Style */}
            <GenerateBarSelect
                onClick={() => open('styles')}
                ariaLabel={t('aria.selectStyle', { ns: 'generate' })}
                variant="labeled"
                thumbnail={currentStyle?.preview_images?.[0] ? (
                <Image loader={stylesLoader} src={currentStyle.preview_images[0]} alt={currentStyle?.name || 'style'} width={32} height={32} className={styles.thumbImg} />
                ) : (
                <Icon variant="scene" size={24} />
                )}
                label={currentStyle?.name || t('titles.styleLabel', { ns: 'styles' })}
            />

            {/* Scene */}
            <GenerateBarSelect
                onClick={() => open('scenes')}
                ariaLabel={t('aria.selectScene', { ns: 'generate' })}
                variant="labeled"
                className={`${errors.scene ? styles.selectorError : ''} ${!selectedLabels.scene ? styles.selectorEmpty : ''}`}
                thumbnail={(() => {
                  const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                  const scene = scenes.find(s => s.value.toLowerCase() === sel?.toLowerCase())
                
                  if (scene?.image) return <Image loader={scenesLoader} src={scene.image} alt={scene.label} width={32} height={32} className={styles.thumbImg} />
                    return <Icon variant="scene" size={20} />
                  })()}
                label={selectedLabels.scene || t('labels.scene', { ns: 'generate' })}
            />

            {/* Wardrobe */}
            <GenerateBarSelect
                onClick={() => open('wardrobe')}
                ariaLabel={t('aria.selectWardrobe', { ns: 'generate' })}
                variant="labeled"
                className={`${errors.wardrobe ? styles.selectorError : ''} ${!selectedLabels.wardrobe ? styles.selectorEmpty : ''}`}
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                const wrb = wardrobes.find(w => w.value.toLowerCase() === (sel?.wardrobe?.toLowerCase() || ''))
                if (wrb?.image) {
                    return (
                    <Image loader={wardrobesLoader} src={wrb.image} alt={wrb.label} width={32} height={32} className={styles.thumbImg} />
                    )
                }
                return <Icon variant="wardrobe" size={20} />
                })()}
                overlay={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                if (!sel?.color) return null
                return (
                    <span className={styles.colorSelected} style={{ background: colors.find(c=>c.value.toLowerCase()===sel.color?.toLowerCase())?.color || '#fff' }} />
                )
                })()}
                label={selectedLabels.wardrobe || t('labels.wardrobe', { ns: 'generate' })}
            />
        </div>

        <div className={styles.rightContent}>
            {/* Character */}
            <GenerateBarSelect
                onClick={handleButtonClick}
                ariaLabel={t('aria.selectCharacter', { ns: 'generate' })}
                variant="no-label"
                className={errors.character ? styles.selectorError : ''}
                thumbnail={(() => {
                const url = selectedCharacterId ? characterThumbs[selectedCharacterId] : ''
                  if (url) return <Image src={url} alt="Character" width={44} height={44} className={styles.thumbImg} unoptimized />
                return <span className={styles.characterIcon}><Image src={(process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg` : '/app-images/assets/logo-primeshot.svg')} alt="Primeshot" width={32} height={32} /></span>
                })()}
                overlay={(
                <>
                    {selectedHasActiveJob && (
                    <span className={styles.tinyProgress} aria-label={t('aria.trainingProgress', { ns: 'generate' })}>
                        <CircleProgress className={styles.circleProgress} value={selectedPct} size={44} thickness={2} />
                    </span>
                    )}
                </>
                )}
            />

            {/* Settings */}
            <div className={styles.settingsContainer}>
              <GenerateBarSelect
                  onClick={() => open('settings')}
                  ariaLabel={t('aria.openSettings', { ns: 'generate' })}
                  variant="icon"
                  thumbnail={<Icon variant="settings" size={16} />}
              />

              <div className={styles.credits}>{requiredCredits} {t('labels.creditsSuffix', { ns: 'generate' })}</div>
              <Button
                  variant="primary"
                  className={styles.generate}
                  icon={<Icon variant="generate" size={16} />}
                  iconSide='right'
                  onClick={() => guard(onGenerate)()}
              >
                {t('buttons.generate', { ns: 'generate' })}
              </Button>
            </div>
        </div>
    </div>

      {/* Panel slot (restored) */}
      <div ref={panelRef} className={styles.panelSlot}>
        {renderPanel()}
      </div>

      {authUser?.admin && (
        <AdminInferenceOptionsDialog
          open={showAdminInfer}
          characterId={selectedCharacterId || ''}
          styleId={currentStyle?.id || ''}
          wardrobeId={(currentStyle ? getStoredStyleSelections(currentStyle.id).wardrobe : null) || undefined}
          sceneId={(currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null) || undefined}
          colorId={(currentStyle ? getStoredStyleSelections(currentStyle.id).color : null) || undefined}
          onCancel={() => setShowAdminInfer(false)}
          onConfirm={async (override) => {
            setAdminOverride(override)
            setShowAdminInfer(false)
            await runGenerate(override)
          }}
        />
      )}
    </div>
  )
}

// Separate child to allow per-item hooks
function CharacterCard({ character, thumbUrl, uploadedCount = 0, job, onSelect, onDeleted, selectedId }: { character: any; thumbUrl?: string; uploadedCount?: number; job: ActiveTrainingJob | null; onSelect: () => void; onDeleted?: (id: string) => void; selectedId?: string }) {
  const { t } = useTranslation(['styles'])
  let waitingLabel = ''
  const isActive = !!job
  const { deleteCharacter } = useCharactersApi()
  const { user } = useAuth()
  const [showOverlay, setShowOverlay] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Always call hook; provide empty jobId when not active to keep order stable
  const training = useTrainingProgress({ jobId: job?.id || '' })

  // Prefer WebSocket-reported status over DB status if available
  const wsStatus = (training as any)?.progress?.status as (string | undefined)
  const effectiveStatus = (wsStatus || job?.status || '') as string

  // Pending display delay to avoid brief flashes during cold starts
  const [pendingSince, setPendingSince] = React.useState<number | null>(null)
  React.useEffect(() => {
    const status = wsStatus ?? job?.status
    if (status === 'pending') {
      if (pendingSince === null) setPendingSince(Date.now())
    } else if (pendingSince !== null) {
      setPendingSince(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus, job?.status])

  const PENDING_DISPLAY_DELAY_MS = Number(process.env.NEXT_PUBLIC_PENDING_DISPLAY_DELAY_MS ?? 15000)
  const isPending = effectiveStatus === 'pending'
  const shouldShowPending = isPending && (pendingSince !== null && Date.now() - pendingSince >= PENDING_DISPLAY_DELAY_MS)

  const isRunning = effectiveStatus === 'running'
  const isWaiting = effectiveStatus === 'initializing' || effectiveStatus === 'queued' || effectiveStatus === 'pending'

  if (isWaiting) {
    waitingLabel = effectiveStatus === 'queued'
      ? t('character.trainingQueued', { ns: 'styles' })
      : (shouldShowPending
        ? t('character.trainingPending', { ns: 'styles' })
        : t('character.trainingInitializing', { ns: 'styles' }))
  }

  const progressPct = isRunning ? training.getProgressPercentage?.() ?? 0 : 0
  const secondsLeft = isRunning ? training.getLiveCountdownSeconds?.() ?? 0 : 0

  const isSelected = selectedId === character.id
  const isFailed = character.status === 'failed'

  return (
    <button
      className={`${styles.itemCard} ${styles.characterCard} ${(isRunning ? styles.itemActive : '')} ${isSelected ? styles.itemSelected : ''} ${isFailed ? styles.itemFailed : ''}`}
      data-gender={(character as any)?.gender || (character as any)?.metadata?.gender || ''}
      onClick={() => {
        // Do not allow selecting failed characters
        if (isFailed) return
        onSelect()
      }}
    >
      <div className={styles.itemThumb}>
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={character.name}
            width={350}
            height={350}
            className={`${styles.itemThumb} ${isActive ? styles.thumbBlur : ''}`}
            unoptimized
          />
        ) : (
          <div className={styles.thumb}>#{character.name?.[0] || 'C'}</div>
        )}

        {isRunning && (
          <CircleProgress className={styles.progressBadge} aria-label={t('aria.trainingProgress', { ns: 'generate' })} value={progressPct} size={32} thickness={2} />
        )}
        {/* Hover menu trigger -> overlay */}
        <div className={styles.cardMenuWrap} onClick={(e) => { e.stopPropagation(); setShowOverlay(true) }}>
          <span aria-label={t('aria.characterActions', { ns: 'generate' })} className={styles.cardMenuBtn}>
            <Icon variant="dotsMenu" size={20} />
          </span>
        </div>
      </div>
      <div className={styles.itemLabel} title={character.name}>{character.name}</div>
      <div className={styles.itemSubLabel}>
        {isFailed ? (
          t('character.trainingFailedTitle', { ns: 'styles' })
        ) : isRunning ? (
          <>
            ~<Countdown seconds={secondsLeft} fallback={t('labels.calculating', { ns: 'generate' })} /> {t('character.remaining', { ns: 'styles' })}
          </>
        ) : isWaiting ? (
          waitingLabel
        ) : (
          <>
            {uploadedCount} {t('character.photos', { ns: 'styles' })}
          </>
        )}
      </div>
      {(showOverlay || isFailed) && (
          <div className={styles.cardOverlay} onClick={(e) => { e.stopPropagation(); /* keep panel open while overlay visible */ }}>
            <div
              className={styles.overlayClose}
              role="button"
              aria-label={t('aria.closeOverlay', { ns: 'generate' })}
              onClick={(e) => { e.stopPropagation(); setShowOverlay(false) }}
            >
              <Icon variant="cross" size={16} />
            </div>
            {isDeleting ? (
              <Loader size="lg" className={styles.overlayLoader} />
            ) : (
              <div
                role="button"
                tabIndex={0}
                className={styles.overlayBtn + ' ' + styles.deleteBtn}
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const ok = await confirmationService.confirm({
                      title: t('character.deleteTitle', { ns: 'styles', defaultValue: 'Delete character?' }),
                      description: t('character.deleteDesc', { ns: 'styles', defaultValue: 'This will permanently remove the character and uploaded photos.' }),
                      confirmText: t('character.deleteConfirm', { ns: 'styles', defaultValue: 'Delete' }),
                      variant: 'destructive',
                      icon: 'bin'
                    })
                    if (!ok) return
                    setIsDeleting(true)
                    await deleteCharacter(character.id, user?.id || '')
                    // Let parent remove this card immediately
                    onDeleted?.(character.id)
                  } catch (err) {
                    console.error('Delete failed', err)
                    setIsDeleting(false)
                  }
                }}
              >
                <Icon variant="bin" size={18} />
                <span>{t('character.delete', { ns: 'styles', defaultValue: 'Delete' })}</span>
              </div>
            )}
          </div>
        )}
    </button>
  )
}


