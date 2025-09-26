'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogHeader } from '@primeshot/common/web/ui/dialog'
import { Label } from '@primeshot/common/web/ui/label'
import { Input } from '@primeshot/common/web/ui/input'
import { Button } from '@primeshot/common/web/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@primeshot/common/web/ui/select'

export interface AdminTrainingParams {
  batch_size: number
  resize_size: number
  steps: number
  learning_rate: number
  resolution: string
}

interface AdminTrainingOptionsDialogProps {
  open: boolean
  defaults?: Partial<AdminTrainingParams>
  onCancel: () => void
  onConfirm: (params: AdminTrainingParams) => void
}

export function AdminTrainingOptionsDialog({ open, defaults, onCancel, onConfirm }: AdminTrainingOptionsDialogProps) {
  const [steps, setSteps] = useState<number>(defaults?.steps ?? 2688)
  const [batchSize, setBatchSize] = useState<number>(defaults?.batch_size ?? 8)
  const [resizeSize, setResizeSize] = useState<number>(defaults?.resize_size ?? 768)
  const [learningRate, setLearningRate] = useState<number>(defaults?.learning_rate ?? 0.0003)
  const [resolution, setResolution] = useState<string>(defaults?.resolution ?? '[512, 1024]')

  const handleConfirm = useCallback(() => {
    const payload: AdminTrainingParams = {
      steps: Number(steps),
      batch_size: Number(batchSize),
      resize_size: Number(resizeSize),
      learning_rate: Number(learningRate),
      resolution: String(resolution)
    }
    onConfirm(payload)
  }, [batchSize, resizeSize, onConfirm, steps, learningRate, resolution])

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
            <Input id="steps" type="number" value={steps} step={64}
              onChange={(e) => setSteps(parseInt(e.target.value, 10))} min={2200} max={3000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch_size">Batch size</Label>
            <p className="text-[12px] text-muted-foreground">Lower produces better quality but slower training</p>
            <Input id="batch_size" type="number" value={batchSize} step={1}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))} min={4} max={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learning_rate">Learning rate</Label>
            <p className="text-[12px] text-muted-foreground">Lower produces better quality but slower training</p>
            <Input id="learning_rate" type="number" value={learningRate} step={0.0001}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))} min={0.00001} max={0.01} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resize_size">Resize size</Label>
            <Input id="resize_size" type="number" value={resizeSize} step={64}
              onChange={(e) => setResizeSize(parseInt(e.target.value, 10))} min={768} max={1024} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Input id="resolution" type="text" value={resolution}
              onChange={(e) => setResolution(e.target.value)} />
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


