export function safeJoin(list: string[]): string {
  const items = (list || []).filter(Boolean)
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function joinWithOr(list: string[]): string {
  const items = (list || []).filter(Boolean)
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} or ${items[1]}`
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

export function buildPronoun(gender?: string | null): 'He' | 'She' | 'They' {
  const g = (gender || '').toLowerCase()
  if (g.startsWith('male') || g === 'man' || g === 'm') return 'He'
  if (g.startsWith('female') || g === 'woman' || g === 'f') return 'She'
  return 'They'
}

/**
 * Builds a compact subject phrase like:
 *  - "woman, early 20s, blond hair with blue eyes"
 *  - "woman, late 20s, long brown hair"
 * Does not include trailing punctuation, age, or glasses.
 */
export function buildSubjectCompact(meta: any): string {
  const gender = (meta?.gender || '').toString().trim()
  const age = (meta?.age || '').toString().trim()
  const base = gender || 'subject'

  const hairColor = (meta?.hair?.color || '').toString().trim()
  const eyesColor = (meta?.eyes?.color || '').toString().trim()

  let phrase = base

  if (age) phrase = `${phrase}, ${age}`

  const hairParts: string[] = []
  if (hairColor) hairParts.push(`${hairColor} hair`)
  const hairText = hairParts.join(' ')
  if (hairText) phrase = `${phrase}, ${hairText}`

  if (eyesColor) phrase = `${phrase} with ${eyesColor} eyes`

  return phrase.replace(/\s+/g, ' ').trim()
}

export function buildGlassesPrompt(meta: any): string {
  const present = (meta?.glasses?.present === true) || (String(meta?.glasses?.present || '').toLowerCase() === 'true')
  if (!present) return ''
  const styles = Array.isArray(meta?.glasses?.style) ? meta.glasses.style as string[] : []
  const stylesText = joinWithOr(styles)
  if (!stylesText) return 'Subject has glasses.'
  return `Subject has ${stylesText} glasses.`
}

export function buildFinalPrompt(parts: { style?: string; subject?: string; glasses?: string; wardrobe?: string; scene?: string }): string {
  const lines: string[] = []
  if (parts.style) lines.push(parts.style)
  if (parts.subject) lines.push(parts.subject)
  if (parts.glasses) lines.push(parts.glasses)
  if (parts.wardrobe) lines.push(parts.wardrobe)
  if (parts.scene) lines.push(parts.scene)
  return lines.join('\n')
}


/**
 * Fill a complete style prompt template supporting placeholders: [subject], [scene], [wardrobe].
 * - subject: compact phrase like "woman, blond hair with blue eyes"
 * - scene: uses provided scene prompt
 * - wardrobe: uses provided wardrobe prompt (with color already applied by caller)
 * Applies light cleanup to avoid artifacts when optional values are missing (e.g., "with ,").
 */
export function fillStylePrompt(
  template: string,
  args: { meta: any; wardrobe?: string; scene?: string }
): string {
  try {
    const meta = args?.meta || {}
    const subjectText = buildSubjectCompact(meta)

    const sceneText = String(args?.scene ?? '')
    const wardrobeText = String(args?.wardrobe ?? '')

    let result = String(template || '')

    const replacements: Record<string, string> = {
      subject: subjectText,
      scene: sceneText,
      wardrobe: wardrobeText,
    }

    for (const key of Object.keys(replacements)) {
      const value = replacements[key] ?? ''
      const re = new RegExp(`\\[${key}\\]`, 'g')
      result = result.replace(re, value)
    }

    // Cleanup common artifacts when optional placeholders are empty
    // Remove sequences like "with ," that appear when [eyes] is empty in "with [eyes],"
    result = result.replace(/\bwith\s*,/gi, '')
    // Remove "Wearing ." if wardrobe is empty
    result = result.replace(/\bWearing\s*\./g, '')
    // Fix stray double spaces before punctuation
    result = result.replace(/\s+([,\.])/g, '$1')
    // Collapse multiple spaces
    result = result.replace(/\s{2,}/g, ' ').trim()

    return result
  } catch (_e) {
    // Fail-safe: return template unchanged on unexpected errors
    return String(template || '')
  }
}


