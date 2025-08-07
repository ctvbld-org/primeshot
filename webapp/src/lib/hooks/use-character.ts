import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCharactersApi } from '@/lib/api/characters';
import type { Character } from '@/types/jobs';

interface UseCharacterOptions {
  orderId?: string;
  autoCreate?: boolean;
}

interface UseCharacterReturn {
  character: Character | null;
  isLoading: boolean;
  error: string | null;
  createCharacter: (name?: string) => Promise<Character>;
  /**
   * Update the status of a character.
   * If characterId is provided, it is used directly – this allows callers to
   * update status immediately after creating a model before local state has
   * re-rendered. Otherwise the hook's current character id is used.
   */
  updateStatus: (
    status: Character['status'],
    characterId?: string
  ) => Promise<void>;
  isCreating: boolean;
}

export function useCharacter(options: UseCharacterOptions = {}): UseCharacterReturn {
  const { orderId, autoCreate = false } = options;
  const { user } = useAuth();
  const { createCharacter: createCharacterApi, updateCharacterStatus } = useCharactersApi();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCharacter = useCallback(async (name?: string): Promise<Character> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsCreating(true);
    setError(null);

    try {
      const characterName = name || `Training Session ${new Date().toLocaleDateString()}`;
      const response = await createCharacterApi({
        user_id: user.id,
        name: characterName,
      });

      setCharacter(response.character);
      return response.character;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create character';
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }, [user?.id, createCharacterApi]);

  const updateStatus = useCallback(
    async (
      status: Character['status'],
      characterId?: string
    ): Promise<void> => {
      const targetId = characterId ?? character?.id;

      if (!targetId) {
        throw new Error('No character to update');
      }

      try {
        await updateCharacterStatus(targetId, status);

        // Update local state only if we are updating the currently stored model
        if (!characterId || characterId === character?.id) {
          setCharacter(prev => (prev ? { ...prev, status } : prev));
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to update character status';
        setError(message);
        throw new Error(message);
      }
    },
    [character?.id, updateCharacterStatus]
  );

  // Auto-create character if enabled and user is available
  useEffect(() => {
    if (autoCreate && user?.id && !character && !isCreating && !isLoading) {
      // Wrap in local async function to avoid adding createCharacter to deps
      const run = async () => {
        try {
          await createCharacter();
        } catch (err) {
          console.error('Auto-create character failed:', err);
        }
      };

      run();
    }
    // We intentionally omit createCharacter from dependencies to prevent effect loops
     
  }, [autoCreate, user?.id, character, isCreating, isLoading]);

  return {
    character,
    isLoading,
    error,
    createCharacter,
    updateStatus,
    isCreating,
  };
}