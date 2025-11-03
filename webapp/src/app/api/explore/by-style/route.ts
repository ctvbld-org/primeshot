import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/explore/by-style
 * Check which preview images exist in explore_images table
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { previewImages } = body;

    if (!previewImages || !Array.isArray(previewImages)) {
      return NextResponse.json(
        { error: 'previewImages array is required' },
        { status: 400 }
      );
    }

    // Build s3_path values to check (add placeholders/styles/ prefix)
    const s3Paths = previewImages.map(filename => {
      // If already has prefix, use as-is, otherwise add it
      return filename.startsWith('placeholders/styles/') 
        ? filename 
        : `placeholders/styles/${filename}`;
    });

    // Fetch explore images that match these paths
    const { data: images, error: imagesError } = await supabase
      .from('explore_images')
      .select('id, s3_path, created_at')
      .in('s3_path', s3Paths)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Error fetching explore images:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    // Format response
    const formattedImages = (images || []).map((img: any) => ({
      id: img.id,
      image: img.s3_path,
      createdAt: img.created_at,
    }));

    return NextResponse.json({
      images: formattedImages,
      total: formattedImages.length,
    });

  } catch (error) {
    console.error('Error in explore by-style API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

