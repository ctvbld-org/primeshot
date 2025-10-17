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
  if (g.startsWith('male') || g === 'man' || g === 'boy' || g === 'm') return 'He'
  if (g.startsWith('female') || g === 'woman' || g === 'girl' || g === 'f') return 'She'
  return 'They'
}

function pickRandom<T>(items: T[]): T | undefined {
  if (!items || items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Builds a compact subject phrase like:
 *  - "woman, early 20s, blond hair with blue eyes"
 *  - "woman, late 20s, long brown hair"
 * Does not include trailing punctuation.
 */
export function buildSubjectCompact(meta: any): string {
  const gender = (meta?.gender || '').toString().trim()
  const age = (meta?.age || '').toString().trim()
  const base = gender || 'subject'
  const bodyType = (meta?.body_type || '').toString().trim()
  const skinTone = (meta?.skin_tone || '').toString().trim()
  const eyesColor = (meta?.eyes?.color || '').toString().trim()
  const hair = meta?.hair.present === "false" ? false : meta?.hair
  const ethnicity = (meta?.ethnicity || '').toString().trim()
  let phrase = base

  if (ethnicity.includes('Black') || ethnicity.includes('African')) {
    phrase = `${ethnicity} ${base}`
  }

  if (age) phrase = `${phrase}, ${age}`

  if (eyesColor) {
    let eyesPhrase = `${eyesColor} eyes`
    const glassesPresent = (meta?.glasses?.present === "true") || (String(meta?.glasses?.present || '').toLowerCase() === 'true')
    if (glassesPresent) {
      const styles = Array.isArray(meta?.glasses?.style) ? (meta.glasses.style as string[]) : []
      const stylesText = joinWithOr(styles)
      eyesPhrase = stylesText ? `${eyesPhrase} with ${stylesText} glasses` : `${eyesPhrase} with glasses`
    }
    phrase = `${phrase}, ${eyesPhrase}`
  }

  if (hair) {
    const length = (hair.length || '').toString().trim()
    const color = (hair.color || '').toString().trim()
    const texture = (hair.texture || '').toString().trim()
    const styles = Array.isArray(hair.styles) ? hair.styles as string[] : []
    //const hairstyle = joinWithOr(styles)

    //phrase = `${phrase}, ${length} ${texture} ${color} hair that are styled as ${hairstyle}`
    phrase = `${phrase}, ${color} hair`
  }

  if (bodyType) phrase = `${phrase}, ${bodyType}`
  //if (skinTone) phrase = `${phrase}, ${skinTone}`

  return phrase.replace(/\s+/g, ' ').trim()
}


/**
 * Builds head covering description to be appended to wardrobe text.
 * Returns text like "and with a pink hijab" or "and with an orange patterned turban"
 * that can be naturally added to wardrobe descriptions.
 */
/**
 * Adds the appropriate article ("a" or "an") before a color value.
 * Returns the color with the correct article prefix.
 * @example addArticleToColor("red") => "a red"
 * @example addArticleToColor("orange") => "an orange"
 */
export function addArticleToColor(colorValue: string): string {
  if (!colorValue || typeof colorValue !== 'string') return colorValue
  const trimmed = colorValue.trim()
  if (!trimmed) return colorValue
  
  const needsAn = /^[aeiou]/i.test(trimmed)
  const article = needsAn ? 'an' : 'a'
  
  return `${article} ${trimmed}`
}

export function buildHeadCoveringForWardrobe(meta: any): string {
  const present = (meta?.head_covering?.present === true) || (String(meta?.head_covering?.present || '').toLowerCase() === 'true')
  if (!present) return ''
  
  const styles = Array.isArray(meta?.head_covering?.style) ? meta.head_covering.style as string[] : []
  const colors = Array.isArray(meta?.head_covering?.color) ? meta.head_covering.color as string[] : []
  const pattern = (meta?.head_covering?.pattern || '').toString().trim()
  
  const stylesText = joinWithOr(styles)
  
  // Deduplicate colors, count frequency, sort by frequency, limit to 3
  let processedColors: string[] = []
  if (colors.length > 0) {
    const colorCounts = new Map<string, number>()
    colors.forEach(color => {
      const normalized = color.toLowerCase().trim()
      if (normalized) {
        colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1)
      }
    })
    
    // Sort by frequency (descending), then alphabetically
    processedColors = Array.from(colorCounts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1] // Sort by count descending
        return a[0].localeCompare(b[0]) // Then alphabetically
      })
      .slice(0, 3) // Max 3 colors
      .map(([color]) => color)
  }
  
  const colorsText = joinWithOr(processedColors)
  
  let description = ''
  
  // Build color + pattern part
  // if (colorsText && pattern && pattern !== 'none') {
  //   description = `${colorsText} ${pattern}`
  // } else if (colorsText) {
  //   description = colorsText
  // } else if (pattern && pattern !== 'none') {
  //   description = pattern
  // }
  
  // Add style type
  if (stylesText) {
    description = description ? `${description} ${stylesText}` : stylesText
  } else {
    description = description ? `${description} head covering` : 'head covering'
  }
  
  // Return with proper article (a/an)
  const needsAn = /^[aeiou]/i.test(description)
  const article = needsAn ? 'an' : 'a'
  
  return `and with ${article} ${description}`
}

export function buildFinalPrompt(parts: { style?: string; subject?: string; hair?: string; glasses?: string; wardrobe?: string; scene?: string }): string {
  const lines: string[] = []
  if (parts.style) lines.push(parts.style)
  if (parts.subject) lines.push(parts.subject)
  if (parts.hair) lines.push(parts.hair)
  if (parts.glasses) lines.push(parts.glasses)
  if (parts.wardrobe) lines.push(parts.wardrobe)
  if (parts.scene) lines.push(parts.scene)
  return lines.join('\n')
}


/**
 * Fill a complete style prompt template supporting placeholders: [subject], [scene], [wardrobe], [atmosphere].
 * - subject: compact phrase like "woman, blond hair with blue eyes"
 * - scene: uses provided scene prompt
 * - wardrobe: uses provided wardrobe prompt (with color already applied by caller)
 *   Note: Head covering is automatically appended to wardrobe if present in metadata
 * - atmosphere: uses provided atmosphere description from scene
 * Applies light cleanup to avoid artifacts when optional values are missing (e.g., "with ,").
 */
export function fillStylePrompt(
  template: string,
  args: { meta: any; wardrobe?: string; scene?: string; atmosphere?: string }
): string {
  try {
    const meta = args?.meta || {}
    const subjectText = buildSubjectCompact(meta)

    const sceneText = String(args?.scene ?? '')
    let wardrobeText = String(args?.wardrobe ?? '')
    const atmosphereText = String(args?.atmosphere ?? '')

    // Append head covering to wardrobe if present
    // Format: "Wearing [wardrobe], and with a pink hijab"
    const headCoveringText = buildHeadCoveringForWardrobe(meta)
    if (headCoveringText) {
      if (wardrobeText) {
        wardrobeText = `${wardrobeText}, ${headCoveringText}`
      } else {
        // If no wardrobe but head covering exists, strip "and with" prefix
        wardrobeText = headCoveringText.replace(/^and with /, 'with ')
      }
    }

    let result = String(template || '')

    const replacements: Record<string, string> = {
      subject: subjectText,
      scene: sceneText,
      wardrobe: wardrobeText,
      atmosphere: atmosphereText,
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


