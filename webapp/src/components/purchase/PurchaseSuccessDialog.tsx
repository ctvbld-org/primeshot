'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@primeshot/common/web/Icon'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { useTranslation } from 'react-i18next'

interface PurchaseSuccessDialogProps {
  kind: 'subscription' | 'credits'
  hideHeader?: boolean
}

export function PurchaseSuccessDialog({ kind }: PurchaseSuccessDialogProps) {
  const { data: sub } = useCurrentSubscription()
  const { closeDialog } = useDialogService()
  const { t } = useTranslation('pricing')
  const tp = (k: string, o?: any) => String((t as any)(k, o))

  const title = useMemo(() => {
    if (kind === 'subscription') {
      const plan = sub?.plan_name || tp('purchase.success.defaultPlan')
      return tp('purchase.success.subscriptionTitle', { plan })
    }
    return tp('purchase.success.creditsTitle')
  }, [kind, sub?.plan_name, t])

  const description = useMemo(() => {
    if (kind === 'subscription') {
      const amount = sub?.credits_included
      return amount
        ? tp('purchase.success.subscriptionDescriptionWithCredits', { amount })
        : tp('purchase.success.subscriptionDescription')
    }
    return tp('purchase.success.creditsDescription')
  }, [kind, sub?.credits_included, t])

  return (
    <div style={{ maxWidth: 380, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 60px 40px', color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 9999, border: '2px solid #2ADED8' }}>
        <Icon variant="checkmark" size={20} className="text-[#2ADED8]" />
      </div>
      <h2 style={{ textAlign: 'center', margin: '10px 0 0', fontSize: 16, fontWeight: 400, lineHeight: '18px' }}>{title}</h2>
      <p style={{ textAlign: 'center', margin: 0, opacity: 0.6, fontSize: 12, fontWeight: 400, lineHeight: '16px' }}>{description}</p>
      <div style={{ marginTop: 30, width: '100%', maxWidth: 200 }}>
        <Button variant="primary" size="sm" onClick={closeDialog} style={{ width: '100%' }}>
          {tp('purchase.success.returnToShoot')}
        </Button>
      </div>
    </div>
  )
}

export default PurchaseSuccessDialog


