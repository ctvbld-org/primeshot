"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
// Embla type import replaced with any to avoid cross-package type issues
import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { useTranslation } from 'react-i18next'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useScenes, useWardrobes, useColors } from '@/hooks/useConfig'

import { getStyleImages } from '@/lib/utils/get-styles-images'
// For options we will use a custom CloudFront loader that selects the nearest variant
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { storeSelectedStyleIndex, getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
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
import { useActiveTrainingJob } from '@/hooks/useActiveTrainingJob'
import { useTrainingProgress, useInferenceProgress } from '@/hooks/useJobProgress'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { Countdown } from '@/components/character/Countdown'
import { useInferenceQueue } from '@/contexts/inference-queue-context'
import { useCallback as useCallbackReact, useRef } from 'react'
import { useCharacterImages } from '@/lib/hooks/use-character-images'

import { OptionsPanel } from '../OptionsPanel/OptionsPanel'
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
  const { t } = useTranslation(['styles', 'common'])
  const scenesLoader = makeCloudfrontLoader('app-images/placeholders/options/scenes')
  const wardrobesLoader = makeCloudfrontLoader('app-images/placeholders/options/wardrobes')
  const stylesLoader = makeCloudfrontLoader('app-images/placeholders/styles')
  const { selectedStyleIndex, setSelectedStyleIndex, stylesData } = useStyleSelection()
  
  // Auth state for conditional data loading
  const { isAuthenticated, user: authUser } = useAuth()
  const authReady = isAuthenticated !== undefined // Auth state has been resolved
  
  // Only load option data once auth is ready
  const { data: scenes = [] } = useScenes()
  const { data: wardrobes = [] } = useWardrobes()
  const { data: colors = [] } = useColors()

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
    const sceneLabel = scenes.find(sc => sc.value === sel.scene)?.label || ''
    const wardrobeLabel = wardrobes.find(w => w.value === sel.wardrobe)?.label || ''
    const colorLabel = colors.find(c => c.value === sel.color)?.label || ''
    return { scene: sceneLabel, wardrobe: wardrobeLabel, color: colorLabel }
  }, [currentStyle?.id, scenes, wardrobes, colors, selectedStyleIndex, selectionVersion])

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
    // When opening wardrobe, auto-switch gender to match stored wardrobe selection
    if (panel === 'wardrobe') {
      try {
        const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
        const wardVal = sel?.wardrobe || null
        if (wardVal) {
          const w = wardrobes.find(w => w.value === wardVal) as any
          const g = (w?.gender as ('man'|'woman'|'unisex'|undefined))
          if (g === 'man' || g === 'woman') {
            if (g !== selectedGender) setSelectedGender(g)
            save(STORAGE_KEYS.WARDROBE_GENDER, g)
          }
        }
      } catch {}
    }
    // Check sticky state after panel opens
    setTimeout(checkSticky, 300)
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
      // Segmented display (e.g., 1K, 2K, 4K)
      display: t(`qualitiesValue.${code}` as any, { ns: 'styles', defaultValue: String(code).toUpperCase() })
    }))
  }, [inferenceSettings?.qualities, inferenceSettings?.quality_labels, t])

  const currentQualityLabel = useMemo(() => {
    const labels = (inferenceSettings?.quality_labels || {}) as Record<string, string>
    const key = String(quality)
    return t(`qualities.${key}` as any, { ns: 'styles', defaultValue: labels[key] || key })
  }, [inferenceSettings?.quality_labels, quality, t])

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
  const { getUserCharacters } = useCharactersApi()
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
          
          console.log(`📋 Updated job ${realJobId} status to: ${responseStatus}`)
        }
      }
    } catch (e) {
      console.error('Generate error', e)
      
      // Error handling for failed job creation
      // Thumbnail error states will be handled by the job queue component
      
      // Show user-friendly error message
      // TODO: Integrate with toast/notification system
      console.error('Failed to start generation. Please try again.');
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

  const refreshCharacters = React.useCallback(async () => {
    if (!authUser?.id) { setCharacters([]); return }
    try {
      const list = await getUserCharacters(authUser.id)
      setCharacters(list)
      const entries = await Promise.all(
        list
          .filter((m: any) => !!m.thumbnail_url)
          .map(async (m: any) => {
            try {
              const res = await fetch(getApiUrl(`/api/user-images?url=${encodeURIComponent(m.thumbnail_url)}`))
              if (!res.ok) return [m.id, ''] as const
              const { url } = await res.json()
              return [m.id, url] as const
            } catch { return [m.id, ''] as const }
          })
      )
      const map: Record<string,string> = {}
      for (const [id, url] of entries) map[id] = url
      setCharacterThumbs(map)

      // If the currently selected character is failed/deleted/missing, clear selection (no toast on page load)
      if (selectedCharacterId) {
        const selected = list.find((m: any) => m.id === selectedCharacterId)
        if (!selected || selected.status === 'failed' || selected.status === 'deleted') {
          try { localStorage.removeItem('character-selection') } catch {}
          setSelectedCharacterId(null)
        }
      }
    } catch { setCharacters([]) }
  }, [authUser?.id, getUserCharacters, selectedCharacterId])

  React.useEffect(() => { refreshCharacters() }, [refreshCharacters])

  const onSelectCharacter = (modelId: string) => {
    try { localStorage.setItem('character-selection', JSON.stringify({ modelId })) } catch {}
    setSelectedCharacterId(modelId)
    close()
  }

  // Character creation hook
  const { createCharacterAction, handleCreateCharacterClick, requiresCreditsForTraining, trainingCost, remainingIncludedTrainings, isOnHighestTier } = useCreateCharacter({
    characters,
    onSelectCharacter,
    refreshCharacters
  })

  // Selected-character active job/progress for the small selector thumbnail
  const { job: selectedJob } = useActiveTrainingJob(selectedCharacterId)
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
    // Ensure the character list reflects latest state before opening panel
    try { refreshCharacters() } catch {}
    open('characters')
  }, [refreshCharacters]);

  // Carousel + search state shared by panels
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [panelQuery, setPanelQuery] = useState('')
  const [navState, setNavState] = useState({ canPrev: false, canNext: false })
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
                <button key={s.id} className={`${styles.itemCard} ${idx === selectedStyleIndex ? styles.itemSelected : ''}`} onClick={() => onSelectStyle(idx)}>
                  {s.preview_images?.[0] && (
                    <Image loader={stylesLoader} src={s.preview_images[0]} alt={s.name} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel}>{s.name}</div>
                </button>
              ))}
              </div>
            </div>
          </OptionsPanel>
        )
      case 'scenes': {
        const available = (currentStyle?.available_scenes || [])
        const items = scenes.filter(s => available.includes(s.value)).filter(s => !panelQuery || s.label.toLowerCase().includes(panelQuery.toLowerCase()))
        return (
          <OptionsPanel title={t('titles.sceneLabel', { ns: 'styles' })} onClose={close} onSearchChange={setPanelQuery} searchValue={panelQuery} canPrev={navState.canPrev} canNext={navState.canNext} onPrev={handlePrev} onNext={handleNext}>
            <div ref={viewportRef} className={styles.carouselViewport} onScroll={updateNavButtons}>
              <div className={styles.itemsRow} style={{ width: 'max-content' }}>
              {items.map(opt => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                const isSelected = sel === opt.value
                return (
                <button key={opt.value} className={`${styles.itemCard} ${isSelected ? styles.itemSelected : ''}`} onClick={() => { storeStyleSelections(currentStyle.id, { scene: opt.value }); setSelectionVersion(v=>v+1); close() }}>
                  {opt.image && (
                    <Image loader={scenesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel}>{opt.label}</div>
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
        const filteredWardrobes = wardrobes.filter(w => availableWardrobes.includes(w.value)).filter(w => !panelQuery || w.label.toLowerCase().includes(panelQuery.toLowerCase()))
          .filter(w => {
            const gender = (w as any).gender as ('man'|'woman'|'unisex'|undefined)
            if (!gender || gender === 'unisex') return true
            return gender === selectedGender
          })
        const filteredColors = colors.filter(c => availableColors.includes(c.value))
        const showingColors = !!selectedWardrobeValue

        return (
          <OptionsPanel
            title={t('titles.wardrobeLabel', { ns: 'styles' })}
            onClose={close}
            onSearchChange={showingColors ? undefined : setPanelQuery}
            showSearch={!showingColors}
            searchValue={panelQuery}
            canPrev={!showingColors && navState.canPrev}
            canNext={!showingColors && navState.canNext}
            onPrev={!showingColors ? handlePrev : undefined}
            onNext={!showingColors ? handleNext : undefined}
            leftHeader={(
              showingColors ? (
                <button className={styles.backBtn} onClick={() => setSelectedWardrobeValue(null)} aria-label="Back">
                  {t('buttons.back', { ns: 'common' })}
                </button>
              ) : (
                <SegmentedControl
                  className={styles.segmentedGender}
                  options={[
                    { value: 'woman', content: 'Woman' },
                    { value: 'man', content: 'Man' }
                  ]}
                  value={selectedGender}
                  onChange={(val) => {
                    const v = String(val) as 'man' | 'woman'
                    if (selectedGender === v) return
                    setIsSwitchingGender(true)
                    setTimeout(() => {
                      setSelectedGender(v)
                      save(STORAGE_KEYS.WARDROBE_GENDER, v)
                      setTimeout(() => setIsSwitchingGender(false), 40)
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
                  const isSelected = sel === opt.value
                  return (
                  <button key={opt.value} className={`${styles.itemCard} ${isSelected ? styles.itemSelected : ''}`} onClick={() => {
                    setSelectedWardrobeValue(opt.value)
                    const g = (opt as any).gender as ('man'|'woman'|'unisex'|undefined)
                    if (g === 'man' || g === 'woman') { if (g !== selectedGender) setSelectedGender(g); save(STORAGE_KEYS.WARDROBE_GENDER, g) }
                  }}>
                    {opt.image && (
                      <Image loader={wardrobesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                    )}
                    <div className={styles.itemLabel}>{opt.label}</div>
                  </button>)
                })}
                </div>
              </div>
            ) : (
              <div className={styles.colorsRow}>
                {filteredColors.map(col => (
                  <button key={col.value} className={styles.colorSwatch} style={{ backgroundColor: col.color || '#fff' }} onClick={() => {
                    storeStyleSelections(currentStyle.id, { wardrobe: selectedWardrobeValue!, color: col.value });
                    setSelectionVersion(v=>v+1);
                    close()
                  }} title={col.label} value={col.value} />
                ))}
              </div>
            )}
          </OptionsPanel>
        )
      }
      case 'characters': {
        return (
          <OptionsPanel title={t('titles.characterLabel', { ns: 'styles' })} onClose={close} onSearchChange={setPanelQuery} searchValue={panelQuery} canPrev={navState.canPrev} canNext={navState.canNext} onPrev={handlePrev} onNext={handleNext}>
            <div ref={viewportRef} className={styles.carouselViewport} onScroll={updateNavButtons}>
              <div className={styles.itemsRow} style={{ width: 'max-content' }}>
              <button className={`${styles.itemCard} ${styles.createCard}`} onClick={handleCreateCharacterClick} disabled={createCharacterAction.type === 'limit_reached'}>
                <Icon className={styles.createIcon} variant="plus" size={32} />
                <div className={styles.itemLabel}>
                  {createCharacterAction.type === 'upgrade_subscription' && t('labels.upgradePlanAddMore', { ns: 'styles' })}
                  {createCharacterAction.type === 'credit_pack' && t('labels.upgradeOrBuyCredits', { ns: 'styles' })}
                  {createCharacterAction.type === 'limit_reached' && t('labels.limitReached', { ns: 'styles' })}
                  {createCharacterAction.type === 'create' && 'Create'}
                  {createCharacterAction.type === 'subscription' && 'Create'}
                </div>
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
                  selectedId={selectedCharacterId || ''}
                  onSelect={() => onSelectCharacter(m.id)}
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
              <span className={styles.settingLabel}>{t('settings.quality', { ns: 'styles' })} <span className={styles.currentLabel}>{currentQualityLabel}</span></span>
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

      // Unstick when styles container shows 6px at bottom
      if (container) {
        const rect = container.getBoundingClientRect()

        if ((rect.y + rect.height - elRect.height - getHeaderHeight() - 6) >= 6) {
          nextSticky = false
        } else {
          nextSticky = true
        }
      }
      setIsSticky(nextSticky)
    }
    setHeaderVar()
    onScroll()
    window.addEventListener('resize', setHeaderVar)
    window.addEventListener('scroll', onScroll as any, { passive: true } as any)
    return () => {
      window.removeEventListener('resize', setHeaderVar)
      window.removeEventListener('scroll', onScroll as any)
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
                ariaLabel="Select style"
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
                ariaLabel="Select scene"
                variant="labeled"
                className={`${errors.scene ? styles.selectorError : ''} ${!selectedLabels.scene ? styles.selectorEmpty : ''}`}
                thumbnail={(() => {
                  const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                  const scene = scenes.find(s => s.value === sel)
                
                  if (scene?.image) return <Image loader={scenesLoader} src={scene.image} alt={scene.label} width={32} height={32} className={styles.thumbImg} />
                    return <Icon variant="scene" size={20} />
                  })()}
                label={selectedLabels.scene || 'Scene'}
            />

            {/* Wardrobe */}
            <GenerateBarSelect
                onClick={() => open('wardrobe')}
                ariaLabel="Select wardrobe"
                variant="labeled"
                className={`${errors.wardrobe ? styles.selectorError : ''} ${!selectedLabels.wardrobe ? styles.selectorEmpty : ''}`}
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                const wrb = wardrobes.find(w => w.value === (sel?.wardrobe || ''))
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
                    <span className={styles.colorSelected} style={{ background: colors.find(c=>c.value===sel.color)?.color || '#fff' }} />
                )
                })()}
                label={selectedLabels.wardrobe || 'Wardrobe'}
            />
        </div>

        <div className={styles.rightContent}>
            {/* Character */}
            <GenerateBarSelect
                onClick={handleButtonClick}
                ariaLabel="Select character"
                variant="no-label"
                className={errors.character ? styles.selectorError : ''}
                thumbnail={(() => {
                const url = selectedCharacterId ? characterThumbs[selectedCharacterId] : ''
                if (url) return <Image src={url} alt="Character" width={44} height={44} className={styles.thumbImg} />
                return <span className={styles.characterIcon}><Image src={(process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg` : '/app-images/assets/logo-primeshot.svg')} alt="Primeshot" width={32} height={32} /></span>
                })()}
                overlay={(
                <>
                    {selectedHasActiveJob && (
                    <span className={styles.tinyProgress} aria-label="Training progress">
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
                  ariaLabel="Open settings"
                  variant="icon"
                  thumbnail={<Icon variant="settings" size={16} />}
              />

              <div className={styles.credits}>{requiredCredits} credits</div>
              <Button
                  variant="primary"
                  className={styles.generate}
                  icon={<Icon variant="generate" size={16} />}
                  iconSide='right'
                  onClick={() => guard(onGenerate)()}
              >
                Generate
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
function CharacterCard({ character, thumbUrl, onSelect, onDeleted, selectedId }: { character: any; thumbUrl?: string; onSelect: () => void; onDeleted?: (id: string) => void; selectedId?: string }) {
  const { t } = useTranslation(['styles'])
  let waitingLabel = ''
  const { job } = useActiveTrainingJob(character.id)
  const isActive = !!job
  const { images } = useCharacterImages(character.id)
  const uploadedCount = images?.length || 0
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
          />
        ) : (
          <div className={styles.thumb}>#{character.name?.[0] || 'C'}</div>
        )}

        {isRunning && (
          <CircleProgress className={styles.progressBadge} aria-label="Training progress" value={progressPct} size={32} thickness={2} />
        )}
        {/* Hover menu trigger -> overlay */}
        <div className={styles.cardMenuWrap} onClick={(e) => { e.stopPropagation(); setShowOverlay(true) }}>
          <span aria-label="Character actions" className={styles.cardMenuBtn}>
            <Icon variant="dotsMenu" size={20} />
          </span>
        </div>
      </div>
      <div className={styles.itemLabel}>{character.name}</div>
      <div className={styles.itemSubLabel}>
        {isFailed ? (
          'Training failed'
        ) : isRunning ? (
          <>
            ~<Countdown seconds={secondsLeft} fallback="Calculating" /> {t('character.remaining', { ns: 'styles' })}
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
              aria-label="Close overlay"
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
                      variant: 'danger',
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


