const DIST = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''

const STYLE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const
const OPTION_WIDTHS = [320, 640, 960] as const

function pickNearest(widths: readonly number[], requested: number): number {
  return widths.reduce((best, w) =>
    Math.abs(w - requested) < Math.abs(best - requested) ? w : best, widths[0])
}

function ensureWebpBase(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot === -1 ? name : name.slice(0, dot)
  return `${base}.webp`
}

export function makeCloudfrontLoader(prefix: string) {
  const widths = prefix.includes('/styles') ? STYLE_WIDTHS : OPTION_WIDTHS
  const baseWidth = widths[widths.length - 1]

  return ({ src, width }: { src: string; width: number; quality?: number }) => {
    const base = ensureWebpBase(src)
    const nearest = pickNearest(widths, width)
    const needsVariant = nearest < baseWidth
    const name = needsVariant ? base.replace(/\.webp$/, `-w${nearest}.webp`) : base
    return `${DIST}/${prefix}/${name}`
  }
}


