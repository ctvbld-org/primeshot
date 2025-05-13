'use client';

import React, { useState, useEffect } from 'react';
import styles from './profile-form.module.css';
import FormField from './form-field';
import { ArrowRightIcon } from 'lucide-react';

interface ProfileFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
  gender?: string; // Add gender prop with optional type
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isSubmitting, gender = 'male' }) => {
  // Convert gender to lowercase for consistency in comparisons
  const userGender = gender.toLowerCase();
  
  // Define hairstyle options based on gender
  const maleHairstyleOptions = [
    { value: 'bald-head', label: 'Bald Head' },
    { value: 'balding-top', label: 'Balding Top' },
    { value: 'straight-hair', label: 'Straight Hair' },
    { value: 'wavy-hair', label: 'Wavy Hair' },
    { value: 'curly-hair', label: 'Curly Hair' },
    { value: 'afro', label: 'Afro' },
    { value: 'dreadlocks', label: 'Dreadlocks' },
    { value: 'cornrows', label: 'Cornrows' },
    { value: 'slicked-back', label: 'Slicked Back' },
    { value: 'comb-over', label: 'Comb Over' },
    { value: 'receding-hairline', label: 'Receding Hairline' },
    { value: 'undercut', label: 'Undercut' },
    { value: 'man-bun', label: 'Man Bun' },
    { value: 'mohawk', label: 'Mohawk' },
    { value: 'crew-cut', label: 'Crew Cut' },
    { value: 'faux-hawk', label: 'Faux Hawk' },
    { value: 'buzzcut', label: 'Buzzcut' }
  ];
  
  const femaleHairstyleOptions = [
    { value: 'straight-hair', label: 'Straight Hair' },
    { value: 'wavy-hair', label: 'Wavy Hair' },
    { value: 'curly-hair', label: 'Curly Hair' },
    { value: 'afro', label: 'Afro' },
    { value: 'dreadlocks', label: 'Dreadlocks' },
    { value: 'cornrows', label: 'Cornrows' },
    { value: 'braided-hair', label: 'Braided Hair' },
    { value: 'updo', label: 'Updo' },
    { value: 'ponytail', label: 'Ponytail' },
    { value: 'hair-highlights', label: 'Hair Highlights' },
    { value: 'bangs', label: 'Bangs' },
    { value: 'pixie-cut', label: 'Pixie Cut' },
    { value: 'layered-hair', label: 'Layered Hair' },
    { value: 'twists', label: 'Twists' }
  ];
  
  // Select the appropriate hairstyle options based on gender
  const hairstyleOptions = userGender === 'female' ? femaleHairstyleOptions : maleHairstyleOptions;
  
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
          icon="lock"
          disabled={true}
        />
        
        <FormField
          label="EYE COLOR"
          options={[
            { value: 'dark-brown', label: 'Dark Brown', color: '#5D4037' },
            { value: 'light-brown', label: 'Light Brown', color: '#A1887F' },
            { value: 'blue', label: 'Blue', color: '#2196F3' },
            { value: 'hazel', label: 'Hazel', gradient: 'linear-gradient(180deg, #215313 0%, #7B4A0A 100%)' },
            { value: 'green', label: 'Green', color: '#66BB6A' },
            { value: 'grey', label: 'Grey', color: '#9E9E9E' },
            { value: 'amber', label: 'Amber', color: '#FF8F00' },
            { value: 'heterochromia', label: 'Heterochromia', gradient: 'linear-gradient(180deg, #735735 50%, #128BE1 50%)' },
            { value: 'black', label: 'Black', color: '#000000' },
          ]}
        />
        
        <FormField
          label="HAIR COLOR"
          options={[
            { value: 'black', label: 'Black', color: '#000000' },
            { value: 'dark-brown', label: 'Dark Brown', color: '#3E2723' },
            { value: 'brown', label: 'Brown', color: '#5D4037' },
            { value: 'blonde', label: 'Blonde', color: '#bca99a' },
            { value: 'red', label: 'Red', color: '#BF360C' },
            { value: 'grey', label: 'Grey', color: '#9E9E9E' },
            { value: 'white', label: 'White', color: '#FFFFFF' },
            { value: 'purple', label: 'Purple', color: '#462c6b' },
            { value: 'blue', label: 'Blue', color: '#2196F3' },
            { value: 'green', label: 'Green', color: '#23845f' },
            { value: 'orange', label: 'Orange', color: '#d36609' },
            { value: 'pink', label: 'Pink', color: '#e36d86' },
            { value: 'pastel-pink', label: 'Pastel Pink', color: '#e0adb0' },
          ]}
        />
        
        <FormField
          label="HAIR LENGTH"
          options={[
            { value: 'bald', label: 'Bald/Shaved' },
            { value: 'short', label: 'Short' },
            { value: 'medium', label: 'Medium' },
            { value: 'long', label: 'Long' },
            { value: 'very-long', label: 'Very Long' },
          ]}
        />
        
        <FormField
          label="HAIR STYLE"
          options={hairstyleOptions}
        />
        
        <FormField
          label="AGE"
          options={[
            { value: '18-25', label: '18 to 25 years' },
            { value: '26-30', label: '26 to 30 years' },
            { value: '31-35', label: '31 to 35 years' },
            { value: '36-40', label: '36 to 40 years' },
            { value: '41-50', label: '41 to 50 years' },
            { value: '50+', label: 'Over 50 years' },
          ]}
        />
        
        <FormField
          label="BODY TYPE"
          options={[
            { value: 'slim', label: 'Slim' },
            { value: 'athletic', label: 'Athletic' },
            { value: 'average', label: 'Average' },
            { value: 'muscular', label: 'Muscular' },
            { value: 'plus-size', label: 'Plus Size' },
          ]}
        />
        
        <FormField
          label="HEIGHT"
          options={[
            { value: 'under-160', label: 'Under 160 cm' },
            { value: '160-170', label: '160 to 170 cm' },
            { value: '170-180', label: '170 to 180 cm' },
            { value: '180-190', label: '180 to 190 cm' },
            { value: 'over-190', label: 'Over 190 cm' },
          ]}
        />
        
        <FormField
          label="WEIGHT"
          options={[
            { value: 'under-60', label: 'Under 60 KG' },
            { value: '60-70', label: '60 to 70 KG' },
            { value: '71-80', label: '71 to 80 KG' },
            { value: '81-90', label: '81 to 90 KG' },
            { value: '91-100', label: '91 to 100 KG' },
            { value: 'over-100', label: 'Over 100 KG' },
          ]}
        />
        
        <FormField
          label="ETHNICITY"
          options={[
            { value: 'caucasian', label: 'Caucasian' },
            { value: 'black', label: 'Black' },
            { value: 'asian', label: 'Asian' },
            { value: 'hispanic', label: 'Hispanic' },
            { value: 'middle-eastern', label: 'Middle Eastern' },
            { value: 'indian', label: 'Indian' },
            { value: 'mixed', label: 'Mixed' },
          ]}
        />
        
        <FormField
          label="GLASSES"
          options={[
            { value: 'no', label: 'No glasses' },
            { value: 'yes', label: 'Glasses' },
          ]}
        />
      
        <div className={styles.footer}>
          <p className={styles.terms}>
            By generating, you understand your uploads influence the final result and agree to the{' '}
            <a href="#" className={styles.link}>Photo Requirements</a>,{' '}
            <a href="#" className={styles.link}>Terms</a>, and{' '}
            <a href="#" className={styles.link}>Privacy Policy</a>.
          </p>
          <button 
            type="submit"
            disabled={isSubmitting}
            className={styles.generateButton}
          >
            {isSubmitting ? 'Generating...' : 'Generate'}
            <ArrowRightIcon size={16} className={styles.buttonIcon} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;