'use client'

import React, { useState } from 'react'
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
import { translateRow } from '@/lib/translation'
import { toast } from '@primeshot/common/web/ui/use-toast'
import { RefreshCw } from 'lucide-react'

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTranslations: Record<string, any>
  // Props needed for retranslation
  table?: string
  rowData?: Record<string, any>
  onTranslationsUpdated?: (newTranslations: Record<string, any>) => void
}

export function TranslationDialog({
  open,
  onOpenChange,
  currentTranslations,
  table,
  rowData,
  onTranslationsUpdated,
}: TranslationDialogProps) {
  const [isRetranslating, setIsRetranslating] = useState(false)
  const [displayedTranslations, setDisplayedTranslations] = useState(currentTranslations)
  
  // Update displayed translations when currentTranslations prop changes
  React.useEffect(() => {
    setDisplayedTranslations(currentTranslations)
  }, [currentTranslations])

  const translationsJson = JSON.stringify(displayedTranslations || {}, null, 2)

  const handleRetranslate = async () => {
    if (!table || !rowData) {
      toast({
        title: "Error",
        description: "Cannot retranslate: missing table or row data",
        variant: "destructive"
      })
      return
    }

    setIsRetranslating(true)
    try {
      const newTranslations = await translateRow(table, rowData)
      setDisplayedTranslations(newTranslations)
      
      // Notify parent component of the updated translations
      if (onTranslationsUpdated) {
        onTranslationsUpdated(newTranslations)
      }
      
      toast({
        title: "Success",
        description: "Translations have been regenerated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Translation failed",
        description: error.message || "Failed to regenerate translations",
        variant: "destructive"
      })
    } finally {
      setIsRetranslating(false)
    }
  }

  const canRetranslate = table && rowData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Translations</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DialogDescription>
            This is a read-only view of the translations. New translations are automatically generated when saving content.
            {canRetranslate && " You can also regenerate translations manually using the button below."}
          </DialogDescription>
          <Textarea
            value={translationsJson}
            readOnly
            className="min-h-[400px] font-mono text-sm bg-muted/50 cursor-default resize-none mt-4"
            placeholder="{}"
          />
        </DialogBody>

        <DialogFooter className="gap-2">
          {canRetranslate && (
            <Button
              onClick={handleRetranslate}
              disabled={isRetranslating}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetranslating ? 'animate-spin' : ''}`} />
              {isRetranslating ? 'Retranslating...' : 'Retranslate'}
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}