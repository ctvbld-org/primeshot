import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Badge } from '@primeshot/common/web/ui/badge'
import { ArrowRight, CreditCard } from 'lucide-react'

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
    upgradeAmount?: number // Full price for new upgrade system
    proratedAmount?: number // Legacy prorated amount (for backward compatibility)
    recurringAmount: number
    billingInterval: string
    isFullPrice?: boolean
    daysRemaining?: number
    totalDays?: number
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
  
  // Handle both new (upgradeAmount) and legacy (proratedAmount) systems
  const amountDueToday = billing.upgradeAmount ?? billing.proratedAmount ?? 0
  const isFullPriceUpgrade = billing.isFullPrice ?? false

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
                  {amountDueToday > 0 ? formatPrice(amountDueToday) : 'Free'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Next billing ({billing.billingInterval}ly):
                </span>
                <span className="font-medium">{formatPrice(billing.recurringAmount)}</span>
              </div>

            </div>
          </div>

          {/* Full Price Explanation */}
          {isFullPriceUpgrade && amountDueToday > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                <strong>Full subscription upgrade:</strong> Your current subscription will be canceled and you'll start a new billing cycle immediately at {formatPrice(amountDueToday)}/month.
              </p>
              <p className="text-xs text-green-700 mt-1">
                💡 Your existing credits will be preserved and any remaining time from your current subscription will not be prorated.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Upgrading...' : `Upgrade for ${amountDueToday > 0 ? formatPrice(amountDueToday) : 'Free'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 