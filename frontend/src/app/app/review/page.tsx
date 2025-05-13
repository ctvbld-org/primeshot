'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { Image as ImageType } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import styles from './page.module.css'

// Import the new components
import ProfileForm from '@/components/review/profile-form'
import ShootSummary from '@/components/review/shoot-summary'

export default function ReviewPage() {
  const { t } = useTranslation('review')
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<ImageType[]>([])
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)
  const [userGender, setUserGender] = useState<string>('male') // Default to male

  // Fetch user data, order, and images
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Fetch user profile data to get gender
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('gender')
          .eq('id', user.id)
          .single()
          
        if (!userError && userData?.gender) {
          setUserGender(userData.gender.toLowerCase())
        }
        
        // Get the most recent paid order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (orderError) throw orderError

        if (!orderData) {
          toast({
            title: "No active order",
            description: "You need to complete payment first",
            variant: 'destructive'
          })
          router.push('/app/shoot')
          return
        }

        const currentOrderId = orderData.id
        setDraftOrderId(currentOrderId)
        
        // If order has gender in metadata, use that
        if (orderData.metadata?.demographics?.gender) {
          setUserGender(orderData.metadata.demographics.gender.toLowerCase())
        }
        
        // Fetch user images
        const response = await fetch(`/api/user-images?orderId=${currentOrderId}`)
        
        if (!response.ok) {
           const errorData = await response.json()
           throw new Error(errorData.error || `API error! Status: ${response.status}`)
        }
        
        const imagesWithUrls = await response.json()
        
        if (!Array.isArray(imagesWithUrls)) {
            throw new Error("Invalid image data received from API.")
        }
        
        setUploadedImages(imagesWithUrls as ImageType[])

      } catch (error) {
        console.error("Error fetching review data:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data",
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast, router])

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    if (!user) {
      toast({ 
        title: "Error", 
        description: "You must be logged in to continue", 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (draftOrderId) {
          const { data: existingOrderData, error: fetchError } = await supabase
            .from('orders')
            .select('metadata')
            .eq('id', draftOrderId)
            .single();
          if (fetchError) throw new Error(`Failed to fetch existing order metadata: ${fetchError.message}`);
          const existingMetadata = existingOrderData?.metadata || {};

          const { error: updateError } = await supabase
            .from('orders')
            .update({ metadata: { ...existingMetadata, demographics: formData } })
            .eq('id', draftOrderId);
          if (updateError) throw updateError;
      } else {
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: { demographics: formData } 
          });
          if (updateUserError) throw updateUserError;
      }

      await updateProgress('review');
      
      toast({
        title: "Success",
        description: "Your profile information has been saved",
      });
        
      router.push('/app/albums'); 

    } catch (error: unknown) {
      console.error('Error submitting demographics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile information",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Left Column - Profile Form */}
        <div className={styles.formSection}>
          <ProfileForm 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            gender={userGender}
          />
        </div>
        
        {/* Right Column - Shoot Summary */}
        <div className={styles.sidebarSection}>
          <ShootSummary 
            isLoading={isLoading}
            images={uploadedImages}
          />
        </div>
      </div>
    </div>
  )
} 