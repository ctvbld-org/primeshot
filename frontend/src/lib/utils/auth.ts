import { AuthError, User } from '@/types/auth'

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatAuthError(error: Error): AuthError {
  return {
    message: error.message,
    code: (error as any).code || 'unknown'
  }
}

export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    (typeof (value as User).email === 'string' || (value as User).email === null)
  )
}

export function getErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address'
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later'
    default:
      return error.message || 'An error occurred. Please try again'
  }
} 