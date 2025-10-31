// Explore system types

export interface ExploreCategory {
  id: string;
  name: string;
  title: string;
  description: string;
  cta_link: string;
  created_at: string;
  updated_at: string;
}

export interface ExploreImage {
  id: string;
  user_id: string;
  generated_image_id: string;
  inference_id: string;
  style_id: string;
  wardrobe_id: string;
  scene_id: string;
  color_id: string; // UUID reference to style_colors
  aspect_ratio: string;
  resolution: string;
  category_id: string;
  s3_path: string;
  original_s3_path: string;
  created_at: string;
  updated_at: string;
  // Relations (populated via joins)
  category?: ExploreCategory;
  style?: { id: string; name: string };
  wardrobe?: { id: string; name: string };
  scene?: { id: string; name: string };
  color?: { id: string; name: string };
}

export interface ExploreImageWithRelations extends ExploreImage {
  category: ExploreCategory;
  style: { id: string; name: string };
  wardrobe: { id: string; name: string };
  scene: { id: string; name: string };
  color: { id: string; name: string };
}

// API request/response types
export interface SaveToExploreRequest {
  generatedImageId: string;
}

export interface SaveToExploreResponse {
  success: boolean;
  exploreImage?: ExploreImage;
  error?: string;
}

export interface RemoveFromExploreRequest {
  exploreImageId: string;
}

export interface RemoveFromExploreResponse {
  success: boolean;
  error?: string;
}

export interface UpdateExploreImageRequest {
  id: string;
  categoryId?: string;
  aspectRatio?: string;
  resolution?: string;
}

export interface UpdateExploreImageResponse {
  success: boolean;
  exploreImage?: ExploreImage;
  error?: string;
}

export interface BulkUpdateCategoryRequest {
  imageIds: string[];
  categoryId: string;
}

export interface BulkUpdateCategoryResponse {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

export interface ListExploreImagesRequest {
  styleId?: string;
  categoryId?: string;
}

export interface ListExploreImagesResponse {
  success: boolean;
  images?: ExploreImageWithRelations[];
  groupedByCategory?: Record<string, ExploreImageWithRelations[]>;
  error?: string;
}

export interface ListExploreCategoriesResponse {
  success: boolean;
  categories?: ExploreCategory[];
  error?: string;
}

export interface CreateCategoryRequest {
  name: string;
  title: string;
  description?: string;
  ctaLink?: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  category?: ExploreCategory;
  error?: string;
}

export interface UpdateCategoryRequest {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  ctaLink?: string;
}

export interface UpdateCategoryResponse {
  success: boolean;
  category?: ExploreCategory;
  error?: string;
}

export interface DeleteCategoryRequest {
  id: string;
}

export interface DeleteCategoryResponse {
  success: boolean;
  error?: string;
}

