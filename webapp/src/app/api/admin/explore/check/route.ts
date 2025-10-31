import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/explore-utils';

interface CheckExploreResponse {
  success: boolean;
  isInExplore: boolean;
  exploreImageId?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const generatedImageId = searchParams.get('generatedImageId');

    if (!generatedImageId) {
      return NextResponse.json<CheckExploreResponse>(
        { success: false, isInExplore: false, error: 'generatedImageId is required' },
        { status: 400 }
      );
    }

    const { data: exploreImage, error } = await supabase
      .from('explore_images')
      .select('id')
      .eq('generated_image_id', generatedImageId)
      .maybeSingle();

    if (error) {
      return NextResponse.json<CheckExploreResponse>(
        { success: false, isInExplore: false, error: 'Failed to check explore status' },
        { status: 500 }
      );
    }

    return NextResponse.json<CheckExploreResponse>({
      success: true,
      isInExplore: !!exploreImage,
      exploreImageId: exploreImage?.id
    });

  } catch (error) {
    console.error('Error in check-explore:', error);
    return NextResponse.json<CheckExploreResponse>(
      { success: false, isInExplore: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

