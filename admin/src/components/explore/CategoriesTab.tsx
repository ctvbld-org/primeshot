'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExploreCategory } from '@primeshot/common/types';
import { Button } from '@primeshot/common/web/ui/button';
import { Input } from '@primeshot/common/web/ui/input';
import { Label } from '@primeshot/common/web/ui/label';
import { Textarea } from '@primeshot/common/web/ui/textarea';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@primeshot/common/web/ui/dialog';
import { getApiUrl } from '@primeshot/common/lib/api/client';
import styles from './CategoriesTab.module.css';

export default function CategoriesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExploreCategory | null>(null);
  
  const { data: categories, isLoading } = useQuery({
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
      const response = await fetch(getApiUrl(`/api/explore/categories?id=${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exploreCategories'] });
      toast({ title: 'Category deleted successfully', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (category: ExploreCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    deleteMutation.mutate(id);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading categories...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(null)}>
              + New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CategoryForm
              category={editingCategory}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['exploreCategories'] });
                handleCloseDialog();
              }}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className={styles.categoriesList}>
        {categories && categories.length === 0 && (
          <div className={styles.empty}>No categories yet. Create one to get started.</div>
        )}
        
        {categories?.map((category) => (
          <div key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <div className={styles.categoryActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className={styles.categoryDetails}>
              <p><strong>Title:</strong> {category.title}</p>
              <p><strong>Description:</strong> {category.description || '(none)'}</p>
              <p><strong>CTA Link:</strong> {category.cta_link}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CategoryFormProps {
  category: ExploreCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  
  // Generate default CTA link based on category name
  const getDefaultCtaLink = (name: string) => {
    if (!name) return '/create';
    const normalizedName = name.toLowerCase().replace(/\s+/g, '');
    return `/create?style=${normalizedName}`;
  };
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    title: category?.title || '',
    description: category?.description || '',
    ctaLink: category?.cta_link || getDefaultCtaLink(category?.name || ''),
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = category
        ? getApiUrl('/api/explore/categories')
        : getApiUrl('/api/explore/categories');
      
      const body = category
        ? { id: category.id, ...data }
        : data;

      const response = await fetch(url, {
        method: category ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }
    },
    onSuccess: () => {
      toast({
        title: category ? 'Category updated' : 'Category created',
        variant: 'success',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formField}>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className={styles.formField}>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        
        <div className={styles.formField}>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        
        <div className={styles.formField}>
          <Label htmlFor="ctaLink">CTA Link</Label>
          <Input
            id="ctaLink"
            value={formData.ctaLink}
            onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </>
  );
}

