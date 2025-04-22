'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Style, StyleStatus } from '@/lib/types'
import { StyleCard } from '@/components/style/style-card'
import { NewStyleCard } from '@/components/style/new-style-card'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { getStyles, deleteStyle, calculateHeadshots } from '@/lib/api/styles'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { usePaymentFlow } from '@/lib/hooks/use-payment-flow'
import { ProfileCompletionModal } from '@/components/profile/profile-completion-modal'
import { ShootFooter } from '@/components/shoot/shoot-footer'
import { PRICING } from '@/lib/constants/pricing'
import stylesCSS from './page.module.css'
import { motion } from 'framer-motion'

export default function StylesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [styles, setStyles] = useState<Style[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateProgress, canModifyStyles, progress } = useUserProgress()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const supabase = createClient()
  const { fetchProfile } = useUserProfile()
  
  // Headshot calculation state
  const [headshotInfo, setHeadshotInfo] = useState<{
    styleCount: number,
    totalHeadshots: number,
    headshotsPerStyle: number,
    tier: string,
    price: number
  }>({
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

  // Function to load styles
  const loadStyles = useCallback(async () => {
    if (!user) return;

    try {
      // Only set loading to true if styles aren't loaded yet
      if (styles.length === 0) {
        setIsLoading(true);
      }
      
      // Fetch draft styles for this user
      const draftStyles = await getStyles(user.id, { status: 'draft' });
      setStyles(draftStyles);
      
      // Calculate headshots for draft styles
      if (user) {
        try {
          const headshots = await calculateHeadshots(user.id);
          setHeadshotInfo(headshots);
        } catch (error) {
          console.error('Error calculating headshots:', error);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load styles',
        variant: 'destructive'
      });
    } finally {
      // Always ensure loading is set to false after fetching
      setIsLoading(false);
    }
  }, [user, toast, styles.length]);

  // Load styles on mount
  useEffect(() => {
    if (user) {
      loadStyles();
    }
  }, [user, loadStyles]);

  // Function to handle style deletion
  async function handleDeleteStyle(styleId: string) {
    if (!user) return;

    try {
      await deleteStyle(styleId, user.id);
      
      // Refresh the styles list
      loadStyles();
      
      toast({
        title: 'Success',
        description: 'Style deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete style',
        variant: 'destructive'
      });
    }
  }

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    // Refresh the page data
    loadStyles();
  }

  return (
    <>
      <motion.div 
        className={`${stylesCSS['card-wrapper']} wrapper ${styles.length === 0 && stylesCSS['scrollable']}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="text-center py-8">Loading styles...</div>
        ) : styles.length === 0 ? (
          <>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <NewStyleCard onClick={() => router.push('/app/styles')} />
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
          </>
        ) : (
          <>
            <NewStyleCard onClick={() => router.push('/app/styles')} />
            
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                onClick={() => router.push(`/app/style/${style.id}`)}
                onDelete={() => handleDeleteStyle(style.id)}
                headshotsPerStyle={headshotInfo.headshotsPerStyle}
              />
            ))}
          </>
        )}

        <ProfileCompletionModal
          isOpen={showProfileModal}
          onComplete={handleProfileComplete}
          user={user}
        />
      </motion.div>

      {/* Fixed Footer - Always show it */}
      <ShootFooter
        stylesCount={headshotInfo.styleCount}
        photosPerStyle={headshotInfo.headshotsPerStyle}
        basePrice={headshotInfo.price}
        extraStylesCount={
          headshotInfo.styleCount === 1 ? 2 :  // Individual -> Professional (2 extra)
          headshotInfo.styleCount <= 3 ? 3 :   // Professional -> Studio (3 extra)
          1                                     // Studio -> Studio + 1
        }
        totalPhotosWithExtra={
          headshotInfo.styleCount === 1 ? PRICING.professional.totalHeadshots :  // Individual -> Professional
          headshotInfo.styleCount <= 3 ? PRICING.studio.totalHeadshots :         // Professional -> Studio
          headshotInfo.totalHeadshots + PRICING.addon.headshots                  // Studio -> Studio + addon
        }
        upgradedPrice={
          headshotInfo.styleCount === 1 ? PRICING.professional.price / 100 :  // Individual -> Professional
          headshotInfo.styleCount <= 3 ? PRICING.studio.price / 100 :         // Professional -> Studio
          headshotInfo.price / 100 + PRICING.addon.price / 100               // Studio -> Studio + addon
        }
        onCheckout={async () => {
          if (!user) {
            toast({ title: 'Error', description: 'User not logged in.', variant: 'destructive' });
            return;
          }
          if (headshotInfo.styleCount > 0) {
            await proceedToPayment();
          }
        }}
      />
    </>
  )
} 