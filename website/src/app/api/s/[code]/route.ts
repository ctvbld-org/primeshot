import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExploreImageFilename } from '@/lib/utils/parse-explore-image-metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient();
    const { code } = await params;
    
    // Get the origin from the request (works in both local and production)
    const origin = request.nextUrl.origin;
    
    // First, try to find in share_links (for user-shared images)
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('*')
      .eq('short_code', code)
      .maybeSingle();
    
    if (shareLink) {
      // Check if expired
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        return NextResponse.json({ redirectUrl: origin });
      }
      
      // Increment click count (fire and forget)
      void supabase
        .from('share_links')
        .update({ click_count: (shareLink.click_count || 0) + 1 })
        .eq('id', shareLink.id)
        .then(() => {});
      
      // Build redirect URL with style parameters
      const redirectUrl = new URL(`${origin}/create`);
      
      if (shareLink.style_id) redirectUrl.searchParams.set('style', shareLink.style_id);
      if (shareLink.scene_id) redirectUrl.searchParams.set('scene', shareLink.scene_id);
      if (shareLink.wardrobe_id) redirectUrl.searchParams.set('wardrobe', shareLink.wardrobe_id);
      if (shareLink.color_id) redirectUrl.searchParams.set('color', shareLink.color_id);
      
      return NextResponse.json({ redirectUrl: redirectUrl.toString() });
    }
    
    // If not in share_links, try explore_images (for explore page images)
    const { data: exploreImage } = await supabase
      .from('explore_images')
      .select('s3_path')
      .eq('short_code', code)
      .maybeSingle();
    
    if (exploreImage) {
      // Parse metadata from filename
      const filename = exploreImage.s3_path.replace(/^placeholders\/styles\//i, '');
      const metadata = parseExploreImageFilename(filename);
      
      if (metadata) {
        const redirectUrl = new URL(`${origin}/create`);
        
        // Use parsed metadata to build URL params
        const styleSlug = metadata.styleFormatted.toLowerCase().replace(/\s+/g, '');
        redirectUrl.searchParams.set('style', styleSlug);
        redirectUrl.searchParams.set('scene', metadata.scene);
        redirectUrl.searchParams.set('wardrobe', metadata.wardrobe);
        redirectUrl.searchParams.set('color', metadata.color);
        redirectUrl.searchParams.set('aspectRatio', metadata.aspectRatio);
        redirectUrl.searchParams.set('quality', metadata.resolution);
        
        return NextResponse.json({ redirectUrl: redirectUrl.toString() });
      }
    }
    
    // Not found in either table - redirect to homepage
    return NextResponse.json({ redirectUrl: origin });
    
  } catch (error) {
    console.error('Error in share redirect:', error);
    // Fallback to request origin
    return NextResponse.json({ redirectUrl: request.nextUrl.origin });
  }
}

