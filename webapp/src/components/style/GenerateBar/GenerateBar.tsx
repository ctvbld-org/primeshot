"use client"

import React, { useCallback, useMemo, useState } from 'react'
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
import { useInferenceSettings } from '@/hooks/useInferenceSettings'
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

import { OptionsPanel } from '../OptionsPanel/OptionsPanel'
import { GenerateBarSelect } from './GenerateBarSelect'
import { useCreateCharacter } from './useCreateCharacter'
import { Button } from '@primeshot/common/web/ui/button'

type PanelKey = 'styles' | 'scenes' | 'wardrobe' | 'characters' | 'settings' | null

interface GenerateBarProps { emblaApi: any | null; onPanelToggle?: (open: boolean) => void }

export function GenerateBar({ emblaApi, onPanelToggle }: GenerateBarProps) {
  const { t } = useTranslation(['styles', 'settings'])
  const scenesLoader = makeCloudfrontLoader('app-images/placeholders/options/scenes')
  const wardrobesLoader = makeCloudfrontLoader('app-images/placeholders/options/wardrobes')
  const { selectedStyleIndex, setSelectedStyleIndex, stylesData } = useStyleSelection()
  const { data: scenes = [] } = useScenes()
  const { data: wardrobes = [] } = useWardrobes()
  const { data: colors = [] } = useColors()

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  // Wardrobe panel local UI state
  const [selectedWardrobeValue, setSelectedWardrobeValue] = useState<string | null>(null)
  const [selectedGender, setSelectedGender] = useState<'man' | 'woman'>('woman')
  const [selectionVersion, setSelectionVersion] = useState(0)

  // Validation error state for required selectors
  const [errors, setErrors] = useState<{ character?: boolean; scene?: boolean; wardrobe?: boolean; color?: boolean }>({})

  // Settings state stored in localStorage-compatible keys
  const STORAGE_KEYS = {
    NB_TAKES: 'generation-controls-nb-takes',
    ASPECT_RATIO: 'generation-controls-aspect-ratio',
    QUALITY: 'generation-controls-quality'
  }

  const load = (k: string, def: any) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def }
  }
  const save = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }

  type QualityCode = string
  const sanitizeQuality = (q: any, allowed: string[]): QualityCode =>
    (allowed.includes(String(q)) ? String(q) : (allowed[0] ?? String(q) ?? ''))

  const { data: inferenceSettings } = useInferenceSettings()
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

  const { data: subscription } = useCurrentSubscription()
  const { data: creditCosts } = useCreditCosts()
  const { hasActiveSubscription } = useSubscriptionStatus()
  const requiredCredits = useMemo(() => {
    const allowed = (inferenceSettings?.qualities || []) as string[]
    const effectiveQuality = quality || (inferenceSettings?.defaults?.quality as string) || allowed[0] || ''
    const takes = typeof nbTakes === 'number' && nbTakes > 0
      ? nbTakes
      : (inferenceSettings?.defaults?.nb_takes as number) || 1
    return calculateImageCredits(effectiveQuality, takes, creditCosts) || 0
  }, [nbTakes, quality, creditCosts, inferenceSettings?.defaults?.quality, inferenceSettings?.defaults?.nb_takes, inferenceSettings?.qualities])
  const guard = useCreditGuard(requiredCredits)

  // Jobs API (moved to top-level to avoid creating a new instance in handler)
  const { startInference } = useJobsApi()

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

  const open = (panel: PanelKey) => { setOpenPanel(panel); onPanelToggle?.(true) }
  const close = () => { setOpenPanel(null); setSelectedWardrobeValue(null); onPanelToggle?.(false) }

  const onSelectStyle = useCallback((index: number) => {
    if (!stylesWithPreview[index]) return
    setSelectedStyleIndex(index)
    storeSelectedStyleIndex(index)
    emblaApi?.scrollTo(index)
    close()
  }, [emblaApi, setSelectedStyleIndex, stylesWithPreview])

  

  const qualityOptions = useMemo(() => {
    const codes = (inferenceSettings?.qualities || []) as QualityCode[]
    return codes.map(code => ({ label: code, value: code as QualityCode }))
  }, [inferenceSettings])

  const currentQualityLabel = useMemo(() => {
    const labels = inferenceSettings?.quality_labels || {}
    return (labels as any)[quality] || quality
  }, [inferenceSettings?.quality_labels, quality])

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
  const { user } = useAuth()
  const { getUserCharacters } = useCharactersApi()
  const [characters, setCharacters] = React.useState<any[]>([])
  const [characterThumbs, setCharacterThumbs] = React.useState<Record<string, string>>({})
  const { runWithGates } = useActionGate(requiredCredits, 'inference')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inferenceJobId, setInferenceJobId] = useState('')
  const inference = useInferenceProgress({ jobId: inferenceJobId })
  const inferencePct = inferenceJobId ? (inference.getProgressPercentage?.() ?? 0) : 0

  const onGenerate = useCallback(async () => {
    try {
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

      if (Object.keys(missing).length > 0 || !defaultsLoaded || !user?.id || !currentStyle) {
        setErrors(missing)
        if (!defaultsLoaded) console.warn('Inference settings defaults not loaded yet')
        if (!user?.id) console.warn('User not authenticated')
        if (!currentStyle) console.warn('No style selected')
        return
      }

      setIsSubmitting(true)

      const scene_id = sel?.scene || ''
      const wardrobe_id = sel?.wardrobe || ''
      const color_id = sel?.color || ''
      const character_id = selectedCharacterId || ''

      const effectiveQuality = (quality || (inferenceSettings?.defaults?.quality as string)) as string
      const effectiveTakes = (nbTakes || (inferenceSettings?.defaults?.nb_takes as number)) as number
      const effectiveAspect = (aspectRatio || (inferenceSettings?.defaults?.aspect_ratio as string)) as string

      // Effective settings are guaranteed by defaultsLoaded check above

      const payload = {
        user_id: user.id,
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

      const data = (await runWithGates(async () => {
        return await startInference(payload as any)
      })) as any
      const jobId = (data as any)?.job_id
      if (jobId) setInferenceJobId(jobId)
    } catch (e) {
      console.error('Generate error', e)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, user?.id, currentStyle?.id, selectedCharacterId, nbTakes, quality, aspectRatio, inferenceSettings, runWithGates])

  const refreshCharacters = React.useCallback(async () => {
    if (!user?.id) { setCharacters([]); return }
    try {
      const list = await getUserCharacters(user.id)
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
    } catch { setCharacters([]) }
  }, [user?.id, getUserCharacters])

  React.useEffect(() => { refreshCharacters() }, [refreshCharacters])

  const onSelectCharacter = (modelId: string) => {
    try { localStorage.setItem('character-selection', JSON.stringify({ modelId })) } catch {}
    setSelectedCharacterId(modelId)
    close()
  }

  // Character creation hook
  const { createCharacterAction, handleCreateCharacterClick } = useCreateCharacter({
    characters,
    onSelectCharacter,
    refreshCharacters
  })

  // Selected-character active job/progress for the small selector thumbnail
  const { job: selectedJob } = useActiveTrainingJob(selectedCharacterId)
  const selectedIsRunning = selectedJob?.status === 'running'
  const selectedIsWaiting = !!selectedJob && (selectedJob.status === 'initializing' || selectedJob.status === 'queued' || selectedJob.status === 'pending')
  // Always call hooks in the same order; pass empty jobId when not running
  const selectedTraining = useTrainingProgress({ jobId: selectedJob?.id || '' })
  const selectedPct = selectedIsRunning ? selectedTraining.getProgressPercentage?.() ?? 0 : 0

  // Handle button click - either open popover or trigger guard function
  const handleButtonClick = useCallback(() => {
    guard(() => {
      open('characters') 
    })();
  }, [guard]);

  const renderPanel = () => {
    if (!openPanel) return null
    switch (openPanel) {
      case 'styles':
        return (
          <OptionsPanel title={t('titles.styleLabel', { ns: 'styles' })} onClose={close}>
            <div className={styles.itemsRow}>
              {stylesWithPreview.map((s, idx) => (
                <button key={s.id} className={`${styles.itemCard} ${idx === selectedStyleIndex ? styles.itemSelected : ''}`} onClick={() => onSelectStyle(idx)}>
                  {s.preview && (
                    <Image src={s.preview} alt={s.name} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel}>{s.name}</div>
                </button>
              ))}
            </div>
          </OptionsPanel>
        )
      case 'scenes': {
        const available = (currentStyle?.available_scenes || [])
        const items = scenes.filter(s => available.includes(s.value))
        return (
          <OptionsPanel title={'Scene'} onClose={close}>
            <div className={styles.itemsRow}>
              {items.map(opt => (
                <button key={opt.value} className={styles.itemCard} onClick={() => { storeStyleSelections(currentStyle.id, { scene: opt.value }); setSelectionVersion(v=>v+1); close() }}>
                  {opt.image && (
                    <Image loader={scenesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                  )}
                  <div className={styles.itemLabel}>{opt.label}</div>
                </button>
              ))}
            </div>
          </OptionsPanel>
        )
      }
      case 'wardrobe': {
        const availableWardrobes = (currentStyle?.available_wardrobes || [])
        const availableColors = (currentStyle?.available_colors || [])
        const filteredWardrobes = wardrobes.filter(w => availableWardrobes.includes(w.value))
          .filter(w => {
            const gender = (w as any).gender as ('man'|'woman'|'unisex'|undefined)
            if (!gender || gender === 'unisex') return true
            return gender === selectedGender
          })
        const filteredColors = colors.filter(c => availableColors.includes(c.value))

        return (
          <OptionsPanel title={'Wardrobe'} onClose={close}>
            {!selectedWardrobeValue ? (
              <>
                <div className={styles.segmented}>
                  <button className={`${styles.segment} ${'man' === selectedGender ? styles.segmentActive : ''}`} onClick={() => setSelectedGender('man')}>Man</button>
                  <button className={`${styles.segment} ${'woman' === selectedGender ? styles.segmentActive : ''}`} onClick={() => setSelectedGender('woman')}>Woman</button>
                </div>
                <div className={styles.itemsRow}>
                  {filteredWardrobes.map(opt => (
                    <button key={opt.value} className={styles.itemCard} onClick={() => setSelectedWardrobeValue(opt.value)}>
                      {opt.image && (
                        <Image loader={wardrobesLoader} src={opt.image} alt={opt.label} width={80} height={80} className={styles.itemThumb} />
                      )}
                      <div className={styles.itemLabel}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.colorsRow}>
                {filteredColors.map(col => (
                  <button key={col.value} className={styles.colorSwatch} style={{ backgroundColor: col.color || '#fff' }} onClick={() => {
                    storeStyleSelections(currentStyle.id, { wardrobe: selectedWardrobeValue!, color: col.value });
                    setSelectionVersion(v=>v+1);
                    close()
                  }} title={col.label} />
                ))}
              </div>
            )}
          </OptionsPanel>
        )
      }
      case 'characters': {
        return (
          <OptionsPanel title={'Character'} onClose={close}>
            <div className={styles.itemsRow}>
              <button className={`${styles.itemCard} ${styles.createCard}`} onClick={handleCreateCharacterClick} disabled={createCharacterAction.type === 'limit_reached'}>
                <Icon variant="plusFill" size={24} />
                <div className={styles.itemLabel}>{createCharacterAction.message}</div>
              </button>
              {characters.map((m) => (
                <CharacterCard
                  key={m.id}
                  character={m}
                  thumbUrl={characterThumbs[m.id]}
                  onSelect={() => onSelectCharacter(m.id)}
                />
              ))}
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
          <OptionsPanel className={styles.settingsPanel} title={'Settings'} onClose={close} showDone>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>Number of Takes</span>
              <div className={styles.segmented}>
                {(inferenceSettings?.nb_takes_options || []).map(n => (
                  <button key={n} className={`${styles.segment} ${nbTakes === n ? styles.segmentActive : ''}`} onClick={() => { setNbTakes(n); save(STORAGE_KEYS.NB_TAKES, n) }}>{n}</button>
                ))}
              </div>
            </div>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>Quality {currentQualityLabel}</span>
              <div className={styles.segmented}>
                {qualityOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.segment} ${quality === opt.value ? styles.segmentActive : ''} ${gated(opt.value) ? styles.segmentDisabled : ''}`}
                    disabled={gated(opt.value)}
                    onClick={() => {
                      const allowed = (inferenceSettings?.qualities || []) as string[]
                      const q = sanitizeQuality(opt.value, allowed.length ? allowed : [String(opt.value)])
                      setQuality(q)
                      save(STORAGE_KEYS.QUALITY, q)
                    }}
                  >
                     {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>Aspect Ratio</span>
              <div className={styles.segmented}>
                {(inferenceSettings?.aspect_ratios || []).map(r => (
                  <button key={r} className={`${styles.segment} ${aspectRatio === r ? styles.segmentActive : ''}`} onClick={() => { setAspectRatio(r); save(STORAGE_KEYS.ASPECT_RATIO, r) }}>{r}</button>
                ))}
              </div>
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
      const h = panelRef.current.scrollHeight + 16 /* breathing padding */
      setPanelHeight(h)
    }
  }, [openPanel])

  return (
    <div className={`${styles.bar} ${openPanel ? styles.panelOpen : ''}`} style={openPanel ? ({ ['--panel-height' as any]: `${panelHeight}px` }) : undefined}>
      <div className={`${styles.content} ${openPanel ? styles.contentHidden : ''}`}>
        <div className={styles.leftContent}>
            {/* Style */}
            <GenerateBarSelect
                onClick={() => open('styles')}
                ariaLabel="Select style"
                variant="labeled"
                thumbnail={currentStyle?.preview ? (
                <Image src={currentStyle.preview} alt={currentStyle?.name || 'style'} width={32} height={32} className={styles.thumbImg} />
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
                className={errors.scene ? styles.selectorError : ''}
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                const scene = scenes.find(s => s.value === sel)
                if (scene?.image) return <Image loader={scenesLoader} src={scene.image} alt={scene.label} width={32} height={32} className={styles.thumbImg} />
                return <Icon variant="scene" size={24} />
                })()}
                label={selectedLabels.scene || 'Scene'}
            />

            {/* Wardrobe */}
            <GenerateBarSelect
                onClick={() => open('wardrobe')}
                ariaLabel="Select wardrobe"
                variant="labeled"
                className={errors.wardrobe ? styles.selectorError : ''}
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                const wrb = wardrobes.find(w => w.value === (sel?.wardrobe || ''))
                if (wrb?.image) {
                    return (
                    <Image loader={wardrobesLoader} src={wrb.image} alt={wrb.label} width={32} height={32} className={styles.thumbImg} />
                    )
                }
                return <Icon variant="wardrobe" size={24} />
                })()}
                overlay={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                if (!sel?.color) return null
                return (
                    <span style={{ position: 'absolute', right: 2, bottom: 2, width: 8, height: 8, borderRadius: 9999, background: colors.find(c=>c.value===sel.color)?.color || '#fff', border: '1px solid rgba(0,0,0,0.4)' }} />
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
                variant="icon"
                className={errors.character ? styles.selectorError : ''}
                thumbnail={(() => {
                const url = selectedCharacterId ? characterThumbs[selectedCharacterId] : ''
                if (url) return <Image src={url} alt="Character" width={32} height={32} className={styles.thumbImg} />
                return <Icon variant="smilyFace" size={24} />
                })()}
                overlay={(
                <>
                    {selectedIsRunning && (
                    <span className={styles.tinyProgress} aria-label="Training progress">
                        <CircleProgress value={selectedPct} size={32} thickness={2} />
                    </span>
                    )}
                    {selectedIsWaiting && <span className={styles.tinyTrainingDot} />}
                </>
                )}
            />

            {/* Settings */}
            <GenerateBarSelect
                onClick={() => open('settings')}
                ariaLabel="Open settings"
                variant="icon"
                thumbnail={<Icon variant="idea" size={24} />}
            />

            <div className={styles.credits}>{requiredCredits} credits</div>
            <Button
                variant="primary"
                className={styles.generate}
                disabled={isSubmitting}
                onClick={() => guard(onGenerate)()}
            >
              {isSubmitting && inferenceJobId ? `Generating ${Math.round(inferencePct)}%` : (isSubmitting ? 'Generating…' : 'Generate')}
            </Button>
        </div>
    </div>

      {/* Panel slot */}
      <div ref={panelRef} className={styles.panelSlot}>
        {renderPanel()}
      </div>
    </div>
  )
}

// Separate child to allow per-item hooks
function CharacterCard({ character, thumbUrl, onSelect }: { character: any; thumbUrl?: string; onSelect: () => void }) {
  const { job } = useActiveTrainingJob(character.id)
  const isActive = !!job
  const isRunning = job?.status === 'running'
  const isWaiting = job && (job.status === 'initializing' || job.status === 'queued' || job.status === 'pending')

  // Always call hook; provide empty jobId when not active to keep order stable
  const training = useTrainingProgress({ jobId: job?.id || '' })

  const progressPct = isRunning ? training.getProgressPercentage?.() ?? 0 : 0
  const secondsLeft = isRunning ? training.getLiveCountdownSeconds?.() ?? 0 : 0

  return (
    <button className={styles.itemCard} onClick={onSelect}>
      <div className={styles.itemThumb} style={{ width: 80, height: 80 }}>
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={character.name}
            width={80}
            height={80}
            className={`${styles.itemThumb} ${isActive ? styles.thumbBlur : ''}`}
          />
        ) : (
          <div className={styles.thumb}>#{character.name?.[0] || 'C'}</div>
        )}

        {isRunning && (
          <span className={styles.progressBadge} aria-label="Training progress">
            <CircleProgress value={progressPct} size={32} thickness={2} />
          </span>
        )}
        {isWaiting && (
          <span className={styles.statusPill}>Training…</span>
        )}
      </div>
      <div className={styles.itemLabel}>{character.name}</div>
      {isActive && (
        <div className={styles.itemSubLabel}>
          {isRunning ? (
            <>
              ~<Countdown seconds={secondsLeft} fallback="Calculating..." /> remaining
            </>
          ) : (
            'Training…'
          )}
        </div>
      )}
    </button>
  )
}


