import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    let query = supabase
      .from('explore_images')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category && category !== 'All') {
      const { data: categoryData } = await supabase
        .from('explore_categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching explore images:', error);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    // Fetch related data separately to avoid PostgREST aliasing issues
    const categoryIds = [...new Set((images || []).map(img => img.category_id).filter(Boolean))];
    const styleIds = [...new Set((images || []).map(img => img.style_id).filter(Boolean))];
    const wardrobeIds = [...new Set((images || []).map(img => img.wardrobe_id).filter(Boolean))];
    const sceneIds = [...new Set((images || []).map(img => img.scene_id).filter(Boolean))];
    const colorIds = [...new Set((images || []).map(img => img.color_id).filter(Boolean))];

    // Fetch all related data in parallel
    const [categoriesData, stylesData, wardrobesData, scenesData, colorsData] = await Promise.all([
      categoryIds.length ? supabase.from('explore_categories').select('id, name, title, description, cta_link').in('id', categoryIds) : Promise.resolve({ data: [] }),
      styleIds.length ? supabase.from('styles').select('id, name').in('id', styleIds) : Promise.resolve({ data: [] }),
      wardrobeIds.length ? supabase.from('style_wardrobes').select('id, value').in('id', wardrobeIds) : Promise.resolve({ data: [] }),
      sceneIds.length ? supabase.from('style_scenes').select('id, value').in('id', sceneIds) : Promise.resolve({ data: [] }),
      colorIds.length ? supabase.from('style_colors').select('id, value').in('id', colorIds) : Promise.resolve({ data: [] })
    ]);

    // Create lookup maps
    const categoriesMap = new Map((categoriesData.data || []).map(c => [c.id, c]));
    const stylesMap = new Map((stylesData.data || []).map(s => [s.id, s]));
    const wardrobesMap = new Map((wardrobesData.data || []).map(w => [w.id, w]));
    const scenesMap = new Map((scenesData.data || []).map(s => [s.id, s]));
    const colorsMap = new Map((colorsData.data || []).map(c => [c.id, c]));

    // Format images for website (match ExploreItem interface)
    const formattedImages = (images || []).map((img: any) => {
      const categoryData = categoriesMap.get(img.category_id);
      const styleData = stylesMap.get(img.style_id);
      const wardrobeData = wardrobesMap.get(img.wardrobe_id);
      const sceneData = scenesMap.get(img.scene_id);
      const colorData = colorsMap.get(img.color_id);

      // Debug logging
      if (!sceneData || !wardrobeData || !colorData) {
        console.log('Missing data for image:', {
          imageId: img.id,
          scene_id: img.scene_id,
          wardrobe_id: img.wardrobe_id,
          color_id: img.color_id,
          sceneData: sceneData?.value,
          wardrobeData: wardrobeData?.value,
          colorData: colorData?.value
        });
      }

      return {
        id: img.id,
        image: img.s3_path,
        aspectRatio: img.aspect_ratio,
        resolution: img.resolution,
        model: 'Primeshot v1',
        style: styleData?.name || 'Unknown',
        scene: sceneData?.value || 'unknown', // Use value for lookup in ExploreThumb
        wardrobe: wardrobeData?.value || 'unknown', // Use value for lookup in ExploreThumb
        color: colorData?.value || 'default', // Use value for lookup in ExploreThumb
        category: categoryData?.name || 'Uncategorized',
      };
    });

    // Fetch all categories for the filter
    const { data: allCategories } = await supabase
      .from('explore_categories')
      .select('*')
      .order('name', { ascending: true });

    // Format categories for website (match StyleFilter interface)
    const formattedCategories: Record<string, any> = {};
    (allCategories || []).forEach((cat: any) => {
      formattedCategories[cat.name] = {
        name: cat.title,
        description: cat.description,
        ctaLink: cat.cta_link,
      };
    });

    return NextResponse.json({
      images: formattedImages,
      categories: formattedCategories,
    });

  } catch (error) {
    console.error('Error in explore API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

