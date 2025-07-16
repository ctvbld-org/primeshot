'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
  DialogFooter,
} from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Textarea } from '@primeshot/common/web/ui/textarea'

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTranslations: Record<string, any>
}

export function TranslationDialog({
  open,
  onOpenChange,
  currentTranslations,
}: TranslationDialogProps) {
  const translationsJson = JSON.stringify(currentTranslations || {}, null, 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Translations</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DialogDescription>
            This is a read-only view of the translations. New translations are automatically generated when saving content.
          </DialogDescription>
          <Textarea
            value={translationsJson}
            readOnly
            className="min-h-[400px] font-mono text-sm bg-muted/50 cursor-default resize-none mt-4"
            placeholder="{}"
          />
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}