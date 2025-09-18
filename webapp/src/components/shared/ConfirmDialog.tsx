'use client'

import React from 'react'
import { Dialog as PSDialog, DialogContent as PSDialogContent } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@primeshot/common/web/Icon'
import confirmStyles from '@/lib/services/confirmation.module.css'

type IconVariant = 'bin' | 'warning' | 'cross' | 'info' | 'question'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmText: React.ReactNode
  cancelText?: React.ReactNode
  onConfirm: () => void
  onCancel?: () => void
  iconVariant?: IconVariant
  iconColor?: string
  confirmVariant?: 'destructive' | 'secondary' | 'primary' | 'ghost'
  confirmDisabled?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  iconVariant = 'warning',
  iconColor = '#FF3535',
  confirmVariant = 'destructive',
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <PSDialog open={open} onOpenChange={onOpenChange}>
      <PSDialogContent>
        <div className={confirmStyles.container}>
          <div className={confirmStyles.content}>
            <Icon className={confirmStyles.icon} variant={iconVariant} size={40} aria-hidden="true" style={{ color: iconColor }} />
            <h2 className={confirmStyles.title}>{title}</h2>
            {description && (
              <div className={confirmStyles.description}>
                {description}
              </div>
            )}
          </div>
          <div className={confirmStyles.footer}>
            <Button
              variant={confirmVariant}
              size="sm"
              className={confirmStyles.button}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmText}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className={confirmStyles.button}
              onClick={() => {
                onCancel?.()
                onOpenChange(false)
              }}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </PSDialogContent>
    </PSDialog>
  )
}

export default ConfirmDialog


