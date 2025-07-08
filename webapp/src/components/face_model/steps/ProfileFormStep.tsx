'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/components/review/profile-form.module.css'
import FormField from '@/components/review/form-field'
import {
  PROFILE_FORM_FIELDS,
  FormFieldConfig,
  FEMALE_HAIRSTYLE_OPTIONS,
  MALE_HAIRSTYLE_OPTIONS,
} from '@/constants/profile-options'

interface ProfileFormStepProps {
  onProfileUpdate: (data: any) => void
}

// Create a new set of fields with gender as editable
const FACE_MODEL_FORM_FIELDS: FormFieldConfig[] = PROFILE_FORM_FIELDS.map(field => {
  if (field.name === 'gender') {
    return {
      ...field,
      disabled: false // Make gender editable
    }
  }
  return field
})

type FormData = {
  [K in FormFieldConfig['name']]: string;
}

export function ProfileFormStep({ onProfileUpdate }: ProfileFormStepProps) {
  const { t } = useTranslation('profile')
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Initialize all fields with empty strings first
    const initialData = FACE_MODEL_FORM_FIELDS.reduce((acc, field) => ({
      ...acc,
      [field.name]: ''
    }), {} as FormData)
    
    // Set default gender
    initialData.gender = 'male'
    
    return initialData
  })

  // Update parent component when form data changes
  useEffect(() => {
    // Only update if we have at least gender selected
    if (formData.gender) {
      onProfileUpdate(formData)
    }
  }, [formData, onProfileUpdate])

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add final details</h1>
        <p className={styles.subtitle}>
          Your details help refine photo accuracy, creating headshots that truly reflect you.
        </p>
      </div>
      
      <div className={styles.form}>
        {FACE_MODEL_FORM_FIELDS.map(field => {
          // Handle gender-specific options (like hairstyles)
          let options = field.options;
          if (field.genderSpecific) {
            options = formData.gender === 'female' ? FEMALE_HAIRSTYLE_OPTIONS : MALE_HAIRSTYLE_OPTIONS;
          }

          return (
            <FormField
              key={field.name}
              name={field.name}
              label={field.label}
              options={options}
              onFieldUpdate={handleFieldChange}
              value={formData[field.name]}
              disabled={false} // All fields are editable for face models
            />
          );
        })}
      </div>
    </div>
  )
}