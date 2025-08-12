"use client"

import React, { useCallback, useMemo, useState } from 'react'
// Embla type import replaced with any to avoid cross-package type issues
import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { useTranslation } from 'react-i18next'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useScenes, useWardrobes, useColors } from '@/hooks/useConfig'

import { getStyleImages } from '@/lib/utils/get-styles-images'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { storeSelectedStyleIndex, getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { BATCH_PRICING, CREDIT_COSTS } from '@/lib/constants/pricing'
import styles from './GenerateBar.module.css'
import { useAuth } from '@/contexts/auth-context'
import { useCharactersApi } from '@/lib/api/characters'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { getApiUrl } from '@/lib/api/client'
import { useActiveTrainingJob } from '@/hooks/useActiveTrainingJob'
import { useTrainingProgress } from '@/hooks/useJobProgress'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { Countdown } from '@/components/character/Countdown'

import { OptionsPanel } from '../OptionsPanel/OptionsPanel'
import { GenerateBarSelect } from './GenerateBarSelect'
import { useCreateCharacter } from './useCreateCharacter'

type PanelKey = 'styles' | 'scenes' | 'wardrobe' | 'characters' | 'settings' | null

interface GenerateBarProps { emblaApi: any | null; onPanelToggle?: (open: boolean) => void }

export function GenerateBar({ emblaApi, onPanelToggle }: GenerateBarProps) {
  const { t } = useTranslation(['styles', 'settings'])
  const { selectedStyleIndex, setSelectedStyleIndex, stylesData } = useStyleSelection()
  const { data: scenes = [] } = useScenes()
  const { data: wardrobes = [] } = useWardrobes()
  const { data: colors = [] } = useColors()

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  // Wardrobe panel local UI state
  const [selectedWardrobeValue, setSelectedWardrobeValue] = useState<string | null>(null)
  const [selectedGender, setSelectedGender] = useState<'man' | 'woman'>('woman')
  const [selectionVersion, setSelectionVersion] = useState(0)

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

  type QualityCode = '1K' | '2K' | '4K'
  const ALLOWED_QUALITIES: QualityCode[] = ['1K', '2K', '4K']
  const sanitizeQuality = (q: any): QualityCode =>
    ((ALLOWED_QUALITIES as unknown as string[]).includes(q) ? q : '1K') as QualityCode

  const [nbTakes, setNbTakes] = useState<number>(() => load(STORAGE_KEYS.NB_TAKES, 10))
  const [quality, setQuality] = useState<QualityCode>(() => sanitizeQuality(load(STORAGE_KEYS.QUALITY, '1K')))
  const [aspectRatio, setAspectRatio] = useState<string>(() => load(STORAGE_KEYS.ASPECT_RATIO, '4:5'))

  // Selected character tracking (for selector thumbnail progress overlay)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('character-selection')
      return saved ? JSON.parse(saved).modelId : null
    } catch { return null }
  })

  const { data: subscription } = useCurrentSubscription()
  const { hasActiveSubscription } = useSubscriptionStatus()
  const requiredCredits = useMemo(() => {
    const table = BATCH_PRICING?.[quality] ?? []
    const entry = table.find(b => b.size === nbTakes)
    const perImage = CREDIT_COSTS?.IMAGE_GENERATION?.[quality] ?? 1
    return entry ? entry.credits : perImage * nbTakes
  }, [nbTakes, quality])
  const guard = useCreditGuard(requiredCredits)

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

  const onGenerate = useCallback(() => {
    // Generation intent is already handled elsewhere via events; here we just emit
    const event = new CustomEvent('execute-inference-create', { detail: { nbTakes, aspectRatio, quality } })
    window.dispatchEvent(event)
  }, [nbTakes, aspectRatio, quality])

  const qualityOptions = useMemo(() => ([
    { label: 'Basic', value: '1K' as QualityCode },
    { label: 'Standard', value: '2K' as QualityCode },
    { label: 'High', value: '4K' as QualityCode },
  ]), [])

  const currentQualityLabel = useMemo(() => {
    const found = qualityOptions.find(o => o.value === quality)
    return found?.label ?? ''
  }, [qualityOptions, quality])

  // Panel contents
  // Characters panel hooks and logic (top-level to respect rules of hooks)
  const { user } = useAuth()
  const { getUserCharacters } = useCharactersApi()
  const [characters, setCharacters] = React.useState<any[]>([])
  const [characterThumbs, setCharacterThumbs] = React.useState<Record<string, string>>({})

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
                  {opt.image && <Image src={getOptionsImage(opt.image)} alt={opt.label} width={80} height={80} className={styles.itemThumb} />}
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
                      {opt.image && <Image src={getOptionsImage(opt.image)} alt={opt.label} width={80} height={80} className={styles.itemThumb} />}
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
          const maxQuality = (subscription as any)?.max_quality || '1K'
          if (maxQuality === '1K' && (res === '2K' || res === '4K')) return true
          if (maxQuality === '2K' && res === '4K') return true
          return false
        }
        return (
          <OptionsPanel className={styles.settingsPanel} title={'Settings'} onClose={close}>
            <div className={styles.settingsColumn}>
              <span className={styles.settingLabel}>Number of Takes</span>
              <div className={styles.segmented}>
                {[5, 15, 20].map(n => (
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
                      const q = sanitizeQuality(opt.value)
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
                {['4:5', '16:9', '1:1', '3:4'].map(r => (
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
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
                const scene = scenes.find(s => s.value === sel)
                if (scene?.image) return <Image src={getOptionsImage(scene.image)} alt={scene.label} width={32} height={32} className={styles.thumbImg} />
                return <Icon variant="scene" size={24} />
                })()}
                label={selectedLabels.scene || 'Scene'}
            />

            {/* Wardrobe */}
            <GenerateBarSelect
                onClick={() => open('wardrobe')}
                ariaLabel="Select wardrobe"
                variant="labeled"
                thumbnail={(() => {
                const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
                const wrb = wardrobes.find(w => w.value === (sel?.wardrobe || ''))
                if (wrb?.image) {
                    return (
                    <Image src={getOptionsImage(wrb.image)} alt={wrb.label} width={32} height={32} className={styles.thumbImg} />
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
            <button className={styles.generate} onClick={guard(onGenerate)}>Generate</button>
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


