import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { formatTranslations, formatTranslationsBatch } from '@/lib/utils'
import fs from 'fs'
import path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Config: which columns to translate for each table
const translationColumns: Record<string, string[]> = {
  styles: ['name'],
  wardrobe: ['label'],
  scene: ['label'],
  color: ['label'],
  credit_packs: ['name', 'description'],
  subscriptions: ['display_name', 'description'],
}

// Load professional translation guidelines (sync at startup)
const guidelinesPath = path.resolve(process.cwd(), '.cursor/rules/professional-translation-guidelines.md')
let guidelines = ''
try {
  guidelines = fs.readFileSync(guidelinesPath, 'utf8')
} catch (e) {
  guidelines = ''
}

export async function POST(request: NextRequest) {
  try {
    const { table, rows, targetLanguages } = await request.json()

    if (!table || !rows || !Array.isArray(rows) || !targetLanguages || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const columns = translationColumns[table]
    if (!columns) {
      return NextResponse.json(
        { error: 'Unknown table or no translation columns defined' },
        { status: 400 }
      )
    }

    // Create a mapping of language codes to full names
    const languageNames: Record<string, string> = {
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      pt: 'Portuguese',
      de: 'German',
      nl: 'Dutch',
      zh: 'Chinese',
      ja: 'Japanese',
    }

    // For each row, build the translation fields
    const translationResults: Record<string, Record<string, string>>[] = []
    for (const row of rows) {
      const fields = columns.map((col) => ({ key: col, value: row[col] }))
      const originalContent = fields.map((field) => `${field.key}: ${field.value}`).join('\n')
      const prompt = `You are a professional translator for a photography app.\n\n${guidelines}\n\nOriginal content in English:\n${originalContent}\n\nPlease provide accurate, natural-sounding translations for the following languages: ${targetLanguages.map((code: string) => languageNames[code]).join(', ')}.\n\nReturn the translations in JSON format like this:\n{\n  \"es\": {\n    \"field_key\": \"translated_value\"\n  },\n  \"fr\": {\n    \"field_key\": \"translated_value\"\n  }\n}\nOnly include the languages requested. Make sure all field keys from the original content are translated.`

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response format')
      }
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const translations = JSON.parse(jsonMatch[0])
      // Validate all requested languages are present
      for (const langCode of targetLanguages) {
        if (!translations[langCode]) {
          translations[langCode] = {}
        }
      }
      translationResults.push(translations)
    }

    // Format the translations for each row
    const formatted = formatTranslationsBatch(rows, columns, translationResults)
    return NextResponse.json({ translations: formatted })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate translations' },
      { status: 500 }
    )
  }
}