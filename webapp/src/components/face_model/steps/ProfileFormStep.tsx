'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/components/review/profile-form.module.css'
import FormField from '@/components/review/form-field'
import {
  PROFILE_FORM_FIELDS,
  FormFieldConfig,
} from '@/constants/profile-options'
import { 
  useProfileAutoPopulation, 
  getAutoPopulatedFormData,
  isFieldAutoDetected,
  getFieldConfidence 
} from '@/hooks/useProfileAutoPopulation'
import { ImageQualityResult } from '@/lib/image-quality'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@primeshot/common/web/ui/tooltip'

interface ProfileFormStepProps {
  onProfileUpdate: (data: any, isComplete: boolean) => void
  imageAnalysisResult?: ImageQualityResult
  enableAutoPopulation?: boolean
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

export function ProfileFormStep({ 
  onProfileUpdate, 
  imageAnalysisResult,
  enableAutoPopulation = true 
}: ProfileFormStepProps) {
  const { t } = useTranslation('profile')
  
  // Get auto-populated values from image analysis
  const autoPopulationResult = useProfileAutoPopulation({
    imageAnalysisResult,
    enableAutoPopulation,
  })
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Initialize all fields with empty strings first
    const initialData = FACE_MODEL_FORM_FIELDS.reduce((acc, field) => ({
      ...acc,
      [field.name]: ''
    }), {} as FormData) 
    
    return initialData
  })
  
  // Function to check if all required fields are populated
  const isFormComplete = (data: FormData): boolean => {
    return FACE_MODEL_FORM_FIELDS.every(field => {
      const value = data[field.name]
      return value && value.trim() !== ''
    })
  }
  
  // Apply auto-populated values when they become available
  useEffect(() => {
    if (enableAutoPopulation && imageAnalysisResult) {
      const autoFormData = getAutoPopulatedFormData(autoPopulationResult, 0.7) // Increased from 0.5 to 0.7 for higher confidence
      if (Object.keys(autoFormData).length > 0) {
        setFormData(prev => ({ ...prev, ...autoFormData }))
      }
    }
  }, [autoPopulationResult, enableAutoPopulation, imageAnalysisResult])

  // Update parent component when form data changes
  useEffect(() => {
    const isComplete = isFormComplete(formData)
    onProfileUpdate(formData, isComplete)
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
          const isAutoDetected = isFieldAutoDetected(autoPopulationResult, field.name)
          const confidence = getFieldConfidence(autoPopulationResult, field.name)
          
          // Enhanced label with auto-detection indicator
          let enhancedLabel: React.ReactNode = field.label;
          if (isAutoDetected && confidence > 0.7) {
            enhancedLabel = (
              <>
                {field.label}{' '}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span style={{ cursor: 'pointer' }}>✨</span>
                    </TooltipTrigger>
                    <TooltipContent>Auto detected</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            );
          }

          return (
            <FormField
              key={field.name} 
              name={field.name}
              label={enhancedLabel}
              options={field.options}
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