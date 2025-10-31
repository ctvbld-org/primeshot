import { NextRequest, NextResponse } from 'next/server';
import { BulkUpdateCategoryRequest, BulkUpdateCategoryResponse } from '@primeshot/common/types';
import { requireAdmin } from '@/lib/admin/explore-utils';

export async function PATCH(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const body: BulkUpdateCategoryRequest = await request.json();
    const { imageIds, categoryId } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json<BulkUpdateCategoryResponse>(
        { success: false, error: 'imageIds array is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json<BulkUpdateCategoryResponse>(
        { success: false, error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('explore_images')
      .update({ category_id: categoryId })
      .in('id', imageIds)
      .select('id');

    if (error) {
      return NextResponse.json<BulkUpdateCategoryResponse>(
        { success: false, error: 'Failed to bulk update categories' },
        { status: 500 }
      );
    }

    return NextResponse.json<BulkUpdateCategoryResponse>({
      success: true,
      updatedCount: data?.length || 0
    });

  } catch (error) {
    console.error('Error in bulk-update-category:', error);
    return NextResponse.json<BulkUpdateCategoryResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

