import React, { useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageQualityScore } from './image-quality-score'
import { ImageQualityResult } from '@/lib/image-quality'
import { useTranslation } from 'react-i18next'

interface RejectedImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: File[]
  qualityResults: Record<string, ImageQualityResult>
  onRemoveFile: (index: number) => void
  onContinue: () => void
}

export function RejectedImagesDialog({
  open,
  onOpenChange,
  files,
  qualityResults,
  onRemoveFile,
  onContinue
}: RejectedImagesDialogProps) {
  // 1. Hooks
  const { t } = useTranslation('upload')

  // 2. Memoized values
  const rejectedFiles = useMemo(() => 
    files.filter(file => !qualityResults[file.name]?.isAcceptable),
    [files, qualityResults]
  )

  const counts = useMemo(() => ({
    rejected: rejectedFiles.length,
    total: files.length
  }), [rejectedFiles, files])

  // 3. Callbacks
  const handleRemoveFile = useCallback((index: number) => {
    onRemoveFile(index)
  }, [onRemoveFile])

  // 4. Render helpers
  const renderRejectedFiles = useMemo(() => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto py-4">
      {rejectedFiles.map((file, index) => (
        <ImageQualityScore
          key={file.name}
          file={file}
          result={qualityResults[file.name]}
          onRemove={() => handleRemoveFile(index)}
          isUploading={false}
          progress={0}
          variant="rejected"
        />
      ))}
    </div>
  ), [rejectedFiles, qualityResults, handleRemoveFile])

  // 5. Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('quality.rejected.title', {
              rejected: counts.rejected,
              total: counts.total
            })}
          </DialogTitle>
        </DialogHeader>

        {renderRejectedFiles}

        <DialogFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={onContinue}
          >
            {t('quality.rejected.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 