'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center space-y-2 gap-4">
          <Image
            src="/logo.svg"
            alt="Primeshot"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <h1 className="text-2xl font-semibold">Authentication Error</h1>
          <p className="text-sm text-white">
            There was a problem signing you in. Please try again.
          </p>
        </div>

        <Link
          href="/auth/signin"
          className="text-sm text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
} 