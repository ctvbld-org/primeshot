export interface UploadConstants {
  MIN_IMAGES: number;
  MAX_IMAGES: number;
}

export const UPLOAD_CONSTANTS: UploadConstants = {
  MIN_IMAGES: 10,
  MAX_IMAGES: 16,
} as const
