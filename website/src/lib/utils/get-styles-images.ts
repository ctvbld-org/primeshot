// Stub for website
export function getStyleImages(images: (string | undefined)[]): string[] {
  return images.filter((img): img is string => !!img)
}

