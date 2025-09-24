'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@primeshot/common/web/Icon'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useDialogService } from '@/contexts/DialogServiceContext'

interface PurchaseSuccessDialogProps {
  kind: 'subscription' | 'credits'
  hideHeader?: boolean
}

export function PurchaseSuccessDialog({ kind }: PurchaseSuccessDialogProps) {
  const { data: sub } = useCurrentSubscription()
  const { closeDialog } = useDialogService()

  const title = useMemo(() => {
    if (kind === 'subscription') {
      const plan = sub?.plan_name || 'your new plan'
      return `You have successfully upgraded to ${plan}`
    }
    return 'Credits added!'
  }, [kind, sub?.plan_name])

  const description = useMemo(() => {
    if (kind === 'subscription') {
      const amount = sub?.credits_included
      return amount ? `Your new subscription billing cycle starts today. Enjoy ${amount} credits and much more!` : 'Your new subscription billing cycle starts today. Enjoy your new benefits!'
    }
    return 'Your balance has been updated. You can start generating now.'
  }, [kind, sub?.credits_included])

  return (
    <div style={{ maxWidth: 380, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 60px 40px', color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 9999, border: '2px solid #2ADED8' }}>
        <Icon variant="checkmark" size={20} className="text-[#2ADED8]" />
      </div>
      <h2 style={{ textAlign: 'center', margin: '10px 0 0', fontSize: 16, fontWeight: 400, lineHeight: '18px' }}>{title}</h2>
      <p style={{ textAlign: 'center', margin: 0, opacity: 0.6, fontSize: 12, fontWeight: 400, lineHeight: '16px' }}>{description}</p>
      <div style={{ marginTop: 30, width: '100%', maxWidth: 200 }}>
        <Button variant="primary" size="sm" onClick={closeDialog} style={{ width: '100%' }}>
          Return to Shoot
        </Button>
      </div>
    </div>
  )
}

export default PurchaseSuccessDialog


