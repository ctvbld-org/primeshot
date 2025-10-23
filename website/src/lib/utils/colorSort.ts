// Stub for website
export function sortColorsByPalette(colors: any[]) {
  return colors
}

export function isLightColor(color: string): boolean {
  // Simple check - hex colors starting with f, e, d, c, b, a, 9, 8 are considered light
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

