'use client'

import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePaymentRecovery } from "@/lib/hooks/use-payment-recovery"
import { PaymentRecoveryDialog } from "@/components/ui/alert-dialog"
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { UserNav } from '@/components/user-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { orderId, hasInterruptedPayment, resumePayment, dismissRecovery } = usePaymentRecovery()
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(hasInterruptedPayment)
  
  // Don't show recovery dialog on payment pages
  const isPaymentPage = pathname.includes("/payment")
  const shouldShowRecovery = hasInterruptedPayment && !isPaymentPage && showRecoveryDialog

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#001514' }}>
      <header>
        <div className="mx-auto flex h-[56px] items-center justify-between px-4">
          <Image 
            src="/logo.svg" 
            alt="Primeshot Logo" 
            width={40} 
            height={40}
            priority
          />
          <UserNav user={user} />
        </div>
      </header>
      <main>
        {children}
      </main>
      <Toaster />
      
      {/* Payment Recovery Dialog */}
      {orderId && (
        <PaymentRecoveryDialog
          open={shouldShowRecovery}
          onOpenChange={setShowRecoveryDialog}
          orderId={orderId}
          onResume={() => {
            resumePayment()
            setShowRecoveryDialog(false)
          }}
          onCancel={() => {
            dismissRecovery()
            setShowRecoveryDialog(false)
          }}
        />
      )}
    </div>
  )
} 