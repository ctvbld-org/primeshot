import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExploreImageWithRelations } from '@primeshot/common/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const styleId = searchParams.get('styleId');
  const categoryId = searchParams.get('categoryId');

  try {
    let query = supabase
      .from('explore_images')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (styleId) {
      query = query.eq('style_id', styleId);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching explore images:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch explore images' },
        { status: 500 }
      );
    }

    // Fetch related data separately
    const categoryIds = [...new Set((images || []).map(img => img.category_id).filter(Boolean))];
    const styleIds = [...new Set((images || []).map(img => img.style_id).filter(Boolean))];
    const wardrobeIds = [...new Set((images || []).map(img => img.wardrobe_id).filter(Boolean))];
    const sceneIds = [...new Set((images || []).map(img => img.scene_id).filter(Boolean))];
    const colorIds = [...new Set((images || []).map(img => img.color_id).filter(Boolean))];

    const [categoriesData, stylesData, wardrobesData, scenesData, colorsData] = await Promise.all([
      categoryIds.length ? supabase.from('explore_categories').select('*').in('id', categoryIds) : Promise.resolve({ data: [] }),
      styleIds.length ? supabase.from('styles').select('id, name').in('id', styleIds) : Promise.resolve({ data: [] }),
      wardrobeIds.length ? supabase.from('style_wardrobes').select('id, name').in('id', wardrobeIds) : Promise.resolve({ data: [] }),
      sceneIds.length ? supabase.from('style_scenes').select('id, name').in('id', sceneIds) : Promise.resolve({ data: [] }),
      colorIds.length ? supabase.from('style_colors').select('id, name').in('id', colorIds) : Promise.resolve({ data: [] })
    ]);

    // Create lookup maps
    const categoriesMap = new Map((categoriesData.data || []).map(c => [c.id, c]));
    const stylesMap = new Map((stylesData.data || []).map(s => [s.id, s]));
    const wardrobesMap = new Map((wardrobesData.data || []).map(w => [w.id, w]));
    const scenesMap = new Map((scenesData.data || []).map(s => [s.id, s]));
    const colorsMap = new Map((colorsData.data || []).map(c => [c.id, c]));

    // Enrich images with related data
    const enrichedImages = (images || []).map((img: any) => ({
      ...img,
      category: categoriesMap.get(img.category_id),
      style: stylesMap.get(img.style_id),
      wardrobe: wardrobesMap.get(img.wardrobe_id),
      scene: scenesMap.get(img.scene_id),
      color: colorsMap.get(img.color_id),
    }));

    // Group by style
    const groupedByStyle: Record<string, ExploreImageWithRelations[]> = {};
    enrichedImages.forEach((image: any) => {
      const styleName = image.style?.name || 'Unknown';
      if (!groupedByStyle[styleName]) {
        groupedByStyle[styleName] = [];
      }
      groupedByStyle[styleName].push(image);
    });

    return NextResponse.json({
      success: true,
      images: enrichedImages,
      groupedByStyle
    });

  } catch (error) {
    console.error('Error in list explore images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

