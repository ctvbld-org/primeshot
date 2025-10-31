import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, categoryId } = body;

    if (!id || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('explore_images')
      .update({
        category_id: categoryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating explore image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

