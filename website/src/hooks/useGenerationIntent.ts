'use client'

import { useCallback } from 'react'

export interface GenerationIntent {
  requiredCredits: number
  timestamp: number
  actionType: string // e.g., 'subscribe', 'generate_images'
  actionData?: any // Additional data needed to recreate the action
}

const INTENT_STORAGE_KEY = 'generation-intent'
const INTENT_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

export function useGenerationIntent() {
  const saveIntent = useCallback((requiredCredits: number, actionType: string = 'subscribe', actionData?: any) => {
    const intent: GenerationIntent = {
      requiredCredits,
      timestamp: Date.now(),
      actionType,
      actionData
    }
    
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
        return null
      }
      
      const parsed = JSON.parse(stored)
      
      // Check if intent has expired
      if (Date.now() - parsed.timestamp > INTENT_EXPIRY_MS) {
        clearIntent()
        return null
      }
      
      return {
        requiredCredits: parsed.requiredCredits,
        timestamp: parsed.timestamp,
        actionType: parsed.actionType || 'subscribe',
        actionData: parsed.actionData
      }
    } catch (error) {
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

