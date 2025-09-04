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

export function buildSubjectPrompt(meta: any): { subject: string; pronoun: 'He' | 'She' | 'They' } {
  const gender = meta?.gender as string | undefined
  const age = meta?.age as string | undefined
  const eyeColor = meta?.eyes?.color as string | undefined
  const hairColor = meta?.hair?.color as string | undefined
  const hairLength = meta?.hair?.length as string | undefined
  const hairStyles: string[] = Array.isArray(meta?.hair?.styles) ? meta.hair.styles : []
  const hairTexture = meta?.hair?.texture as string | undefined
  const pronoun = buildPronoun(gender)

  const pieces: string[] = []
  const who = gender ? `The subject is a ${gender}` : 'A person'
  if (age) pieces.push(`${who} in ${age}`); else pieces.push(who)

  const hairBits: string[] = []
  if (hairLength) hairBits.push(hairLength)
  if (hairColor) hairBits.push(`${hairColor} hair`)
  let hairClause = hairBits.join(' ')
  //const styleList = safeJoin(hairStyles)
  //if (styleList) hairClause = hairClause ? `${hairClause}, ${styleList}` : styleList
  //if (hairTexture) hairClause = hairClause ? `${hairClause}, ${hairTexture}` : hairTexture
  if (hairClause) pieces.push(`with ${hairClause}`)

  // Build eyes and glasses seamlessly
  const hasWithClause = pieces.some(p => p.trim().startsWith('with '))
  const eyesPart = eyeColor ? `${hasWithClause ? 'and' : 'with'} ${eyeColor} eyes` : ''
  const glassesPresent = (meta?.glasses?.present === true) || (String(meta?.glasses?.present || '').toLowerCase() === 'true')
  const glassesStyles = Array.isArray(meta?.glasses?.style) ? (meta.glasses.style as string[]) : []
  const glassesText = glassesPresent ? (glassesStyles.length ? `with ${joinWithOr(glassesStyles)} glasses` : 'with glasses') : ''

  if (eyesPart && glassesText) pieces.push(`${eyesPart} ${glassesText}`)
  else if (eyesPart) pieces.push(eyesPart)
  else if (glassesText) pieces.push(glassesText)

  const sentence = pieces.join(' ').replace(/\s+/g, ' ').trim()
  const subject = sentence.endsWith('.') ? sentence : `${sentence}.`
  return { subject, pronoun }
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


