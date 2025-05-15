'use client';

import React, { useState, useEffect } from 'react';
import styles from './profile-form.module.css';
import FormField from './form-field';
import { ArrowRightIcon } from 'lucide-react';
import {
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_LENGTH_OPTIONS,
  MALE_HAIRSTYLE_OPTIONS,
  FEMALE_HAIRSTYLE_OPTIONS,
  AGE_RANGE_OPTIONS,
  BODY_TYPE_OPTIONS,
  HEIGHT_RANGE_OPTIONS,
  WEIGHT_RANGE_OPTIONS,
  ETHNICITY_OPTIONS,
  GLASSES_OPTIONS,
} from '@/constants/profile-options';

interface ProfileFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
  gender?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isSubmitting, gender = 'male' }) => {
  // Convert gender to lowercase for consistency in comparisons
  const userGender = gender.toLowerCase();
  
  // Select the appropriate hairstyle options based on gender
  const hairstyleOptions = userGender === 'female' ? FEMALE_HAIRSTYLE_OPTIONS : MALE_HAIRSTYLE_OPTIONS;
  
  // Set a default hairstyle based on gender
  const defaultHairstyle = userGender === 'female' ? 'Straight Hair' : 'Straight Hair';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a mock form data object with all the field values
    // In a real implementation, you'd collect actual values from form fields
    const formData = {
      gender: userGender === 'female' ? 'Female' : 'Male',
      eyeColor: 'Blue', 
      hairColor: 'Brown',
      hairLength: 'Short',
      hairStyle: defaultHairstyle,
      age: '26-30',
      bodyType: 'Athletic',
      height: '180-190',
      weight: '81-90',
      ethnicity: 'Caucasian',
      glasses: 'No glasses'
    };
    
    onSubmit(formData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add final details</h1>
        <p className={styles.subtitle}>
          Your details help refine photo accuracy, creating headshots that truly reflect you.
        </p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          label="GENDER"
          value={userGender === 'female' ? 'Female' : 'Male'}
          disabled={true}
        />
        
        <FormField
          label="EYE COLOR"
          options={EYE_COLOR_OPTIONS}
        />
        
        <FormField
          label="HAIR COLOR"
          options={HAIR_COLOR_OPTIONS}
        />
        
        <FormField
          label="HAIR LENGTH"
          options={HAIR_LENGTH_OPTIONS}
        />
        
        <FormField
          label="HAIR STYLE"
          options={hairstyleOptions}
        />
        
        <FormField
          label="AGE"
          options={AGE_RANGE_OPTIONS}
        />
        
        <FormField
          label="BODY TYPE"
          options={BODY_TYPE_OPTIONS}
        />
        
        <FormField
          label="HEIGHT"
          options={HEIGHT_RANGE_OPTIONS}
        />
        
        <FormField
          label="WEIGHT"
          options={WEIGHT_RANGE_OPTIONS}
        />
        
        <FormField
          label="ETHNICITY"
          options={ETHNICITY_OPTIONS}
        />
        
        <FormField
          label="GLASSES"
          options={GLASSES_OPTIONS}
        />
      </form>
    </div>
  );
};

export default ProfileForm;