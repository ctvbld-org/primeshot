'use client'

import { useEffect, useMemo, useState } from 'react'
import { createElement } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import PurchaseSuccessDialog from '@/components/purchase/PurchaseSuccessDialog'
import { Confetti } from '@/components/animations/confetti'

export function PurchaseSuccessHandler() {
  const { openDialog } = useDialogService()
  const [confetti, setConfetti] = useState<false | 'subscription' | 'credits'>(false)

  const params = useMemo(() => {
    if (typeof window === 'undefined') return null
    try { return new URLSearchParams(window.location.search) } catch { return null }
  }, [])

  useEffect(() => {
    if (!params) return
    const sub = params.get('subscription')
    const credits = params.get('credits')
    if (sub && sub.toLowerCase() === 'success') {
      openDialog(createElement(PurchaseSuccessDialog, { kind: 'subscription', hideHeader: true } as any), { title: 'Success', description: 'Subscription upgraded' })
      setConfetti('subscription')
      return
    }
    if (credits && credits.toLowerCase() === 'success') {
      openDialog(createElement(PurchaseSuccessDialog, { kind: 'credits', hideHeader: true } as any), { title: 'Success', description: 'Credits added' })
      setConfetti('credits')
      return
    }
  }, [params, openDialog])

  return (
    <>
      {confetti && (
        <Confetti show={true} duration={10000} burstMs={2000} onComplete={() => setConfetti(false)} />
      )}
    </>
  )
}

export default PurchaseSuccessHandler


