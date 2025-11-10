import { getApiUrl } from '@primeshot/common/lib/api/client';
import { generateShortCode } from './short-code';

interface ShareImageOptions {
  imageUrl: string;
  jobMetadata: {
    styleId?: string;
    sceneId?: string;
    wardrobeId?: string;
    colorId?: string;
    quality?: string;
    aspectRatio?: string;
  };
  t: (key: string, options?: { url?: string }) => string;
}

interface ShareResult {
  success: boolean;
  method?: 'native' | 'native-text' | 'clipboard';
  cancelled?: boolean;
}

/**
 * Share a generated image with promotional text and short link
 * Uses Web Share API when available, falls back to clipboard
 * Only creates DB entry after successful share
 * 
 * @param options Share configuration including image URL, metadata, and translation function
 * @returns Result indicating success and method used
 */
export async function shareImage(options: ShareImageOptions): Promise<ShareResult> {
  const { imageUrl, jobMetadata, t } = options;
  
  try {
    // Step 1: Generate short code locally (no DB entry yet)
    const shortCode = generateShortCode(6);
    
    // Use NEXT_PUBLIC_WEBSITE_URL for root domain (without /create)
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || window.location.origin.replace(/\/create$/, '');
    const shareUrl = `${baseUrl}/s/${shortCode}`;
    
    // Step 2: Build share text with short URL
    const shareText = t('thumbnail.share.text', { url: shareUrl });
    
    let shareMethod: 'native' | 'native-text' | 'clipboard' | null = null;
    
    // Step 3: Try Web Share API with image
    if (navigator.share && navigator.canShare) {
      try {
        // Fetch image as blob
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        const file = new File([blob], 'primeshot-creation.png', { type: 'image/png' });
        
        // Try sharing with file
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            text: shareText,
            files: [file]
          });
          shareMethod = 'native';
        } else {
          // Share text + URL only (some platforms don't support file sharing)
          await navigator.share({
            text: shareText,
            url: shareUrl
          });
          shareMethod = 'native-text';
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled - no DB entry created, nothing to clean up
          return { success: false, cancelled: true };
        }
        // Fall through to clipboard fallback
        console.warn('Web Share API failed, falling back to clipboard:', error);
      }
    }
    
    // Fallback: Copy text to clipboard
    if (!shareMethod) {
      await navigator.clipboard.writeText(shareText);
      shareMethod = 'clipboard';
    }
    
    // Step 4: Share succeeded! Now create the DB entry
    try {
      const response = await fetch(getApiUrl('/api/share/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobMetadata,
          shortCode, // Pass the pre-generated code
          imageUrl   // Pass image URL for signed URL generation
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to save share link to database, but share succeeded');
      }
    } catch (dbError) {
      // Share succeeded but DB save failed - not critical, just log it
      console.warn('Failed to save share link to database:', dbError);
    }
    
    return { success: true, method: shareMethod };
    
  } catch (error) {
    console.error('Share error:', error);
    throw error;
  }
}


