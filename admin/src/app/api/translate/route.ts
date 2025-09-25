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
      cn: 'Chinese',
      jp: 'Japanese',
    }

    // For each row, build the translation fields
    const translationResults: Record<string, Record<string, string>>[] = []
    for (const row of rows) {
      const fields = columns.map((col) => ({ key: col, value: row[col] }))
      const originalContent = fields.map((field) => `${field.key}: ${field.value}`).join('\n')
      const prompt = `You are a professional translator specializing in photography, fashion, and lifestyle content for Primeshot, a premium AI photography platform.

BRAND VOICE: Professional yet friendly, simple yet premium, playful yet trustworthy. Think of a talented photographer friend who is confident in their craft, approachable in tone, respectful of privacy, and lightly playful.

DOMAIN CONTEXT: You are translating content for a photography app that creates professional portraits and headshots. This includes:
- Photography style names (e.g., "Corporate", "Creative", "Lifestyle")
- Color names in fashion/photography context (e.g., "Dusty Pink" → "Rose poudré" not "Vieux Rose")
- Wardrobe and styling terminology
- Scene and setting descriptions
- Subscription and pricing content

TRANSLATION REQUIREMENTS:
1. ACCURACY: Preserve meaning while adapting to cultural context
2. NATURALNESS: Sound like a native speaker wrote it originally
3. BRAND CONSISTENCY: Maintain Primeshot's friendly-professional tone
4. DOMAIN EXPERTISE: Use proper photography/fashion terminology
5. CULTURAL ADAPTATION: Follow language-specific guidelines below

LANGUAGE-SPECIFIC GUIDELINES:
${guidelines}

SPECIAL ATTENTION FOR COLORS & STYLES:
- Color names should reflect fashion/beauty industry standards, not literal translations
- Use terms that fashion professionals and consumers would recognize
- Photography styles should sound professional yet accessible
- Avoid awkward literal translations - prioritize natural, industry-standard terms

COLOR TRANSLATION EXAMPLES (use these as reference for similar colors):
- "Dusty Pink" → French: "Rose poudré", Spanish: "Rosa suave", German: "Puderrosa", Italian: "Rosa cipria"
- "Dusty Rose" → French: "Rose poudré", Spanish: "Rosa suave", German: "Puderrosa", Italian: "Rosa antico"
- "Sage Green" → French: "Vert sauge", Spanish: "Verde salvia", German: "Salbeigrün", Italian: "Verde salvia"
- "Navy Blue" → French: "Bleu marine", Spanish: "Azul marino", German: "Marineblau", Italian: "Blu navy"
- "Cream" → French: "Crème", Spanish: "Crema", German: "Creme", Italian: "Crema"
- "Charcoal" → French: "Anthracite", Spanish: "Antracita", German: "Anthrazit", Italian: "Antracite"

AVOID these literal/awkward translations:
- "Vieux rose" (sounds dated in French)
- "Rosa empolvado" (too literal in Spanish)
- "Altrosa" (dated German term)
- Technical color codes or overly descriptive terms

Original content in English:
${originalContent}

Translate for: ${targetLanguages.map((code: string) => languageNames[code]).join(', ')}

QUALITY CHECKLIST before responding:
✓ Does it sound natural to native speakers?
✓ Does it maintain Primeshot's brand voice?
✓ Are color names using fashion industry standards (not literal translations)?
✓ Would a fashion professional recognize these color terms?
✓ Do the translations avoid dated or awkward terms?
✓ Is the tone consistent with the guidelines?
✓ Are all technical terms properly localized?

Return translations in JSON format:
{
  "es": {
    "field_key": "translated_value"
  },
  "fr": {
    "field_key": "translated_value"
  }
}

Only include requested languages. Ensure all field keys are translated with culturally appropriate, natural-sounding values.`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.5,
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