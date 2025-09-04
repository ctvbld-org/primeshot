import { z } from 'zod';

// Base schemas with detailed validation and error messages
export const userSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Please select a valid option' })
  }).optional().nullable(),
  created_at: z.string().datetime('Invalid creation date'),
  updated_at: z.string().datetime('Invalid update date'),
});

export const sessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
  user_id: z.string().uuid('Invalid user ID'),
  created_at: z.string().datetime('Invalid creation date'),
  expires_at: z.string().datetime('Invalid expiration date'),
});

// Detailed style settings validation
const styleSettingsSchema = z.object({
  photographyStyle: z.string({
    required_error: "Photography style is required",
    invalid_type_error: "Photography style must be a string"
  }),
  clothing: z.string({
    required_error: "Clothing option is required",
    invalid_type_error: "Clothing option must be a string"
  }),
  background: z.string({
    required_error: "Background option is required",
    invalid_type_error: "Background option must be a string"
  }),
  customSettings: z.record(z.string(), z.any()).optional(),
});

export const styleSchema = z.object({
  id: z.string().uuid('Invalid style ID'),
  user_id: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  settings: styleSettingsSchema,
  status: z.enum(['draft', 'pending', 'processing', 'completed'], {
    errorMap: () => ({ message: 'Invalid style status' })
  }),
  created_at: z.string().datetime('Invalid creation date'),
  updated_at: z.string().datetime('Invalid update date'),
});

// Enhanced image schema with metadata
export const imageSchema = z.object({
  id: z.string().uuid('Invalid image ID'),
  user_id: z.string().uuid('Invalid user ID'),
  character_id: z.string().uuid('Invalid character ID').optional().nullable(),
  style_id: z.string().uuid('Invalid style ID').optional().nullable(),
  url: z.string().url('Invalid URL format'),
  file_name: z.string().min(1, 'Filename is required'),
  file_size: z.number().min(0, 'Invalid file size'),
  mime_type: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Invalid image format'),
  dimensions: z.object({
    width: z.number().min(1, 'Invalid width'),
    height: z.number().min(1, 'Invalid height'),
  }),
  created_at: z.string().datetime('Invalid creation date'),
  quality_score: z.number().int().min(0).max(100).optional()
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

export const createStyleSchema = styleSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export const updateStyleSchema = styleSchema.omit({
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
  maxSize: z.number().default(4 * 1024 * 1024) // 4MB default - Edge Function payload limit
}).refine(
  ({ file, maxSize }) => file?.size !== undefined && file.size <= maxSize,
  ({ maxSize }) => ({
    message: `File exceeds maximum size of ${maxSize / (1024 * 1024)} MB`
  })
); 