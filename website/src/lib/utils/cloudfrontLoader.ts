// Stub for website - returns a simple loader
export function makeCloudfrontLoader(prefix: string) {
  return ({ src }: { src: string }) => {
    if (src.startsWith('http')) return src
    return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''}/${prefix}/${src}`
  }
}

