'use client'

import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePaymentRecovery } from "@/lib/hooks/use-payment-recovery"
import { PaymentRecoveryDialog } from "@/components/ui/alert-dialog"
import { usePathname } from 'next/navigation'

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
    <div className="min-h-screen bg-background">
      <header className="border-b flex justify-center">
        <div className="container flex h-16 items-center px-4">
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Primeshot</h1>
            </nav>
            <Button 
              variant="ghost"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
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