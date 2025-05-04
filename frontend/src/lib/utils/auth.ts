import { AuthError } from '@/types/auth'

interface ErrorWithCode extends Error {
  code?: string;
}

export function formatAuthError(error: Error): AuthError {
  const errorWithCode = error as ErrorWithCode;
  return {
    message: error.message,
    code: errorWithCode.code || 'unknown'
  }
} 