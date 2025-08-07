export interface UploadConstants {
  MIN_IMAGES: number;
  MAX_IMAGES: number;
}

export const UPLOAD_CONSTANTS: UploadConstants = {
  MIN_IMAGES: 10,
  MAX_IMAGES: 20,
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