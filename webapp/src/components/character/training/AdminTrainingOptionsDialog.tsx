'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogHeader } from '@primeshot/common/web/ui/dialog'
import { Label } from '@primeshot/common/web/ui/label'
import { Input } from '@primeshot/common/web/ui/input'
import { Button } from '@primeshot/common/web/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@primeshot/common/web/ui/select'

export interface AdminTrainingParams {
  batch_size: number
  gradient_accumulation_steps: number
  resize_size: number
  steps: number
  learning_rate: number
  resolution: number[]
  rank: number
  optimizer: 'adamw' | 'adamw8bit'
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
  const [gradientAccumulationSteps, setGradientAccumulationSteps] = useState<number>(defaults?.gradient_accumulation_steps ?? 1)
  const [resizeSize, setResizeSize] = useState<number>(defaults?.resize_size ?? 896)
  const [learningRate, setLearningRate] = useState<number>(defaults?.learning_rate ?? 0.0003)
  const [resolution, setResolution] = useState<string>(
    defaults?.resolution ? JSON.stringify(defaults.resolution) : '[768, 1024, 1536]'
  )
  const [rank, setRank] = useState<number>(defaults?.rank ?? 32)
  const [optimizer, setOptimizer] = useState<string>(defaults?.optimizer ?? 'adamw')

  const parseResolutionInput = (input: string): number[] => {
    try {
      const trimmed = input.trim()
      let arr: number[] = []
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) arr = parsed.map((v: any) => Number(v))
      } else if (trimmed.length > 0) {
        arr = trimmed.split(',').map((v) => Number(v.trim()))
      }
      // sanitize values to integers within expected bounds and multiples of 64
      const safe = arr
        .filter((v) => Number.isFinite(v))
        .map((v) => Math.floor(v))
        .filter((v) => v >= 512 && v <= 2048 && v % 64 === 0)
      return safe.length > 0 ? safe : [768, 1024, 1536]
    } catch (_e) {
      return [960]
    }
  }

  const handleConfirm = useCallback(() => {
    const parsedResolution = parseResolutionInput(resolution)
    const payload: AdminTrainingParams = {
      steps: Number(steps),
      batch_size: Number(batchSize),
      gradient_accumulation_steps: Number(gradientAccumulationSteps),
      resize_size: Number(resizeSize),
      learning_rate: Number(learningRate),
      resolution: parsedResolution,
      rank: Number(rank),
      optimizer: String(optimizer) as 'adamw' | 'adamw8bit'
    }
    onConfirm(payload)
  }, [
    steps,
    batchSize,
    gradientAccumulationSteps,
    resizeSize,
    learningRate,
    resolution,
    rank,
    optimizer,
    onConfirm
  ])

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
              onChange={(e) => setSteps(parseInt(e.target.value, 10))} min={2176} max={4096} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch_size">Batch size</Label>
            <p className="text-[12px] text-muted-foreground">Lower produces better quality but slower training</p>
            <Input id="batch_size" type="number" value={batchSize} step={1}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))} min={4} max={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradient_accumulation_steps">Gradient accumulation steps</Label>
            <Input id="gradient_accumulation_steps" type="number" value={gradientAccumulationSteps} step={1}
              onChange={(e) => setGradientAccumulationSteps(parseInt(e.target.value, 10))} min={1} max={2} />
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
          <div className="space-y-2">
            <Label htmlFor="rank">Rank</Label>
            <Input id="rank" type="number" value={rank} step={16}
              onChange={(e) => setRank(parseInt(e.target.value, 10))} min={16} max={256} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="optimizer">Optimizer</Label>
            <Select value={optimizer} onValueChange={(v) => setOptimizer(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select optimizer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adamw">AdamW</SelectItem>
                <SelectItem value="adamw8bit">AdamW8Bit</SelectItem>
              </SelectContent>
            </Select>
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


