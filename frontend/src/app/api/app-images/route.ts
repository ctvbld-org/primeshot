import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API Route: /api/app-images
 * 
 * Generic proxy for accessing images from the app-images folder in S3.
 * Takes a path parameter for the S3 object and returns the image data directly.
 * Does not require authentication but validates paths for security.
 * Used for all application images including:
 * - Style preview images
 * - Background option thumbnails
 * - Outfit option thumbnails
 * - Other application assets
 * 
 * This approach is compatible with Next.js Image component.
 */
 
// S3 client configuration
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// This is a simple security check to prevent abuse
const isValidPath = (path: string) => {
  // Only allow paths in approved directories
  return (
    // Valid if the path is in any of these approved directories
    (
      path.startsWith('app-images/') || 
      path.startsWith('app-images/placeholders/') ||
      path.startsWith('app-images/placeholders/options/')
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
    
    // First generate a signed URL that we can fetch
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
      Key: path,
    });

    // Generate a short-lived signed URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    
    // Fetch the data from the signed URL
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to retrieve image: ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || getMimeType(path));
    headers.set('Content-Length', response.headers.get('Content-Length') || String(imageData.byteLength));
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Return the image data directly
    return new Response(imageData, { 
      headers,
      status: 200 
    });
    
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
} 