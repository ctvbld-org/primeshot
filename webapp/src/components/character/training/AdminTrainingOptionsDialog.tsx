'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogHeader } from '@primeshot/common/web/ui/dialog'
import { Label } from '@primeshot/common/web/ui/label'
import { Input } from '@primeshot/common/web/ui/input'
import { Button } from '@primeshot/common/web/ui/button'

export interface AdminTrainingParams {
  batch_size: number
  resize_size: number
  rank: number
  steps: number
}

interface AdminTrainingOptionsDialogProps {
  open: boolean
  defaults?: Partial<AdminTrainingParams>
  onCancel: () => void
  onConfirm: (params: AdminTrainingParams) => void
}

export function AdminTrainingOptionsDialog({ open, defaults, onCancel, onConfirm }: AdminTrainingOptionsDialogProps) {
  const [steps, setSteps] = useState<number>(defaults?.steps ?? 2700)
  const [batchSize, setBatchSize] = useState<number>(defaults?.batch_size ?? 7)
  const [resizeSize, setResizeSize] = useState<number>(defaults?.resize_size ?? 768)
  const [rank, setRank] = useState<number>(defaults?.rank ?? 32)

  const handleConfirm = useCallback(() => {
    const payload: AdminTrainingParams = {
      steps: Number(steps) || 2700,
      batch_size: Number(batchSize) || 7,
      resize_size: Number(resizeSize) || 768,
      rank: Number(rank) || 32
    }
    onConfirm(payload)
  }, [batchSize, resizeSize, rank, onConfirm, steps])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Training Overrides</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <p className="text-[12px] text-muted-foreground">Between 2600 and 2700 seems to drive the best results but need to compare properly</p>
            <Input id="steps" type="number" value={steps} step={100}
              onChange={(e) => setSteps(parseInt(e.target.value, 10))} min={2200} max={3000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch_size">Batch size</Label>
            <p className="text-[12px] text-muted-foreground">Lower produces better quality but slower training</p>
            <Input id="batch_size" type="number" value={batchSize} step={1}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))} min={4} max={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resize_size">Resize size</Label>
            <p className="text-[12px] text-muted-foreground">Higher produces better quality but slower training</p>
            <Input id="resize_size" type="number" value={resizeSize} step={128}
              onChange={(e) => setResizeSize(parseInt(e.target.value, 10))} min={512} max={2048} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rank">LoRA rank</Label>
            <p className="text-[12px] text-muted-foreground">Higher produces better quality</p>
            <Input id="rank" type="number" value={rank} step={16}
              onChange={(e) => setRank(parseInt(e.target.value, 10))} min={16} max={256} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminTrainingOptionsDialog


