import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { fields, targetLanguages, context } = await request.json()

    if (!fields || !targetLanguages || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Build the prompt
    const originalContent = fields
      .map((field: any) => `${field.key}: ${field.value}`)
      .join('\n')

    const prompt = `You are a professional translator for a photography app. ${context || ''}

Original content in English:
${originalContent}

Please provide accurate, natural-sounding translations for the following languages: ${targetLanguages.map((code: string) => languageNames[code]).join(', ')}.

Follow these guidelines:
1. Preserve the meaning while adapting to each language naturally
2. Maintain appropriate formality for a professional photography service
3. For languages like Chinese and Japanese, use appropriate counters/measure words
4. Keep technical terms consistent across languages
5. Do not translate brand names or technical photography terms that are commonly used in English

Return the translations in JSON format like this:
{
  "es": {
    "field_key": "translated_value"
  },
  "fr": {
    "field_key": "translated_value"
  }
}

Only include the languages requested. Make sure all field keys from the original content are translated.`

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

    // Extract the JSON from the response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format')
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const translations = JSON.parse(jsonMatch[0])

    // Validate that all requested languages are present
    for (const langCode of targetLanguages) {
      if (!translations[langCode]) {
        translations[langCode] = {}
      }
    }

    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate translations' },
      { status: 500 }
    )
  }
}