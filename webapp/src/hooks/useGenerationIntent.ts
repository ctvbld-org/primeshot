import { useCallback } from 'react'

export interface GenerationIntent {
  requiredCredits: number
  timestamp: number
  actionType: string // e.g., 'generate_images'
  actionData?: any // Additional data needed to recreate the action
}

const INTENT_STORAGE_KEY = 'generation-intent'
const INTENT_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

export function useGenerationIntent() {
  const saveIntent = useCallback((requiredCredits: number, actionType: string = 'generate_images', actionData?: any) => {
    const intent: GenerationIntent = {
      requiredCredits,
      timestamp: Date.now(),
      actionType,
      actionData
    }
    
    // console.log('Saving generation intent:', { requiredCredits, actionType, actionData, timestamp: intent.timestamp })
    
    // Store intent in localStorage (survives page refresh and browser close)
    localStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify({
      requiredCredits,
      actionType,
      actionData,
      timestamp: intent.timestamp
    }))
  }, [])

  const getIntent = useCallback((): GenerationIntent | null => {
    try {
      const stored = localStorage.getItem(INTENT_STORAGE_KEY)
      if (!stored) {
        // console.log('No stored intent found')
        return null
      }
      
      const parsed = JSON.parse(stored)
      
      // console.log('Retrieved intent from storage:', { 
      //   parsed, 
      //   age: Date.now() - parsed.timestamp 
      // })
      
      // Check if intent has expired
      if (Date.now() - parsed.timestamp > INTENT_EXPIRY_MS) {
        // console.log('Intent expired, clearing')
        clearIntent()
        return null
      }
      
      // console.log('Intent found and valid')
      
      return {
        requiredCredits: parsed.requiredCredits,
        timestamp: parsed.timestamp,
        actionType: parsed.actionType || 'generate_images',
        actionData: parsed.actionData
      }
          } catch (error) {
        // console.log('Error parsing stored intent:', error)
        return null
      }
  }, [])

  const clearIntent = useCallback(() => {
    localStorage.removeItem(INTENT_STORAGE_KEY)
  }, [])

  const executeIntent = useCallback(async (actionExecutor?: (intent: GenerationIntent) => Promise<void>) => {
    const intent = getIntent()
    if (!intent) return false
    
    try {
      if (actionExecutor) {
        await actionExecutor(intent)
      } else {
        // Default action based on actionType
        console.log('Executing intent:', intent.actionType, intent.actionData)
        // The actual execution will be handled by the component that knows how to execute the action
      }
      clearIntent()
      return true
    } catch (error) {
      console.error('Failed to execute generation intent:', error)
      clearIntent()
      return false
    }
  }, [getIntent, clearIntent])

  return {
    saveIntent,
    getIntent,
    clearIntent,
    executeIntent
  }
}

 