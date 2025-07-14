import { useMemo } from 'react'
import { ImageQualityResult } from '@/lib/image-quality'

interface AutoPopulatedField {
  value: string
  confidence: number
  isAutoDetected: boolean
}

interface AutoPopulationResult {
  gender?: AutoPopulatedField
  ageRange?: AutoPopulatedField
  bodyType?: AutoPopulatedField
}

interface UseProfileAutoPopulationProps {
  imageAnalysisResult?: ImageQualityResult
  enableAutoPopulation?: boolean
}

export function useProfileAutoPopulation({
  imageAnalysisResult,
  enableAutoPopulation = true,
}: UseProfileAutoPopulationProps): AutoPopulationResult {
  
  return useMemo(() => {
    if (!enableAutoPopulation || !imageAnalysisResult) {
      return {}
    }

    const result: AutoPopulationResult = {}

    // Gender auto-population
    if (imageAnalysisResult.detectedGender) {
      result.gender = {
        value: imageAnalysisResult.detectedGender,
        confidence: 0.8, // Default confidence for gender detection
        isAutoDetected: true,
      }
    }

    // Age range auto-population
    if (imageAnalysisResult.detectedAgeRange) {
      result.ageRange = {
        value: imageAnalysisResult.detectedAgeRange,
        confidence: imageAnalysisResult.confidenceScores?.age ?? 0.7,
        isAutoDetected: true,
      }
    }

    // Eye color and hair color detection removed - unreliable with canvas analysis

    // Glasses auto-population removed - detection unreliable

    // Body type auto-population
    if (imageAnalysisResult.detectedBodyType) {
      result.bodyType = {
        value: imageAnalysisResult.detectedBodyType,
        confidence: imageAnalysisResult.confidenceScores?.bodyType ?? 0.4,
        isAutoDetected: true,
      }
    }

    return result
  }, [imageAnalysisResult, enableAutoPopulation])
}

// Helper function to get auto-populated form data
export function getAutoPopulatedFormData(
  autoPopulationResult: AutoPopulationResult,
  minConfidence: number = 0.5
): Record<string, string> {
  const formData: Record<string, string> = {}

  Object.entries(autoPopulationResult).forEach(([fieldName, fieldData]) => {
    if (fieldData && fieldData.confidence >= minConfidence) {
      formData[fieldName === 'ageRange' ? 'age' : fieldName] = fieldData.value
    }
  })

  return formData
}

// Helper function to check if a field is auto-detected
export function isFieldAutoDetected(
  autoPopulationResult: AutoPopulationResult,
  fieldName: string
): boolean {
  const mappedFieldName = fieldName === 'age' ? 'ageRange' : fieldName
  return autoPopulationResult[mappedFieldName as keyof AutoPopulationResult]?.isAutoDetected ?? false
}

// Helper function to get confidence for a field
export function getFieldConfidence(
  autoPopulationResult: AutoPopulationResult,
  fieldName: string
): number {
  const mappedFieldName = fieldName === 'age' ? 'ageRange' : fieldName
  return autoPopulationResult[mappedFieldName as keyof AutoPopulationResult]?.confidence ?? 0
} 