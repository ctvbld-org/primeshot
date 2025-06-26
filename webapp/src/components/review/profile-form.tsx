'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import styles from './profile-form.module.css';
import FormField from './form-field';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
  PROFILE_FORM_FIELDS,
  FormFieldConfig,
  FEMALE_HAIRSTYLE_OPTIONS,
  MALE_HAIRSTYLE_OPTIONS,
} from '@/constants/profile-options';
import { useTranslation } from 'react-i18next';

interface ProfileFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
  gender?: string;
  onFieldUpdate?: (fieldName: string, value: string) => void;
  profileComplete?: boolean;
}

type FormData = {
  [K in FormFieldConfig['name']]: string;
}

const ProfileForm = forwardRef<HTMLFormElement, ProfileFormProps>(({ 
  onSubmit, 
  isSubmitting, 
  gender = 'male',
  onFieldUpdate,
  profileComplete = false 
}, ref) => {
  const { t } = useTranslation('profile');
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClient();
  
  // Convert gender to lowercase for consistency in comparisons
  const userGender = gender.toLowerCase();
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Initialize all fields with empty strings first
    const initialData = PROFILE_FORM_FIELDS.reduce((acc, field) => ({
      ...acc,
      [field.name]: ''
    }), {} as FormData);
    
    // Set gender explicitly
    initialData.gender = userGender;
    
    return initialData;
  });

  // Add effect to update gender when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      gender: userGender
    }));
  }, [userGender]);

  const handleFieldChange = (name: string, value: string) => {
    const newValue = name === 'gender' ? userGender : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (onFieldUpdate) {
      onFieldUpdate(name, newValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('completionModal.toast.error.title'),
        description: t('completionModal.toast.error.notLoggedIn'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          eye_color: formData.eyeColor,
          hair_color: formData.hairColor,
          hair_length: formData.hairLength,
          hair_style: formData.hairStyle,
          age: formData.age,
          body_type: formData.bodyType,
          height: formData.height,
          weight: formData.weight,
          ethnicity: formData.ethnicity,
          glasses: formData.glasses,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Call the onSubmit prop with the form data
      await onSubmit(formData);

      toast({
        title: t('completionModal.toast.success.title'),
        description: t('completionModal.toast.success.description'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('completionModal.toast.error.title'),
        description: t('completionModal.toast.error.updateFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add final details</h1>
        <p className={styles.subtitle}>
          Your details help refine photo accuracy, creating headshots that truly reflect you.
        </p>
      </div>
      
      <form ref={ref} className={styles.form} onSubmit={handleSubmit}>
        {PROFILE_FORM_FIELDS.map(field => {
          // Handle gender-specific options (like hairstyles)
          let options = field.options;
          if (field.genderSpecific) {
            options = userGender === 'female' ? FEMALE_HAIRSTYLE_OPTIONS : MALE_HAIRSTYLE_OPTIONS;
          }

          return (
            <FormField
              key={field.name}
              name={field.name}
              label={field.label}
              options={options}
              onFieldUpdate={handleFieldChange}
              value={field.name === 'gender' ? userGender : formData[field.name]}
              disabled={field.name === 'gender'}
            />
          );
        })}
      </form>
    </div>
  );
});

export default ProfileForm;