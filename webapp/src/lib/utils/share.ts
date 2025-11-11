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
 * Creates DB entry and public image copy FIRST, then shares the public image
 * 
 * @param options Share configuration including image URL, metadata, and translation function
 * @returns Result indicating success and method used
 */
export async function shareImage(options: ShareImageOptions): Promise<ShareResult> {
  const { imageUrl, jobMetadata, t } = options;
  
  try {
    // Step 1: Generate short code locally
    const shortCode = generateShortCode(6);
    
    // Use NEXT_PUBLIC_WEBSITE_URL for root domain (without /create)
    let baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || window.location.origin.replace(/\/create$/, '');
    // Remove trailing slash to prevent double slashes
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const shareUrl = `${baseUrl}/s/${shortCode}`;
    
    // Step 2: Create DB entry and get public image URL FIRST
    let publicImageUrl: string | null = null;
    try {
      const response = await fetch(getApiUrl('/api/share/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobMetadata,
          shortCode, // Pass the pre-generated code
          imageUrl   // Pass image URL for copying to public S3
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        publicImageUrl = data.publicImageUrl; // Get the public image URL from API
        console.log('Public image URL created:', publicImageUrl);
      } else {
        console.warn('Failed to create share link, continuing with original image');
      }
    } catch (dbError) {
      console.warn('Failed to create share link:', dbError);
    }
    
    // Step 3: Build share text with short URL
    const shareText = t('thumbnail.share.text', { url: shareUrl });
    
    // Use public image URL if available, otherwise fall back to original
    const imageToShare = publicImageUrl || imageUrl;
    
    let shareMethod: 'native' | 'native-text' | 'clipboard' | null = null;
    
    // Step 4: Try Web Share API with image
    if (navigator.share && navigator.canShare) {
      try {
        // Fetch image as blob
        const imageResponse = await fetch(imageToShare);
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
          // User cancelled - DB entry already created but that's okay
          return { success: false, cancelled: true };
        }
        // Fall through to clipboard fallback
        console.warn('Web Share API failed, falling back to clipboard:', error);
      }
    }
    
    // Fallback: Copy public image URL + text to clipboard
    if (!shareMethod) {
      // For desktop Slack/Discord, copy the direct image URL so it embeds as an image
      const clipboardText = publicImageUrl 
        ? `${shareText}\n\n${publicImageUrl}` // Image URL for embedding
        : shareText; // Fall back to just text with share link
      
      await navigator.clipboard.writeText(clipboardText);
      shareMethod = 'clipboard';
    }
    
    return { success: true, method: shareMethod };
    
  } catch (error) {
    console.error('Share error:', error);
    throw error;
  }
}


