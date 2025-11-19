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
      // Debug: Log retrieved share link
      console.log('[Share Redirect] Share link found:', {
        short_code: code,
        style_id: shareLink.style_id,
        scene_id: shareLink.scene_id,
        wardrobe_id: shareLink.wardrobe_id,
        color_id: shareLink.color_id,
        quality: shareLink.quality,
        aspect_ratio: shareLink.aspect_ratio
      });
      
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
      
      // Fetch the actual option values (not IDs) for the URL params
      const [style, scene, wardrobe, color] = await Promise.all([
        shareLink.style_id ? supabase.from('styles').select('id').eq('id', shareLink.style_id).maybeSingle() : Promise.resolve({ data: null }),
        shareLink.scene_id ? supabase.from('style_scenes').select('value').eq('id', shareLink.scene_id).maybeSingle() : Promise.resolve({ data: null }),
        shareLink.wardrobe_id ? supabase.from('style_wardrobes').select('value').eq('id', shareLink.wardrobe_id).maybeSingle() : Promise.resolve({ data: null }),
        shareLink.color_id ? supabase.from('style_colors').select('value').eq('id', shareLink.color_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      
      // Debug: Log fetched values
      console.log('[Share Redirect] Fetched values:', {
        style: style.data,
        scene: scene.data,
        wardrobe: wardrobe.data,
        color: color.data
      });
      
      // Build redirect URL with style parameters (using values, not IDs)
      const redirectUrl = new URL(`${origin}/create`);
      
      if (style.data?.id) redirectUrl.searchParams.set('style', style.data.id);
      if (scene.data?.value) redirectUrl.searchParams.set('scene', scene.data.value);
      if (wardrobe.data?.value) redirectUrl.searchParams.set('wardrobe', wardrobe.data.value);
      if (color.data?.value) redirectUrl.searchParams.set('color', color.data.value);
      if (shareLink.quality) redirectUrl.searchParams.set('quality', shareLink.quality);
      if (shareLink.aspect_ratio) redirectUrl.searchParams.set('aspectRatio', shareLink.aspect_ratio);
      
      console.log('[Share Redirect] Final URL:', redirectUrl.toString());
      
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

