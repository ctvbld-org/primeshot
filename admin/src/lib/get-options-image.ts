/**
 * Utility function to convert option image filenames to S3 URLs using our app-images API proxy
 * 
 * @param filename The image filename
 * @returns A full URL to the image via our app-images API proxy
 */
export function getOptionsImage(filename: string): string {
  // If already a full URL, return as is
  if (filename.startsWith('http')) return filename;
  
  // If no filename provided, return empty string
  if (!filename) return '';
  
  // Return the full proxy URL
  return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/placeholders/options/${filename}`;
}

export default getOptionsImage; 

export function getSceneOptionImage(filename: string): string {
  if (!filename) return ''
  if (filename.startsWith('http')) return filename
  return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/placeholders/options/scenes/${filename}`
}

export function getWardrobeOptionImage(filename: string): string {
  if (!filename) return ''
  if (filename.startsWith('http')) return filename
  return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/placeholders/options/wardrobes/${filename}`
}