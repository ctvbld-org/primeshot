'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Style, StyleStatus, HeadshotInfo } from '@/lib/types'
import { StyleCard } from '@/components/style/style-card'
import { NewStyleCard } from '@/components/style/new-style-card'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { PhotographyStyleModal } from '@/components/style/photography-style-modal'
import { getStyles, deleteStyle, calculateHeadshots } from '@/lib/api/styles'
import { formatPrice, getTierDisplayText } from '@/lib/pricing'
import { ProfileCompletionModal } from '@/components/profile/profile-completion-modal'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { usePaymentFlow } from '@/lib/hooks/use-payment-flow'
import { getCachedData, cacheData, generateCacheKey, clearCache } from '@/lib/cache'
import type { Style as StyleType } from '@/lib/types'

// Cache TTLs
const STYLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const HEADSHOTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Types
interface Image {
  id: string;
  user_id: string;
  url: string;
  created_at: string;
  order_id?: string;
}

export default function StylesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [styles, setStyles] = useState<StyleType[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateProgress, canModifyStyles, progress } = useUserProgress()
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const supabase = createClient()
  const { fetchProfile } = useUserProfile()
  
  // Headshot calculation state
  const [headshotInfo, setHeadshotInfo] = useState<HeadshotInfo>({
    styleCount: 0,
    totalHeadshots: 0,
    headshotsPerStyle: 0,
    tier: 'none',
    price: 0
  })

  // Add usePaymentFlow at component level
  const { proceedToPayment, isLoading: isPaymentLoading } = usePaymentFlow({
    styles,
    headshotInfo
  })
  
  // Generate cache keys based on user ID
  const cacheKeys = useMemo(() => {
    if (!user) return null;
    return {
      styles: generateCacheKey('styles', { userId: user.id, status: 'draft' }),
      images: generateCacheKey('images', { userId: user.id })
    };
  }, [user]);
  
  // Check if user profile is complete
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const profile = await fetchProfile(user.id);
      if (profile) {
        // Show profile modal if name or gender is missing
        if (!profile.full_name || !profile.gender) {
          setShowProfileModal(true);
        } else {
          setShowProfileModal(false);
        }
      }
    };

    loadProfile();
  }, [user, fetchProfile]);

  // Load styles from cache or fetch them
  useEffect(() => {
    async function loadStyles() {
      if (!user || !cacheKeys) return;
      
      try {
        setIsLoading(true);
        // Check cache first
        const cachedStyles = getCachedData<StyleType[]>(cacheKeys.styles);
        if (cachedStyles) {
          setStyles(cachedStyles);
          setIsLoading(false);
          return;
        }
        
        // Fetch from database if not in cache
        const { data: dbStyles } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'draft');
        
        if (dbStyles) {
          setStyles(dbStyles);
          // Cache the fetched styles
          cacheData(cacheKeys.styles, dbStyles, STYLES_CACHE_TTL);
        }
      } catch (error) {
        console.error('Error loading styles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your styles. Please try refreshing the page.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStyles();
  }, [user, cacheKeys, supabase, toast]);

  // Load images from cache or fetch them
  useEffect(() => {
    async function loadImages() {
      if (!user || !cacheKeys) return;
      
      try {
        // Check cache first
        const cachedImages = getCachedData<Image[]>(cacheKeys.images);
        if (cachedImages) {
          setImages(cachedImages);
          return;
        }
        
        // Fetch from database if not in cache
        const { data: dbImages } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', user.id);
        
        if (dbImages) {
          setImages(dbImages);
          // Cache the fetched images
          cacheData(cacheKeys.images, dbImages, HEADSHOTS_CACHE_TTL);
        }
      } catch (error) {
        console.error('Error loading images:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your images. Please try refreshing the page.',
          variant: 'destructive'
        });
      }
    }
    
    loadImages();
  }, [user, cacheKeys, supabase, toast]);

  // Handle style deletion
  const handleDeleteStyle = async (styleId: string) => {
    try {
      const { error } = await supabase
        .from('styles')
        .delete()
        .eq('id', styleId);

      if (error) throw error;

      // Update local state
      setStyles(prevStyles => prevStyles.filter(style => style.id !== styleId));

      // Clear all related style caches
      if (user) {
        clearCache.clearCachesByPattern(`styles:userId:${user.id}*`);
      }

      toast({
        title: 'Style Deleted',
        description: 'The style has been removed from your order.',
      });
    } catch (error) {
      console.error('Error deleting style:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the style. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSelectStyle = useCallback((style: string) => {
    // Navigate directly
    router.push(`/app/style/new?style=${encodeURIComponent(style)}`);
  }, [router]);

  const handleProfileComplete = useCallback(() => {
    setShowProfileModal(false);
  }, []);

  // Handle style creation
  const handleCreateStyle = async (style: string) => {
    try {
      const { data: newStyle, error } = await supabase
        .from('styles')
        .insert([
          {
            user_id: user?.id,
            name: style,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (newStyle) {
        setStyles(prevStyles => [...prevStyles, newStyle]);
      }

      // Clear all related style caches
      if (user) {
        clearCache.clearCachesByPattern(`styles:userId:${user.id}*`);
      }

      toast({
        title: 'Style Created',
        description: 'New style has been added to your order.',
      });
    } catch (error) {
      console.error('Error creating style:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the style. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Memoize the pricing card to prevent re-renders
  const PricingCard = useMemo(() => {
    if (headshotInfo.styleCount === 0) return null;
    
    return (
      <Card className="bg-accent/20">
        <CardHeader>
          <CardTitle>Your Shoot Package</CardTitle>
          <CardDescription>Based on your current style count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium">Styles</h4>
              <p className="text-2xl font-bold">{headshotInfo.styleCount}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Pricing Tier</h4>
              <p className="text-2xl font-bold">{getTierDisplayText(headshotInfo.tier as any)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Total Shoots</h4>
              <p className="text-2xl font-bold">{headshotInfo.totalHeadshots}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Price</h4>
              <p className="text-2xl font-bold">{formatPrice(headshotInfo.price)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [headshotInfo]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Shoot</h2>
        <p className="text-muted-foreground">
          {progress?.current_stage === 'payment' ? 
            'You can modify your styles before completing payment.' : 
            'View and manage your shoot styles.'}
        </p>
      </div>
      
      {/* Pricing and headshot information card */}
      {PricingCard}
      
      {isLoading ? (
        <div className="text-center py-8">Loading styles...</div>
      ) : styles.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No styles yet</h3>
          <p className="text-muted-foreground mb-6">Start by creating a new style.</p>
          <div className="grid place-items-center">
            <div className="max-w-sm w-full">
              <NewStyleCard onClick={() => setShowStyleModal(true)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NewStyleCard onClick={() => setShowStyleModal(true)} />
          
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onClick={() => router.push(`/app/style/${style.id}`)}
              onDelete={() => handleDeleteStyle(style.id)}
              headshotsPerStyle={headshotInfo.headshotsPerStyle}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end pt-6">
        <Button 
          size="lg"
          className="w-full sm:w-auto"
          disabled={headshotInfo.styleCount === 0 || isLoading || isPaymentLoading}
          onClick={async () => {
            if (!user) {
              toast({ title: 'Error', description: 'User not logged in.', variant: 'destructive' });
              return;
            }
            if (headshotInfo.styleCount > 0) {
              await proceedToPayment();
            }
          }}
        >
          {isLoading || isPaymentLoading ? 'Processing...' : 'Next: Payment'} 
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Modals */}
      <PhotographyStyleModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        onSelectStyle={handleSelectStyle}
      />
      
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onComplete={handleProfileComplete}
        user={user}
      />
    </div>
  )
} 