import { NextRequest, NextResponse } from 'next/server';
import { UpdateExploreImageRequest, UpdateExploreImageResponse } from '@primeshot/common/types';
import { requireAdmin } from '@/lib/admin/explore-utils';

export async function PATCH(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const body: UpdateExploreImageRequest = await request.json();
    const { id, categoryId, aspectRatio, resolution } = body;

    if (!id) {
      return NextResponse.json<UpdateExploreImageResponse>(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (aspectRatio !== undefined) updates.aspect_ratio = aspectRatio;
    if (resolution !== undefined) updates.resolution = resolution;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<UpdateExploreImageResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: exploreImage, error: updateError } = await supabase
      .from('explore_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !exploreImage) {
      return NextResponse.json<UpdateExploreImageResponse>(
        { success: false, error: 'Failed to update explore image' },
        { status: 500 }
      );
    }

    return NextResponse.json<UpdateExploreImageResponse>({
      success: true,
      exploreImage
    });

  } catch (error) {
    console.error('Error in update-explore-image:', error);
    return NextResponse.json<UpdateExploreImageResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

