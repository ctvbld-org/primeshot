import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteS3Image } from '@/lib/s3';

// Admin-only endpoint to remove explore images
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify admin access
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('admin')
    .eq('id', user.id)
    .single();

  if (userError || userData?.admin !== true) {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get the image data before deleting (for S3 cleanup)
    const { data: exploreImage, error: fetchError } = await supabase
      .from('explore_images')
      .select('s3_path')
      .eq('id', id)
      .single();

    if (fetchError || !exploreImage) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('explore_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete image from database' },
        { status: 500 }
      );
    }

    // Delete S3 file
    const deleteResult = await deleteS3Image(exploreImage.s3_path);
    if (!deleteResult.success) {
      console.error('Warning: Failed to delete S3 file:', deleteResult.error);
      // Don't fail the whole operation if S3 delete fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in remove explore image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

