'use client'

import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePaymentRecovery } from "@/lib/hooks/use-payment-recovery"
import { PaymentRecoveryDialog } from "@/components/ui/alert-dialog"
import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/app-header'

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
    <div className="flex flex-col flex-1 justify-center pt-[56px] pb-[64px] min-h-screen overflow-hidden" style={{ backgroundColor: '#001514' }}>
      {!pathname.includes('/settings/profile') && (
        <AppHeader user={user} />
      )}
      <main className="h-full pt-0">
        {children}
      </main>
      <Toaster />
    </div>
  )
} 