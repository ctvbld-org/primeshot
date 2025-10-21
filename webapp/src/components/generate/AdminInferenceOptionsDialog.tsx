'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'
import { getApiUrl } from '@primeshot/common'

// JSON validation helper
const validateJson = (jsonString: string): { isValid: boolean; error?: string; parsed?: any } => {
  if (!jsonString.trim()) {
    return { isValid: true, parsed: {} }
  }

  try {
    const parsed = JSON.parse(jsonString)
    return { isValid: true, parsed }
  } catch (error: any) {
    let errorMessage = 'Invalid JSON format'

    if (error.message.includes('Unexpected token')) {
      errorMessage = 'Unexpected character found. Check for smart quotes or special characters.'
    } else if (error.message.includes('Expected')) {
      errorMessage = 'Missing expected character (comma, colon, bracket, or quote).'
    } else if (error.message.includes('Unterminated string')) {
      errorMessage = 'Missing closing quote in string.'
    }

    return { isValid: false, error: errorMessage }
  }
}

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
  const [jsonValid, setJsonValid] = useState<boolean>(true)
  const [jsonError, setJsonError] = useState<string>('')
  const { t } = useTranslation(['generate'])

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

  // Real-time JSON validation
  useEffect(() => {
    if (!settingsEnabled || !settingsJson.trim()) {
      setJsonValid(true)
      setJsonError('')
      return
    }

    const validation = validateJson(settingsJson)
    setJsonValid(validation.isValid)
    setJsonError(validation.error || '')
  }, [settingsJson, settingsEnabled])

  const handleConfirm = useCallback(() => {
    const prompt_override = enabled && prompt.trim() ? { enabled: true, prompt } : null
    let settings_override: Record<string, any> | null = null
    if (settingsEnabled) {
      const validation = validateJson(settingsJson)
      if (!validation.isValid) {
        alert(`Settings JSON is invalid: ${validation.error}`)
        console.error('JSON validation failed:', validation.error)
        console.error('Invalid JSON string:', settingsJson)
        return
      }
      settings_override = validation.parsed
    }
    onConfirm({ prompt_override, settings_override })
  }, [enabled, prompt, settingsEnabled, settingsJson, onConfirm])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent fullscreen className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.title')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Input className="flex-0" id="enable_settings_override" type="checkbox" checked={settingsEnabled} onChange={(e) => setSettingsEnabled(e.target.checked)} />
            <Label htmlFor="enable_settings_override">{t('admin.enableNodeOverrides')}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings_json">{t('admin.overridesJson')}</Label>
            <textarea
              id="settings_json"
              className={`w-full min-h-[220px] rounded-md border p-2 font-mono text-sm ${
                !jsonValid && settingsEnabled ? 'border-red-500 bg-red-50' : 'border-border bg-background/50'
              }`}
              placeholder='{"CharacterLora":{"strength_model":0.8,"strength_clip":0.8},"FilmGrain":{"grain_intensity":0.1}}'
              value={settingsJson}
              onChange={(e) => setSettingsJson(e.target.value)}
              disabled={!settingsEnabled}
            />
            {jsonError && settingsEnabled && (
              <p className="text-sm text-red-600 mt-1">{jsonError}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input className="flex-0" id="enable_override" type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <Label htmlFor="enable_override">{t('admin.enablePromptOverride')}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">{t('admin.prompt')}</Label>
            <textarea
              id="prompt"
              className="w-full min-h-[480px] rounded-md border border-border bg-background/50 p-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || !enabled}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.characterMetadata')}</Label>
            <pre className="w-full max-h-64 overflow-auto rounded-md border border-border bg-muted p-3 text-sm">
{JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t('buttons.cancel')}</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={enabled && !prompt.trim() || (settingsEnabled && !jsonValid)}
          >
            {t('buttons.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminInferenceOptionsDialog


