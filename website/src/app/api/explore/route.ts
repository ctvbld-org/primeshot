import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    let query = supabase
      .from('explore_images')
      .select('id, s3_path, category_id, short_code')
      .order('created_at', { ascending: false});

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

    // Only fetch categories for mapping
    const categoryIds = [...new Set((images || []).map(img => img.category_id).filter(Boolean))];
    
    const { data: categoriesData } = await supabase
      .from('explore_categories')
      .select('id, name')
      .in('id', categoryIds);

    const categoriesMap = new Map((categoriesData || []).map(c => [c.id, c]));

    // Format images - metadata will be parsed from filename on frontend
    const formattedImages = (images || []).map((img: any) => {
      const categoryData = categoriesMap.get(img.category_id);

      return {
        id: img.id,
        image: img.s3_path, // Full filename with all metadata
        category: categoryData?.name || 'Uncategorized',
        shortCode: img.short_code, // Include short code for URL shortener
      };
    });

    // Fetch all categories for the filter
    const { data: allCategories } = await supabase
      .from('explore_categories')
      .select('*')
      .order('name', { ascending: true});

    // Format categories for website
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
