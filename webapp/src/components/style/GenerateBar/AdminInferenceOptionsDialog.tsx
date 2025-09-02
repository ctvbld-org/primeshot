'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'

interface Props {
  open: boolean
  characterId: string
  styleId: string
  wardrobeId?: string
  sceneId?: string
  colorId?: string
  onCancel: () => void
  onConfirm: (override: { enabled: boolean; prompt: string } | null) => void
}

export function AdminInferenceOptionsDialog({ open, characterId, styleId, wardrobeId, sceneId, colorId, onCancel, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/inference/prompt-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: characterId, style_id: styleId, wardrobe_id: wardrobeId, scene_id: sceneId, color_id: colorId })
        })
        const data = await res.json()
        setPrompt(data.prompt || '')
        setMetadata(data.metadata || null)
      } catch (e) {
        // silent
      } finally {
        setLoading(false)
      }
    })()
  }, [open, characterId, styleId, wardrobeId, sceneId])

  const handleConfirm = useCallback(() => {
    if (enabled) {
      onConfirm({ enabled: true, prompt })
    } else {
      onConfirm(null)
    }
  }, [enabled, prompt, onConfirm])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent fullscreen className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Admin Inference Overrides</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Input className="flex-0" id="enable_override" type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <Label htmlFor="enable_override">Enable prompt override</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <textarea
              id="prompt"
              className="w-full min-h-[480px] rounded-md border border-border bg-background/50 p-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || !enabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Character metadata (read-only)</Label>
            <pre className="w-full max-h-64 overflow-auto rounded-md border border-border bg-muted p-3 text-sm">
{JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={enabled && !prompt.trim()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminInferenceOptionsDialog


