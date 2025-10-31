'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExploreImageWithRelations, ExploreCategory } from '@primeshot/common/types';
import { Button } from '@primeshot/common/web/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@primeshot/common/web/ui/select';
import { Checkbox } from '@primeshot/common/web/ui/checkbox';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { Icon } from '@primeshot/common/web/Icon';
import Image from 'next/image';
import { getApiUrl } from '@primeshot/common/lib/api/client';
import styles from './ImagesTab.module.css';
import { getAppCdnUrl } from '@primeshot/common/lib/utils/cdn';

export default function ImagesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>('');

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['exploreImages'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/explore/list'));
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      return {
        images: data.images as ExploreImageWithRelations[],
        groupedByCategory: data.groupedByCategory as Record<string, ExploreImageWithRelations[]>,
      };
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['exploreCategories'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/explore/categories'));
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories as ExploreCategory[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/explore/remove?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete image');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exploreImages'] });
      toast({ title: 'Image removed from explore', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { imageIds: string[]; categoryId: string }) => {
      const response = await fetch(getApiUrl('/api/explore/bulk-update-category'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update categories');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exploreImages'] });
      toast({
        title: `Updated ${data.updatedCount} images`,
        variant: 'success',
      });
      setSelectedImages(new Set());
      setBulkCategory('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSelectImage = (imageId: string, checked: boolean) => {
    const newSelection = new Set(selectedImages);
    if (checked) {
      newSelection.add(imageId);
    } else {
      newSelection.delete(imageId);
    }
    setSelectedImages(newSelection);
  };

  const handleBulkUpdate = () => {
    if (selectedImages.size === 0 || !bulkCategory) return;
    bulkUpdateMutation.mutate({
      imageIds: Array.from(selectedImages),
      categoryId: bulkCategory,
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this image from explore? The file will be permanently deleted.')) return;
    deleteMutation.mutate(id);
  };

  if (imagesLoading) {
    return <div className={styles.loading}>Loading images...</div>;
  }

  if (!imagesData?.groupedByCategory || Object.keys(imagesData.groupedByCategory).length === 0) {
    return <div className={styles.empty}>No images in explore yet. Add some from the webapp!</div>;
  }

  return (
    <div className={styles.container}>
      {/* Bulk actions */}
      {selectedImages.size > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedImages.size} selected</span>
          <div className={styles.bulkActionsGroup}>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger className={styles.categorySelect}>
                <SelectValue placeholder="Change category..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkUpdate}
              disabled={!bulkCategory || bulkUpdateMutation.isPending}
            >
              Update Category
            </Button>
          </div>
        </div>
      )}

      {/* Images grouped by category */}
      <div className={styles.styleGroups}>
        {Object.entries(imagesData.groupedByCategory).map(([categoryName, images]) => (
          <StyleGroup
            key={categoryName}
            styleName={categoryName}
            images={images}
            categories={categories || []}
            selectedImages={selectedImages}
            onSelectImage={handleSelectImage}
            onDelete={handleDelete}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['exploreImages'] })}
          />
        ))}
      </div>
    </div>
  );
}

interface StyleGroupProps {
  styleName: string;
  images: ExploreImageWithRelations[];
  categories: ExploreCategory[];
  selectedImages: Set<string>;
  onSelectImage: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

function StyleGroup({ styleName, images, categories, selectedImages, onSelectImage, onDelete, onUpdate }: StyleGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.styleGroup}>
      <div className={styles.styleHeader} onClick={() => setExpanded(!expanded)}>
        <h3 className={styles.styleName}>
          <Icon variant={expanded ? 'chevronDown' : 'chevronRight'} size={16} />
          {styleName} ({images.length})
        </h3>
      </div>

      {expanded && (
        <div className={styles.imagesGrid}>
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              categories={categories}
              isSelected={selectedImages.has(image.id)}
              onSelect={(checked) => onSelectImage(image.id, checked)}
              onDelete={() => onDelete(image.id)}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ImageCardProps {
  image: ExploreImageWithRelations;
  categories: ExploreCategory[];
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onUpdate: () => void;
}

function ImageCard({ image, categories, isSelected, onSelect, onDelete, onUpdate }: ImageCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [categoryId, setCategoryId] = useState(image.category_id);

  const updateMutation = useMutation({
    mutationFn: async (data: { categoryId: string }) => {
      const response = await fetch(getApiUrl('/api/explore/update'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: image.id, categoryId: data.categoryId }),
      });
      if (!response.ok) throw new Error('Failed to update');
    },
    onSuccess: () => {
      toast({ title: 'Image updated', variant: 'success' });
      onUpdate();
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (categoryId !== image.category_id) {
      updateMutation.mutate({ categoryId });
    } else {
      setIsEditing(false);
    }
  };

  // Construct CDN URL for image (images are in app-images bucket)
  const imageUrl = image.s3_path;

  return (
    <div className={styles.imageCard}>
      <div className={styles.imageCheckbox}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>
      
      <div className={styles.imagePreview}>
        <img
          src={getAppCdnUrl(imageUrl)}
          alt={`${image.style.name} - ${image.aspect_ratio}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
        />
      </div>
      
      <div className={styles.imageInfo}>
        <p><strong>AR:</strong> {image.aspect_ratio}</p>
        <p><strong>Res:</strong> {image.resolution}</p>
        {!isEditing ? (
          <p><strong>Cat:</strong> {image.category?.name || 'None'}</p>
        ) : (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className={styles.imageActions}>
        {!isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

