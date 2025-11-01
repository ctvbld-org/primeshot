import { NextRequest, NextResponse } from 'next/server';
import { SaveToExploreRequest, SaveToExploreResponse } from '@primeshot/common/types';
import { 
  requireAdmin, 
  copyS3Image, 
  generateExploreFilename, 
  getExploreImagePath,
  updateStylePreviewImages,
  deleteS3Image
} from '@/lib/admin/explore-utils';

export async function POST(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { supabase, userId } = authResult;

  try {
    const body: SaveToExploreRequest = await request.json();
    const { generatedImageId } = body;

    if (!generatedImageId) {
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: 'generatedImageId is required' },
        { status: 400 }
      );
    }

    // Check if already in explore
    const { data: existing } = await supabase
      .from('explore_images')
      .select('id')
      .eq('generated_image_id', generatedImageId)
      .single();

    if (existing) {
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: 'Image already in explore' },
        { status: 409 }
      );
    }

    // Fetch generated image with inference data
    const { data: generatedImage, error: imageError } = await supabase
      .from('generated_images')
      .select(`
        id,
        original_path,
        web_path,
        inference_id,
        inference_jobs (
          id,
          style_id,
          wardrobe_id,
          scene_id,
          color_id,
          quality,
          aspect_ratio
        )
      `)
      .eq('id', generatedImageId)
      .single();

    console.log('Generated image query result:', { generatedImage, imageError });

    if (imageError || !generatedImage) {
      console.error('Failed to fetch generated image:', imageError);
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: `Generated image not found: ${imageError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    const inferenceData = generatedImage.inference_jobs as any;
    if (!inferenceData) {
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: 'Inference data not found' },
        { status: 404 }
      );
    }

    // Fetch style name separately
    const { data: styleData } = await supabase
      .from('styles')
      .select('name')
      .eq('id', inferenceData.style_id)
      .single();

    const styleName = styleData?.name;
    if (!styleName) {
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: 'Style name not found' },
        { status: 404 }
      );
    }

    // Get or create category based on style name
    const { data: category, error: categoryError } = await supabase
      .from('explore_categories')
      .select('*')
      .eq('name', styleName)
      .single();

    let finalCategory = category;

    if (categoryError || !category) {
      // Create new category with CTA link to create page with style
      const normalizedStyleName = styleName.toLowerCase().replace(/\s+/g, '');
      const { data: newCategory, error: createError } = await supabase
        .from('explore_categories')
        .insert({
          name: styleName,
          title: styleName,
          description: '',
          cta_link: `/create?style=${normalizedStyleName}`
        })
        .select()
        .single();

      if (createError || !newCategory) {
        return NextResponse.json<SaveToExploreResponse>(
          { success: false, error: 'Failed to create category' },
          { status: 500 }
        );
      }

      finalCategory = newCategory;
    }

    // Fetch scene, wardrobe, and color values for filename
    const [sceneData, wardrobeData, colorData] = await Promise.all([
      supabase.from('style_scenes').select('value').eq('id', inferenceData.scene_id).single(),
      supabase.from('style_wardrobes').select('value').eq('id', inferenceData.wardrobe_id).single(),
      supabase.from('style_colors').select('value').eq('id', inferenceData.color_id).single()
    ]);

    const scene = sceneData.data?.value || 'unknown';
    const wardrobe = wardrobeData.data?.value || 'unknown';
    const color = colorData.data?.value || 'default';
    const resolution = inferenceData.quality || '2K';

    // Generate filename and paths
    const filename = generateExploreFilename(
      styleName,
      scene,
      wardrobe,
      color,
      inferenceData.aspect_ratio,
      resolution
    );
    const destinationPath = getExploreImagePath(filename);
    
    console.log('Attempting copy with web_path:', generatedImage.web_path);

    // Try web_path first, fallback to original_path
    let copyResult = await copyS3Image(generatedImage.web_path, destinationPath);
    let successfulSourcePath = generatedImage.web_path;
    
    if (!copyResult.success && generatedImage.original_path) {
      console.log('web_path failed, trying original_path:', generatedImage.original_path);
      copyResult = await copyS3Image(generatedImage.original_path, destinationPath);
      successfulSourcePath = generatedImage.original_path;
    }

    if (!copyResult.success) {
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: copyResult.error },
        { status: 500 }
      );
    }

    // Create explore_images record (simplified schema - metadata in filename)
    const { data: exploreImage, error: insertError } = await supabase
      .from('explore_images')
      .insert({
        generated_image_id: generatedImageId,
        category_id: finalCategory.id,
        s3_path: destinationPath
      })
      .select()
      .single();

    if (insertError || !exploreImage) {
      // Clean up: delete the copied image
      await deleteS3Image(destinationPath);
      
      return NextResponse.json<SaveToExploreResponse>(
        { success: false, error: 'Failed to create explore image record' },
        { status: 500 }
      );
    }

    // Update styles.preview_images
    await updateStylePreviewImages(inferenceData.style_id, filename, 'add');

    return NextResponse.json<SaveToExploreResponse>({
      success: true,
      exploreImage: exploreImage
    });

  } catch (error) {
    console.error('Error in save-to-explore:', error);
    return NextResponse.json<SaveToExploreResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

