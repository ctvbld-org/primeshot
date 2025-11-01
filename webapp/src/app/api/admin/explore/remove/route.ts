import { NextRequest, NextResponse } from 'next/server';
import { RemoveFromExploreResponse } from '@primeshot/common/types';
import { 
  requireAdmin, 
  deleteS3Image,
  updateStylePreviewImages
} from '@/lib/admin/explore-utils';

export async function DELETE(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const exploreImageId = searchParams.get('id');

    if (!exploreImageId) {
      return NextResponse.json<RemoveFromExploreResponse>(
        { success: false, error: 'exploreImageId is required' },
        { status: 400 }
      );
    }

    // Fetch explore image record
    const { data: exploreImage, error: fetchError } = await supabase
      .from('explore_images')
      .select('id, s3_path, category_id')
      .eq('id', exploreImageId)
      .single();

    if (fetchError || !exploreImage) {
      return NextResponse.json<RemoveFromExploreResponse>(
        { success: false, error: 'Explore image not found' },
        { status: 404 }
      );
    }

    // Extract filename and parse metadata for style_id
    const filename = exploreImage.s3_path.split('/').pop();
    
    // Since we no longer store style_id, we need to extract it from filename
    // Format: {style}__{scene}__{wardrobe}__{color}__{aspectRatio}__{resolution}.webp
    let styleId: string | null = null;
    if (filename) {
      const parts = filename.replace(/\.(webp|jpg|jpeg|png)$/i, '').split('__');
      const styleName = parts[0];
      
      // Look up style_id by name
      if (styleName) {
        const { data: style } = await supabase
          .from('styles')
          .select('id')
          .eq('name', styleName.replace(/-/g, ' '))
          .single();
        
        if (style) {
          styleId = style.id;
        }
      }
    }

    // Delete from S3
    const deleteResult = await deleteS3Image(exploreImage.s3_path);
    if (!deleteResult.success) {
      console.error('Failed to delete S3 image:', deleteResult.error);
      // Continue anyway to clean up database
    }

    // Remove from styles.preview_images if we found the style
    if (filename && styleId) {
      await updateStylePreviewImages(styleId, filename, 'remove');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('explore_images')
      .delete()
      .eq('id', exploreImageId);

    if (deleteError) {
      return NextResponse.json<RemoveFromExploreResponse>(
        { success: false, error: 'Failed to delete explore image record' },
        { status: 500 }
      );
    }

    return NextResponse.json<RemoveFromExploreResponse>({
      success: true
    });

  } catch (error) {
    console.error('Error in remove-from-explore:', error);
    return NextResponse.json<RemoveFromExploreResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

