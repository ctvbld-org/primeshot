'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@primeshot/common/web/ui/tabs';
import CategoriesTab from '@/components/explore/CategoriesTab';
import ImagesTab from '@/components/explore/ImagesTab';
import styles from '../styles/tabs.module.css';

export default function ExplorePage() {
  const STORAGE_KEY = 'explore:activeTab';
  const [tab, setTab] = React.useState<string>('images');
  
  React.useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setTab(saved);
  }, []);
  
  const onTabChange = (v: string) => {
    setTab(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  };

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Management</h1>
        <p className="text-muted-foreground">
          Manage explore showcase images and categories
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="images" className={styles.tabsTrigger}>Images</TabsTrigger>
          <TabsTrigger value="categories" className={styles.tabsTrigger}>Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <ImagesTab />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

