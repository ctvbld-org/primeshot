'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@primeshot/common/web/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@primeshot/common/web/ui/tabs'
import { Button } from '@primeshot/common/web/ui/button'
import { Textarea } from '@primeshot/common/web/ui/textarea'
import { Label } from '@primeshot/common/web/ui/label'
import { Badge } from '@primeshot/common/web/ui/badge'
import { toast } from 'sonner'
import { Languages, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TranslationField {
  key: string
  value: string
}

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableName: string
  recordId: string
  fields: TranslationField[]
  currentTranslations: Record<string, any>
  onSuccess: () => void
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'nl', name: 'Dutch' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
]

export function TranslationDialog({
  open,
  onOpenChange,
  tableName,
  recordId,
  fields,
  currentTranslations,
  onSuccess,
}: TranslationDialogProps) {
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(
    currentTranslations || {}
  )
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const supabase = createClient()

  const translateMutation = useMutation({
    mutationFn: async () => {
      if (selectedLanguages.length === 0) {
        throw new Error('Please select at least one language')
      }

      // Call the translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          targetLanguages: selectedLanguages,
          context: `Translating for ${tableName} in a photography app`,
        }),
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      return data.translations
    },
    onSuccess: (newTranslations) => {
      setTranslations(newTranslations)
      toast.success('Translations generated successfully')
    },
    onError: (error) => {
      toast.error('Failed to generate translations: ' + error.message)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(tableName)
        .update({ translations })
        .eq('id', recordId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Translations saved successfully')
      onSuccess()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to save translations: ' + error.message)
    },
  })

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    )
  }

  const handleTranslationChange = (langCode: string, field: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [langCode]: {
        ...prev[langCode],
        [field]: value,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Translations</DialogTitle>
          <DialogDescription>
            Generate and edit translations for different languages
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Language Selection */}
          <div className="mb-4">
            <Label className="mb-2 block">Select languages to translate:</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Badge
                  key={lang.code}
                  variant={selectedLanguages.includes(lang.code) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLanguage(lang.code)}
                >
                  {translations[lang.code] && <Check className="mr-1 h-3 w-3" />}
                  {lang.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Original Content */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Original Content (English)</h4>
            {fields.map((field) => (
              <div key={field.key} className="mb-2">
                <Label className="text-sm">{field.key}:</Label>
                <p className="text-sm">{field.value || <em>Empty</em>}</p>
              </div>
            ))}
          </div>

          {/* Translations */}
          <Tabs defaultValue={LANGUAGES[0].code}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8">
              {LANGUAGES.map((lang) => (
                <TabsTrigger key={lang.code} value={lang.code}>
                  {lang.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {LANGUAGES.map((lang) => (
              <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                {fields.map((field) => (
                  <div key={field.key}>
                    <Label>{field.key}</Label>
                    <Textarea
                      value={translations[lang.code]?.[field.key] || ''}
                      onChange={(e) =>
                        handleTranslationChange(lang.code, field.key, e.target.value)
                      }
                      placeholder={`Enter ${lang.name} translation for ${field.key}`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => translateMutation.mutate()}
            disabled={translateMutation.isPending || selectedLanguages.length === 0}
          >
            {translateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Generate Translations
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Translations'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}