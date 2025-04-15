import { AuthError, User } from '@/types/auth'

export function formatAuthError(error: Error): AuthError {
  return {
    message: error.message,
    code: (error as any).code || 'unknown'
  }
} 