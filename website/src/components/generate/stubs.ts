// Stub implementations for GenerateBar - website demo doesn't need full functionality

const DIST = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''

export const makeCloudfrontLoader = (prefix: string) => {
  return ({ src }: { src: string }) => {
    // Ensure .webp extension
    const dot = src.lastIndexOf('.')
    const base = dot === -1 ? src : src.slice(0, dot)
    const webpName = `${base}.webp`
    
    return `${DIST}/${prefix}/${webpName}`
  }
}

export const sortColorsByPalette = (colors: any[]) => colors

export const isLightColor = (color: string) => {
  // Simple luminance check
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

export const useTranslatedScenes = (scenes: any[]) => scenes
export const useTranslatedWardrobes = (wardrobes: any[]) => wardrobes
export const useTranslatedColors = (colors: any[]) => colors

export const calculateImageCredits = (_quality: string, _batchSize: number, _costs?: any) => 0

export type ActiveTrainingJob = {
  id: string
  character_id: string
  status: string
  created_at: string
  updated_at: string
}

export const useGenerationConfig = () => ({
  quality: 'standard',
  batchSize: 1,
  setQuality: () => {},
  setBatchSize: () => {},
  data: {
    inferenceSettings: {
      qualities: ['standard', 'high'],
      quality_labels: { standard: 'Standard', high: 'High' },
      defaults: { quality: 'standard', nb_takes: 1, aspect_ratio: '1:1' },
      nb_takes_options: [1, 2, 4],
      aspect_ratios: ['1:1', '2:3', '3:2']
    },
    creditCosts: {}
  },
  isLoading: false,
  error: null
})

export const useCurrentSubscription = () => ({
  data: null,
  isLoading: false
})

export const useCreditCosts = () => ({
  data: {},
  isLoading: false
})

export const useSubscriptionStatus = () => ({
  hasActiveSubscription: false,
  isLoading: false
})

export const useCreditGuard = (_cost: number) => {
  return <T extends (...args: any[]) => any>(fn: T) => fn
}

export const useJobsApi = () => ({
  startInference: async () => ({ success: false })
})

export const useOpenCreditPackDialog = () => {
  return (_credits?: number) => {}
}

export const useQueryClient = () => ({
  invalidateQueries: (_opts?: any) => {},
  refetchQueries: (_opts?: any) => {}
})

export const getStyleImages = (images: any[]) => images

export const getStoredStyleSelections = (_styleId: string) => ({
  scene: null as string | null,
  wardrobe: null as string | null,
  color: null as string | null
})

export const storeStyleSelections = (_styleId: string, _selections: any) => {}

export const storeSelectedStyleIndex = (_index: number) => {}

export const useCharactersApi = () => ({
  getActiveCharacterCount: async () => 0,
  getUserCharacters: async () => [],
  getCharacter: async () => ({}),
  deleteCharacter: async () => {}
})

export const useActionGate = (_cost: number, _type: string) => ({
  runWithGates: <T extends (...args: any[]) => any>(fn: T) => fn
})

export const useInferenceQueue = () => ({
  addJob: () => {},
  removeJob: () => {},
  createQueuedThumbnails: () => 'placeholder-id',
  updateJobWithRealId: () => {},
  updateJobStatus: () => {},
  updateJobMessage: () => {},
  isGenerating: false
})

export const useTrainingProgress = (_opts: any) => ({
  progress: 0,
  status: 'idle',
  getProgressPercentage: () => 0,
  getLiveCountdownSeconds: () => 0
})

export const useInferenceProgress = (_opts: any) => ({
  progress: 0,
  status: 'idle'
})

export const confirmationService = {
  confirm: async (_opts: any) => false
}

export function Countdown({ seconds, fallback }: { seconds: number; fallback: string }) {
  if (seconds <= 0) return fallback
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

