import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3';
import { createClient } from '@/lib/supabase/server';

/**
 * API route for proxying S3 image requests through our server
 * This is used for:
 * - Background thumbnails
 * - Clothing option thumbnails
 * - Generated headshots
 * - Website images (example selfies, etc.)
 */

// This is a simple security check to prevent abuse
const isValidPath = (path: string) => {
  // Only allow paths in approved directories
  return (
    // Valid if the path is in any of these approved directories
    (
      path.startsWith('app-images/') ||
      path.startsWith('app-images/placeholders/') ||
      path.startsWith('app-images/placeholders/options/') ||
      path.startsWith('website-images/') || // Allow website images
      path.startsWith('user-images/') // Allow user-generated inference images
    ) &&
    // AND has a valid file extension
    /\.(jpg|jpeg|png|webp|svg)$/i.test(path)
  );
};

// Helper to convert mime types
const getMimeType = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

export async function GET(request: Request) {
  try {
    // Get path from query string
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }
    
    if (!isValidPath(path)) {
      return NextResponse.json({ error: 'Invalid path parameter' }, { status: 400 });
    }

    // For user-images, verify authentication and authorization
    if (path.startsWith('user-images/')) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify the user has access to this image
      // Extract user_id from the path (format: user-images/{user_id}/...)
      const pathParts = path.split('/');
      if (pathParts[1] !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // First generate a signed URL that we can fetch
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: path,
    });

    // Generate a short-lived signed URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    
    // Fetch the data from the signed URL with retry (up to 3 attempts, backoff)
    const tryFetch = async (url: string, attempts = 3): Promise<Response> => {
      let lastErr: any = null;
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) return res;
          lastErr = new Error(res.statusText || `HTTP ${res.status}`);
        } catch (e) {
          lastErr = e;
        }
        // simple exponential backoff: 200ms, 400ms
        const delayMs = 200 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delayMs));
      }
      throw lastErr || new Error('Unknown fetch error');
    };

    const response = await tryFetch(signedUrl, 3);
    
    // Propagate S3 entity tags for conditional caching
    const s3ETag = response.headers.get('ETag') || response.headers.get('etag') || undefined;
    const ifNoneMatch = request.headers.get('if-none-match') || undefined;

    // Cache-control: public for app-images and website-images (static assets), private for user-images
    const isUserImage = path.startsWith('user-images/');
    const cacheControl = isUserImage
      ? 'private, max-age=31536000, immutable, stale-while-revalidate=86400'
      : 'public, max-age=31536000, immutable, stale-while-revalidate=86400';

    // If client already has this version, return 304 Not Modified
    if (s3ETag && ifNoneMatch && ifNoneMatch.replace(/"/g, '') === s3ETag.replace(/"/g, '')) {
      const h = new Headers();
      h.set('ETag', s3ETag);
      h.set('Cache-Control', cacheControl);
      h.set('Content-Type', response.headers.get('Content-Type') || getMimeType(path));
      return new Response(null, { status: 304, headers: h });
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Set appropriate headers (force correct mime type based on requested path)
    const headers = new Headers();
    headers.set('Content-Type', getMimeType(path));
    headers.set('Content-Length', String(imageData.byteLength));
    headers.set('Cache-Control', cacheControl);
    if (s3ETag) headers.set('ETag', s3ETag);
    const lastMod = response.headers.get('Last-Modified') || response.headers.get('last-modified');
    if (lastMod) headers.set('Last-Modified', lastMod);
    // Ensure inline display in browsers/devtools
    try {
      const filename = path.split('/').pop() || 'image';
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    } catch {}
    
    // Return the image data directly
    return new Response(imageData, { 
      headers,
      status: 200 
    });
    
  } catch (error) {
    console.error('Error proxying image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to proxy image', 
      message: errorMessage 
    }, { status: 500 });
  }
} 