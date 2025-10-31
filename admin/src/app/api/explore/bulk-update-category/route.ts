import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { imageIds, categoryId } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image IDs required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID required' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from('explore_images')
      .update({
        category_id: categoryId,
        updated_at: new Date().toISOString()
      })
      .in('id', imageIds);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: count || imageIds.length
    });
  } catch (error) {
    console.error('Error bulk updating explore images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

