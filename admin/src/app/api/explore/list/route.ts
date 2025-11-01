import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExploreImageWithRelations } from '@primeshot/common/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  try {
    let query = supabase
      .from('explore_images')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
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

    // Fetch categories
    const categoryIds = [...new Set((images || []).map(img => img.category_id).filter(Boolean))];

    const { data: categoriesData } = categoryIds.length 
      ? await supabase.from('explore_categories').select('*').in('id', categoryIds)
      : { data: [] };

    // Create category lookup map
    const categoriesMap = new Map((categoriesData || []).map(c => [c.id, c]));

    // Enrich images with category data only (metadata comes from filename parsing)
    const enrichedImages = (images || []).map((img: any) => ({
      ...img,
      category: categoriesMap.get(img.category_id),
    }));

    // Group by category
    const groupedByCategory: Record<string, ExploreImageWithRelations[]> = {};
    enrichedImages.forEach((image: any) => {
      const categoryName = image.category?.name || 'Uncategorized';
      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = [];
      }
      groupedByCategory[categoryName].push(image);
    });

    return NextResponse.json({
      success: true,
      images: enrichedImages,
      groupedByCategory
    });

  } catch (error) {
    console.error('Error in list explore images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

