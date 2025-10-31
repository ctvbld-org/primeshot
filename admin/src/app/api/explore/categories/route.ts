import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: categories, error } = await supabase
      .from('explore_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error in explore categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { name, title, description, ctaLink } = body;

    const { data, error } = await supabase
      .from('explore_categories')
      .insert({
        name,
        title,
        description,
        cta_link: ctaLink
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, name, title, description, ctaLink } = body;

    const { data, error } = await supabase
      .from('explore_categories')
      .update({
        name,
        title,
        description,
        cta_link: ctaLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('explore_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

