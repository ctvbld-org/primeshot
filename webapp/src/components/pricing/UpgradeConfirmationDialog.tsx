import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Badge } from '@primeshot/common/web/ui/badge'
import { ArrowRight, CreditCard, Clock } from 'lucide-react'

interface UpgradePreview {
  currentPlan: {
    name: string
    displayName: string
    price: number
  }
  newPlan: {
    name: string
    displayName: string
    price: number
  }
  billing: {
    proratedAmount: number
    recurringAmount: number
    billingInterval: string
    daysRemaining: number
    totalDays: number
    subtotal?: number
    tax?: number
    total?: number
  }
}

interface UpgradeConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  preview: UpgradePreview | null
  isLoading?: boolean
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function UpgradeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  preview,
  isLoading = false
}: UpgradeConfirmationDialogProps) {
  if (!preview) return null

  const { currentPlan, newPlan, billing } = preview

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Subscription Upgrade</DialogTitle>
          <DialogDescription>
            Review your upgrade details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Change */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium">{currentPlan.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(currentPlan.price)}/month
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{newPlan.displayName}</p>
                  <Badge variant="default" className="text-xs">New</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(newPlan.price)}/month
                </p>
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Billing Summary</span>
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount due today:</span>
                <span className="font-medium">
                  {billing.proratedAmount > 0 ? formatPrice(billing.proratedAmount) : 'Free'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Next billing ({billing.billingInterval}ly):
                </span>
                <span className="font-medium">{formatPrice(billing.recurringAmount)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {billing.daysRemaining} days remaining in current period
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proration Explanation */}
          {billing.proratedAmount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Prorated billing:</strong> You'll be charged {formatPrice(billing.proratedAmount)} today for the remaining{' '}
                {billing.daysRemaining} days of your current billing period.
              </p>
              <p className="text-xs text-blue-700 mt-1">
                💡 This amount is calculated by Stripe using precise proration based on usage timing and your billing cycle.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Upgrading...' : `Upgrade for ${billing.proratedAmount > 0 ? formatPrice(billing.proratedAmount) : 'Free'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 