// Stub file - website doesn't use character creation
// This prevents the website build from importing webapp's useCreateCharacter

interface UseCreateCharacterProps {
  characters: any[]
  onSelectCharacter: (modelId: string) => void
  refreshCharacters: () => void
}

type ActionType = 'auth' | 'subscription' | 'upgrade_subscription' | 'credit_pack' | 'upgrade_or_credit_pack' | 'limit_reached' | 'create'

export function useCreateCharacter(_props: UseCreateCharacterProps) {
  return {
    createCharacterAction: { 
      type: 'auth' as ActionType, 
      message: 'Create',
      credits: 0
    },
    handleCreateCharacterClick: () => {},
    requiresCreditsForTraining: false,
    trainingCost: 0,
    remainingIncludedTrainings: 0,
    isOnHighestTier: false
  }
}
