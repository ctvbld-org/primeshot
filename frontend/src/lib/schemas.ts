import { z } from 'zod';

// Base schemas with detailed validation and error messages
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  created_at: z.string().datetime('Invalid creation date'),
  updated_at: z.string().datetime('Invalid update date'),
});

export const sessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
  user_id: z.string().uuid('Invalid user ID'),
  created_at: z.string().datetime('Invalid creation date'),
  expires_at: z.string().datetime('Invalid expiration date'),
});

// Detailed composition settings validation
const compositionSettingsSchema = z.object({
  style: z.enum(['professional', 'casual', 'creative'], {
    errorMap: () => ({ message: 'Invalid style selection' })
  }),
  background: z.enum(['plain', 'office', 'outdoor', 'custom'], {
    errorMap: () => ({ message: 'Invalid background selection' })
  }),
  lighting: z.enum(['studio', 'natural', 'dramatic'], {
    errorMap: () => ({ message: 'Invalid lighting selection' })
  }),
  pose: z.enum(['front', 'threequarter', 'side'], {
    errorMap: () => ({ message: 'Invalid pose selection' })
  }),
  customSettings: z.record(z.string(), z.any()).optional(),
});

export const compositionSchema = z.object({
  id: z.string().uuid('Invalid composition ID'),
  user_id: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  settings: compositionSettingsSchema,
  created_at: z.string().datetime('Invalid creation date'),
  updated_at: z.string().datetime('Invalid update date'),
});

// Enhanced image schema with metadata
export const imageSchema = z.object({
  id: z.string().uuid('Invalid image ID'),
  composition_id: z.string().uuid('Invalid composition ID'),
  user_id: z.string().uuid('Invalid user ID'),
  url: z.string().url('Invalid URL format'),
  file_name: z.string().min(1, 'Filename is required'),
  file_size: z.number().min(0, 'Invalid file size'),
  mime_type: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Invalid image format'),
  dimensions: z.object({
    width: z.number().min(1, 'Invalid width'),
    height: z.number().min(1, 'Invalid height'),
  }),
  created_at: z.string().datetime('Invalid creation date'),
});

// API Request/Response schemas
export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const createCompositionSchema = compositionSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const updateCompositionSchema = compositionSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const createImageSchema = imageSchema.omit({
  id: true,
  url: true,
  created_at: true,
});

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const paginatedResponseSchema = z.object({
  items: z.array(z.any()),
  total: z.number().min(0),
  page: z.number().min(1),
  pageSize: z.number().min(1),
  totalPages: z.number().min(1),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any(),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Invalid file type. Only JPEG, PNG, and WebP are supported'),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
}); 