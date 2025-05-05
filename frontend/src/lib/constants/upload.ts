export const UPLOAD_CONSTANTS = {
  MIN_IMAGES: 12,
  MAX_IMAGES: 30,
} as const

export const UPLOAD_STATUS = {
  PROCESSING: 'processing',
  PAID: 'paid',
  DRAFT: 'draft',
} as const

export const QUALITY_THRESHOLDS = {
  GOOD: 80,
  ACCEPTABLE: 60,
} as const 