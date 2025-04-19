/**
 * Utility function to convert option image filenames to S3 URLs using our app-images API proxy
 * This is used for background and outfit images in the options.json file
 * 
 * @param filename The image filename from options.json
 * @returns A full URL to the image via our app-images API proxy
 */
export function getOptionsImage(filename: string): string {
  // If already a full URL, return as is
  if (filename.startsWith('http')) return filename;
  
  // If no filename provided, return empty string
  if (!filename) return '';
  
  // Create the path for our S3 proxy
  // These images are stored in app-images/placeholders/options/
  const s3Path = `app-images/placeholders/options/${filename}`;
  
  // Get base URL from env or default to empty string (relative URL)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  // Return the full proxy URL
  return `${baseUrl}/api/app-images?path=${encodeURIComponent(s3Path)}`;
}

export default getOptionsImage; 