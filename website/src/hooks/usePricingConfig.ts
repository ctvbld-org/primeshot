// Stub for website
export function useCreditCosts() {
  return {
    data: null,
    isLoading: false
  }
}

export function useSubscriptionTiers() {
  return {
    data: [],
    isLoading: false
  }
}

export function getCharacterTrainingCost(creditCosts: any) {
  return 100 // Default for demo
}

export function getCharacterLimit(subscription: any) {
  return 5 // Default for demo
}

export function calculateImageCredits(quality: string, takes: number, costs: any) {
  return 10 // Default for demo
}

