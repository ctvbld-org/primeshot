import type { AuthError } from '../../types/auth'

interface ErrorWithCode extends Error {
  code?: string
}

export function formatAuthError(error: Error): AuthError {
  const err = error as ErrorWithCode
  return {
    message: err.message,
    code: err.code ?? 'unknown'
  }
} 