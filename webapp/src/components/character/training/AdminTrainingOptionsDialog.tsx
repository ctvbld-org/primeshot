'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogHeader } from '@primeshot/common/web/ui/dialog'
import { Label } from '@primeshot/common/web/ui/label'
import { Input } from '@primeshot/common/web/ui/input'
import { Button } from '@primeshot/common/web/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@primeshot/common/web/ui/select'

export interface AdminTrainingParams {
  steps: number
  batch_size: number
  resize_size: number
  rank: number
  gradient_accumulation_steps: number
  learning_rate: number
  optimizer: 'adamw' | 'adamw8bit'
  resolution: number[]
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
  const [rank, setRank] = useState<number>(defaults?.rank ?? 16)
  const [gradientAccumulationSteps, setGradientAccumulationSteps] = useState<number>(defaults?.gradient_accumulation_steps ?? 1)
  const [learningRate, setLearningRate] = useState<number>(defaults?.learning_rate ?? 0.0003)
  const [optimizer, setOptimizer] = useState<'adamw' | 'adamw8bit'>(defaults?.optimizer ?? 'adamw')
  const [resolution, setResolution] = useState<string>(defaults?.resolution ? `[${defaults.resolution.join(', ')}]` : '[512, 1024]')

  const handleConfirm = useCallback(() => {
    // Parse resolution string like "[512, 1024]" to number array
    let parsedResolution: number[]
    try {
      parsedResolution = JSON.parse(resolution)
      if (!Array.isArray(parsedResolution) || !parsedResolution.every(n => typeof n === 'number')) {
        throw new Error('Invalid resolution format')
      }
    } catch {
      // Fallback to default if parsing fails
      parsedResolution = [512, 1024]
    }

    const payload: AdminTrainingParams = {
      steps: Number(steps),
      batch_size: Number(batchSize),
      resize_size: Number(resizeSize),
      rank: Number(rank),
      gradient_accumulation_steps: Number(gradientAccumulationSteps),
      learning_rate: Number(learningRate),
      optimizer: optimizer,
      resolution: parsedResolution
    }
    onConfirm(payload)
  }, [batchSize, resizeSize, rank, gradientAccumulationSteps, onConfirm, steps, learningRate, optimizer, resolution])

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
            <Label htmlFor="rank">Rank</Label>
            <p className="text-[12px] text-muted-foreground">LoRA rank - higher values capture more detail but use more memory</p>
            <Input id="rank" type="number" value={rank} step={1}
              onChange={(e) => setRank(parseInt(e.target.value, 10))} min={4} max={128} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradient_accumulation_steps">Gradient Accumulation Steps</Label>
            <p className="text-[12px] text-muted-foreground">Number of steps to accumulate gradients before updating</p>
            <Input id="gradient_accumulation_steps" type="number" value={gradientAccumulationSteps} step={1}
              onChange={(e) => setGradientAccumulationSteps(parseInt(e.target.value, 10))} min={1} max={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="optimizer">Optimizer</Label>
            <p className="text-[12px] text-muted-foreground">Optimization algorithm to use</p>
            <Select value={optimizer} onValueChange={(value: 'adamw' | 'adamw8bit') => setOptimizer(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adamw">AdamW</SelectItem>
                <SelectItem value="adamw8bit">AdamW 8-bit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <p className="text-[12px] text-muted-foreground">Training resolution as JSON array, e.g. [512, 1024]</p>
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


