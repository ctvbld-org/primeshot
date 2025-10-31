import { NextRequest, NextResponse } from 'next/server';
import { 
  ListExploreCategoriesResponse, 
  CreateCategoryRequest, 
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  DeleteCategoryResponse
} from '@primeshot/common/types';
import { requireAdmin } from '@/lib/admin/explore-utils';

// GET - List all categories
export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const { data: categories, error } = await supabase
      .from('explore_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json<ListExploreCategoriesResponse>(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json<ListExploreCategoriesResponse>({
      success: true,
      categories: categories || []
    });

  } catch (error) {
    console.error('Error in list-categories:', error);
    return NextResponse.json<ListExploreCategoriesResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const body: CreateCategoryRequest = await request.json();
    const { name, title, description, ctaLink } = body;

    if (!name || !title) {
      return NextResponse.json<CreateCategoryResponse>(
        { success: false, error: 'name and title are required' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('explore_categories')
      .insert({
        name,
        title,
        description: description || '',
        cta_link: ctaLink || '/pricing'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json<CreateCategoryResponse>(
          { success: false, error: 'Category with this name already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json<CreateCategoryResponse>(
        { success: false, error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json<CreateCategoryResponse>({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error in create-category:', error);
    return NextResponse.json<CreateCategoryResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const body: UpdateCategoryRequest = await request.json();
    const { id, name, title, description, ctaLink } = body;

    if (!id) {
      return NextResponse.json<UpdateCategoryResponse>(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (ctaLink !== undefined) updates.cta_link = ctaLink;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<UpdateCategoryResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('explore_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json<UpdateCategoryResponse>(
          { success: false, error: 'Category with this name already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json<UpdateCategoryResponse>(
        { success: false, error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json<UpdateCategoryResponse>({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error in update-category:', error);
    return NextResponse.json<UpdateCategoryResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<DeleteCategoryResponse>(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // Check if category has images
    const { data: images, error: checkError } = await supabase
      .from('explore_images')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (checkError) {
      return NextResponse.json<DeleteCategoryResponse>(
        { success: false, error: 'Failed to check category usage' },
        { status: 500 }
      );
    }

    if (images && images.length > 0) {
      return NextResponse.json<DeleteCategoryResponse>(
        { success: false, error: 'Cannot delete category with existing images' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('explore_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json<DeleteCategoryResponse>(
        { success: false, error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json<DeleteCategoryResponse>({
      success: true
    });

  } catch (error) {
    console.error('Error in delete-category:', error);
    return NextResponse.json<DeleteCategoryResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

