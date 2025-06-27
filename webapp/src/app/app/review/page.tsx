'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import type { ToastActionElement } from '@primeshot/common/web/ui/toast'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { Image as ImageType } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import styles from './page.module.css'

// Import the new components
import ProfileForm from '@/components/review/profile-form'
import ShootSummary from '@/components/review/shoot-summary'
import { ReviewFooter } from '@/components/review/review-footer'
import { PROFILE_FORM_FIELDS } from '@/constants/profile-options'

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Map form fields to database columns
const formToDbFieldMap: Record<string, string> = {
  gender: 'gender',
  eyeColor: 'eye_color',
  hairColor: 'hair_color',
  hairLength: 'hair_length',
  hairStyle: 'hair_style',
  age: 'age',
  bodyType: 'body_type',
  height: 'height',
  weight: 'weight',
  ethnicity: 'ethnicity',
  glasses: 'glasses',
};

// Map database columns to form fields
const dbToFormFieldMap: Record<string, string> = Object.entries(formToDbFieldMap)
  .reduce((acc, [formField, dbField]) => ({
    ...acc,
    [dbField]: formField
  }), {});

export default function ReviewPage() {
  const { t } = useTranslation('review')  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)
  const [userGender, setUserGender] = useState<'male' | 'female'>('male')
  const [profileComplete, setProfileComplete] = useState(false)
  const [formFields, setFormFields] = useState<Record<string, string>>(() => {
    return PROFILE_FORM_FIELDS.reduce((acc, field) => ({
      ...acc,
      [field.name]: ''
    }), {})
  })

  // Fetch user profile data on mount
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('gender, eye_color, hair_color, hair_length, hair_style, age, body_type, height, weight, ethnicity, glasses')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserGender(data.gender as 'male' | 'female');
          
          // Convert database fields to form fields
          const formData = Object.entries(data).reduce((acc, [dbField, value]) => {
            const formField = dbToFormFieldMap[dbField];
            return formField ? { ...acc, [formField]: value || '' } : acc;
          }, {} as Record<string, string>);

          setFormFields(formData);

          // Check if all required fields are filled
          const requiredFields = PROFILE_FORM_FIELDS
            .filter(field => field.isRequired)
            .map(field => formToDbFieldMap[field.name]);
          
          const allFieldsFilled = requiredFields.every(field => 
            data[field as keyof typeof data] !== null && 
            data[field as keyof typeof data] !== ''
          );
          setProfileComplete(allFieldsFilled);
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

        // Fetch user images
        const response = await fetch(`/api/user-images?orderId=${orderData.id}`)

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `API error! Status: ${response.status}`)
        }
        
        const imagesWithUrls = await response.json()
        
        if (!Array.isArray(imagesWithUrls)) {
            throw new Error("Invalid image data received from API.")
        }
        
        setUploadedImages(imagesWithUrls)
        
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [user, supabase, toast]);

  const handleFormFieldUpdate = (fieldName: string, value: string) => {
    setFormFields(prev => {
      const newFields = { ...prev, [fieldName]: value }
      
      // Get required fields from configuration
      const requiredFields = PROFILE_FORM_FIELDS
        .filter(field => field.isRequired)
        .map(field => field.name)
      
      const allFieldsFilled = requiredFields.every(field => newFields[field] !== '')
      setProfileComplete(allFieldsFilled)
      
      return newFields
    })
  }

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Update progress after successful profile update
      await updateProgress('albums');

      // Redirect to the next page
      router.push('/app/albums');
      
      // Note: We don't set isSubmitting to false here because we're redirecting
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false); // Only reset on error
    }
  };

  const submitForm = async () => {
    if (formRef.current) {
      await formRef.current.requestSubmit();
    }
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <ProfileForm
            ref={formRef}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            gender={userGender}
            onFieldUpdate={handleFormFieldUpdate}
            profileComplete={profileComplete}
          />
        </div>
        <div className={styles.sidebarSection}>
          <ShootSummary 
            isLoading={isLoading}
            images={uploadedImages}
          />
        </div>
      </div>
      <ReviewFooter
        isLoading={isLoading || isSubmitting}
        profileComplete={profileComplete}
        onGenerate={submitForm}
      />
    </>
  );
} 