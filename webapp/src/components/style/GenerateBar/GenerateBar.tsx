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
import { getStoredSelectedStyleIndex, storeSelectedStyleIndex, getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { BATCH_PRICING, CREDIT_COSTS, ResolutionType } from '@/lib/constants/pricing'
import styles from './GenerateBar.module.css'
import { useAuth } from '@/contexts/auth-context'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { useSubscriptionTiers, useCreditCosts, getCharacterTrainingCost, getCharacterLimit } from '@/hooks/usePricingConfig'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useCharactersApi } from '@/lib/api/characters'
import { CharacterTrainingDialog } from '@/components/character/CharacterTrainingDialog'
import { getApiUrl } from '@/lib/api/client'
import { useActiveTrainingJob } from '@/hooks/useActiveTrainingJob'
import { useTrainingProgress } from '@/hooks/useJobProgress'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { Countdown } from '@/components/character/Countdown'

import { OptionsPanel } from '../OptionsPanel/OptionsPanel'

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
  const [selectedGender, setSelectedGender] = useState<'man' | 'woman'>('man')
  const [selectionVersion, setSelectionVersion] = useState(0)

  // Settings state stored in localStorage-compatible keys
  const STORAGE_KEYS = {
    BATCH_SIZE: 'generation-controls-batch-size',
    RESOLUTION: 'generation-controls-resolution',
    ASPECT_RATIO: 'generation-controls-aspect-ratio',
    QUALITY: 'generation-controls-quality'
  }

  const load = (k: string, def: any) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def }
  }
  const save = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }

  const [batchSize, setBatchSize] = useState<number>(() => load(STORAGE_KEYS.BATCH_SIZE, 10))
  const [resolution, setResolution] = useState<ResolutionType>(() => load(STORAGE_KEYS.RESOLUTION, '1K'))
  const [aspectRatio, setAspectRatio] = useState<string>(() => load(STORAGE_KEYS.ASPECT_RATIO, '4:5'))
  const [quality, setQuality] = useState<string>(() => load(STORAGE_KEYS.QUALITY, 'Basic'))

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
    const entry = BATCH_PRICING[resolution].find(b => b.size === batchSize)
    return entry ? entry.credits : CREDIT_COSTS.IMAGE_GENERATION[resolution] * batchSize
  }, [batchSize, resolution])
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
    const event = new CustomEvent('execute-generation-intent', { detail: { batchSize, resolution, aspectRatio, quality } })
    window.dispatchEvent(event)
  }, [batchSize, resolution, aspectRatio, quality])

  const qualityOptions = useMemo(() => ([
    { label: '1K', value: '1K' as ResolutionType },
    { label: '2K', value: '2K' as ResolutionType },
    { label: '4K', value: '4K' as ResolutionType },
  ]), [])

  // Panel contents
  // Characters panel hooks and logic (top-level to respect rules of hooks)
  const { user } = useAuth()
  const dialogService = useDialogService()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  const { data: creditCosts } = useCreditCosts()
  const { data: creditBalance } = useCreditBalance()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const { getUserCharacters } = useCharactersApi()

  const characterTrainingCost = getCharacterTrainingCost(creditCosts)
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

  // Selected-character active job/progress for the small selector thumbnail
  const { job: selectedJob } = useActiveTrainingJob(selectedCharacterId)
  const selectedIsRunning = selectedJob?.status === 'running'
  const selectedIsWaiting = !!selectedJob && (selectedJob.status === 'initializing' || selectedJob.status === 'queued' || selectedJob.status === 'pending')
  // Always call hooks in the same order; pass empty jobId when not running
  const selectedTraining = useTrainingProgress({ jobId: selectedJob?.id || '' })
  const selectedPct = selectedIsRunning ? selectedTraining.getProgressPercentage?.() ?? 0 : 0

  const remainingCharacterTrainings = React.useMemo(() => {
    if (!subscription) return 0
    return Math.max(0, subscription.character_training_included - subscription.character_training_used)
  }, [subscription])

  const needsCreditsForTraining = React.useMemo(() => {
    if (!subscription) return true
    return remainingCharacterTrainings <= 0
  }, [subscription, remainingCharacterTrainings])

  const hasSufficientCredits = React.useMemo(() => {
    if (!needsCreditsForTraining) return true
    if (creditBalance === undefined) return false
    return creditBalance >= characterTrainingCost
  }, [needsCreditsForTraining, creditBalance, characterTrainingCost])

  const maxCharacters = React.useMemo(() => {
    if (!subscription || !subscriptionTiers) return 1
    return getCharacterLimit(subscription.plan_name, subscriptionTiers)
  }, [subscription, subscriptionTiers])

  const hasReachedCharacterLimit = React.useMemo(() => characters.length >= maxCharacters, [characters.length, maxCharacters])
  const isOnHighestTier = React.useMemo(() => {
    if (!subscription?.plan_name || !subscriptionTiers) return false
    const tier = subscriptionTiers.find(t => t.name === subscription.plan_name)
    return tier?.max_characters === 8
  }, [subscription?.plan_name, subscriptionTiers])

  type CreateAction = { type: 'create'|'credit_pack'|'upgrade_subscription'|'limit_reached'; credits?: number; message: string }
  const createCharacterAction: CreateAction = React.useMemo(() => {
    if (hasReachedCharacterLimit) {
      if (isOnHighestTier) return { type: 'limit_reached', message: 'Limit Reached' }
      return { type: 'upgrade_subscription', message: 'Create' }
    }
    if (needsCreditsForTraining && !hasSufficientCredits) {
      return { type: 'credit_pack', message: 'Create', credits: characterTrainingCost }
    }
    return { type: 'create', message: 'Create' }
  }, [hasReachedCharacterLimit, isOnHighestTier, needsCreditsForTraining, hasSufficientCredits, characterTrainingCost])

  const handleCreateCharacter = () => {
    switch (createCharacterAction.type) {
      case 'credit_pack':
        openCreditPackDialog(createCharacterAction.credits)
        return
      case 'upgrade_subscription':
        openSubscriptionDialog({
          context: 'character-limit',
          currentPlan: subscription?.plan_name,
          showOnlyUpgrades: true,
          requiredFeature: 'max_characters'
        })
        return
      case 'limit_reached':
        return
      case 'create':
        // Close the panel immediately when opening the dialog
        close()
        dialogService.openDialog(
          <CharacterTrainingDialog onComplete={(id) => { onSelectCharacter(id); refreshCharacters() }} />
        )
        return
    }
  }

  const onSelectCharacter = (modelId: string) => {
    try { localStorage.setItem('character-selection', JSON.stringify({ modelId })) } catch {}
    setSelectedCharacterId(modelId)
    close()
  }

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
              <button className={`${styles.itemCard} ${styles.createCard}`} onClick={handleCreateCharacter} disabled={createCharacterAction.type === 'limit_reached'}>
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
        const gated = (res: ResolutionType) => {
          if (!hasActiveSubscription) return false
          const maxRes = subscription?.max_resolution || '1K'
          if (maxRes === '1K' && (res === '2K' || res === '4K')) return true
          if (maxRes === '2K' && res === '4K') return true
          return false
        }
        return (
          <OptionsPanel title={'Settings'} onClose={close}>
            <div className={styles.settingsRow}>
              <span className={styles.settingLabel}>Number of Takes</span>
              <div className={styles.segmented}>
                {[5, 15, 20].map(n => (
                  <button key={n} className={`${styles.segment} ${batchSize === n ? styles.segmentActive : ''}`} onClick={() => { setBatchSize(n); save(STORAGE_KEYS.BATCH_SIZE, n) }}>{n}</button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingLabel}>Quality</span>
              <div className={styles.segmented}>
                {qualityOptions.map(opt => (
                  <button key={opt.value} className={`${styles.segment} ${resolution === opt.value ? styles.segmentActive : ''} ${gated(opt.value) ? styles.segmentDisabled : ''}`} disabled={gated(opt.value)} onClick={() => { setResolution(opt.value); save(STORAGE_KEYS.RESOLUTION, opt.value) }}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
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
      {/* Style button */}
      <button className={styles.barButton} onClick={() => open('styles')} aria-label="Select style">
        <div className={styles.thumb}>
          {currentStyle?.preview ? <Image src={currentStyle.preview} alt={currentStyle?.name || 'style'} width={32} height={32} className={styles.thumbImg} /> : <Icon variant="scene" size={24} />}
        </div>
        <div className={styles.texts}><div className={styles.primary}>{currentStyle?.name || t('titles.styleLabel', { ns: 'styles' })}</div></div>
      </button>

      <button className={styles.barButton} onClick={() => open('scenes')} aria-label="Select scene">
        <div className={styles.thumb}>
          {(() => {
            const sel = currentStyle ? getStoredStyleSelections(currentStyle.id).scene : null
            const scene = scenes.find(s => s.value === sel)
            if (scene?.image) return <Image src={getOptionsImage(scene.image)} alt={scene.label} width={32} height={32} className={styles.thumbImg} />
            return <Icon variant="scene" size={24} />
          })()}
        </div>
        <div className={styles.texts}><div className={styles.primary}>{selectedLabels.scene || 'Scene'}</div></div>
      </button>

      <button className={styles.barButton} onClick={() => open('wardrobe')} aria-label="Select wardrobe">
        <div className={styles.thumb} style={{ position: 'relative' }}>
          {(() => {
            const sel = currentStyle ? getStoredStyleSelections(currentStyle.id) : null
            const wrb = wardrobes.find(w => w.value === (sel?.wardrobe || ''))
            if (wrb?.image) {
              return (
                <>
                  <Image src={getOptionsImage(wrb.image)} alt={wrb.label} width={32} height={32} className={styles.thumbImg} />
                  {sel?.color ? (
                    <span style={{ position: 'absolute', right: 2, bottom: 2, width: 8, height: 8, borderRadius: 9999, background: colors.find(c=>c.value===sel.color)?.color || '#fff', border: '1px solid rgba(0,0,0,0.4)' }} />
                  ) : null}
                </>
              )
            }
            return <Icon variant="wardrobe" size={24} />
          })()}
        </div>
        <div className={styles.texts}><div className={styles.primary}>{selectedLabels.wardrobe || 'Wardrobe'}</div></div>
      </button>

      <button className={styles.barButton} onClick={() => open('characters')} aria-label="Select character">
        <div className={styles.thumb} style={{ position: 'relative' }}>
          {(() => {
            const url = selectedCharacterId ? characterThumbs[selectedCharacterId] : ''
            if (url) return <Image src={url} alt="Character" width={32} height={32} className={styles.thumbImg} />
            return <Icon variant="smilyFace" size={24} />
          })()}
          {selectedIsRunning && (
            <span className={styles.tinyProgress} aria-label="Training progress">
              <CircleProgress value={selectedPct} size={32} thickness={2} />
            </span>
          )}
          {selectedIsWaiting && <span className={styles.tinyTrainingDot} />}
        </div>
      </button>

      <button className={styles.barButton} onClick={() => open('settings')} aria-label="Open settings">
        <div className={styles.thumb}><Icon variant="idea" size={24} /></div>
      </button>

      <div className={styles.spacer} />

      <div className={styles.credits}>{requiredCredits} credits</div>
      <button className={styles.generate} onClick={guard(onGenerate)}>Generate</button>
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


