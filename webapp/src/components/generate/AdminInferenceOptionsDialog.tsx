'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'
import { getApiUrl } from '@/lib/api/client'

interface Props {
  open: boolean
  characterId: string
  styleId: string
  wardrobeId?: string
  sceneId?: string
  colorId?: string
  onCancel: () => void
  onConfirm: (overrides: { prompt_override: { enabled: boolean; prompt: string } | null; settings_override: Record<string, any> | null }) => void
}

export function AdminInferenceOptionsDialog({ open, characterId, styleId, wardrobeId, sceneId, colorId, onCancel, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [settingsEnabled, setSettingsEnabled] = useState(false)
  const [settingsJson, setSettingsJson] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(getApiUrl('/api/inference/prompt-preview'), {
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
    const prompt_override = enabled && prompt.trim() ? { enabled: true, prompt } : null
    let settings_override: Record<string, any> | null = null
    if (settingsEnabled) {
      try {
        const parsed = settingsJson.trim() ? JSON.parse(settingsJson) : {}
        settings_override = parsed && typeof parsed === 'object' ? parsed : null
      } catch {
        alert('Settings JSON is invalid')
        return
      }
    }
    onConfirm({ prompt_override, settings_override })
  }, [enabled, prompt, settingsEnabled, settingsJson, onConfirm])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent fullscreen className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Admin Inference Overrides</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Input className="flex-0" id="enable_settings_override" type="checkbox" checked={settingsEnabled} onChange={(e) => setSettingsEnabled(e.target.checked)} />
            <Label htmlFor="enable_settings_override">Enable node overrides (JSON by node title)</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings_json">Overrides JSON</Label>
            <textarea
              id="settings_json"
              className="w-full min-h-[220px] rounded-md border border-border bg-background/50 p-2 font-mono text-sm"
              placeholder='{"CharacterLora":{"strength_model":0.8,"strength_clip":0.8},"FilmGrain":{"grain_intensity":0.1}}'
              value={settingsJson}
              onChange={(e) => setSettingsJson(e.target.value)}
              disabled={!settingsEnabled}
            />
          </div>
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


