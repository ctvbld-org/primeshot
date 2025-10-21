import { createClient } from '@/lib/supabase/client';
import { useCallback } from 'react';
import type { Character } from '@/types/jobs';

const supabase = createClient();

export interface CreateCharacterRequest {
  user_id: string;
  name: string;
  thumbnail_url?: string;
}

export interface CreateCharacterResponse {
  character: Character;
}

class CharactersApiClient {
  async createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse> {
    const { data: character, error } = await supabase
      .from('characters')
      .insert({
        user_id: request.user_id,
        name: request.name,
        thumbnail_url: request.thumbnail_url,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create character: ${error.message}`);
    }

    return { character: character };
  }

  async getCharactersByIds(ids: string[]): Promise<Pick<Character, 'id' | 'name' | 'thumbnail_url'>[]> {
    if (!ids || ids.length === 0) return [];
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];

    const { data, error } = await supabase
      .from('characters')
      .select('id, name, thumbnail_url')
      .in('id', unique);

    if (error) {
      throw new Error(`Failed to fetch characters by ids: ${error.message}`);
    }

    return (data || []) as any;
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted') // Return all non-deleted characters for display
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch characters: ${error.message}`);
    }

    return characters || [];
  }

  async getActiveCharacterCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('characters')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .not('status', 'in', '(failed,deleted)'); // Count queued, training, and ready characters

    if (error) {
      throw new Error(`Failed to count active characters: ${error.message}`);
    }

    return count || 0;
  }

  async getCharacter(characterId: string, userId: string): Promise<Character | null> {
    const { data: character, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', userId)
      .neq('status', 'deleted') // Exclude soft-deleted characters
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch character: ${error.message}`);
    }

    return character;
  }

  async updateCharacterStatus(characterId: string, status: Character['status']): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (error) {
      throw new Error(`Failed to update character status: ${error.message}`);
    }
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    // Use server-side cleanup route to delete S3 folder and related records, then soft delete character
    const { getApiUrl } = await import('@primeshot/common');
    const response = await fetch(getApiUrl('api/cleanup-character'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to delete character: ${response.status} ${text}`);
    }
  }
}

// Export singleton instance
export const charactersApi = new CharactersApiClient();

// Hook for React components
export function useCharactersApi() {
  const createCharacter = useCallback(async (request: CreateCharacterRequest): Promise<CreateCharacterResponse> => {
    try {
      return await charactersApi.createCharacter(request);
    } catch (error) {
      console.error('Failed to create character:', error);
      throw error;
    }
  }, []);

  const getUserCharacters = useCallback(async (userId: string): Promise<Character[]> => {
    try {
      return await charactersApi.getUserCharacters(userId);
    } catch (error) {
      console.error('Failed to get user characters:', error);
      throw error;
    }
  }, []);

  const getCharactersByIds = useCallback(async (ids: string[]): Promise<Pick<Character, 'id' | 'name' | 'thumbnail_url'>[]> => {
    try {
      return await charactersApi.getCharactersByIds(ids);
    } catch (error) {
      console.error('Failed to get characters by ids:', error);
      throw error;
    }
  }, []);

  const getActiveCharacterCount = useCallback(async (userId: string): Promise<number> => {
    try {
      return await charactersApi.getActiveCharacterCount(userId);
    } catch (error) {
      console.error('Failed to get active character count:', error);
      throw error;
    }
  }, []);

  const getCharacter = useCallback(async (characterId: string, userId: string): Promise<Character | null> => {
    try {
      return await charactersApi.getCharacter(characterId, userId);
    } catch (error) {
      console.error('Failed to get character:', error);
      throw error;
    }
  }, []);

  const updateCharacterStatus = useCallback(async (characterId: string, status: Character['status']): Promise<void> => {
    try {
      return await charactersApi.updateCharacterStatus(characterId, status);
    } catch (error) {
      console.error('Failed to update character status:', error);
      throw error;
    }
  }, []);

  const deleteCharacter = useCallback(async (characterId: string, userId: string): Promise<void> => {
    try {
      return await charactersApi.deleteCharacter(characterId, userId);
    } catch (error) {
      console.error('Failed to delete character:', error);
      throw error;
    }
  }, []);

  return {
    createCharacter,
    getUserCharacters,
    getActiveCharacterCount,
    getCharacter,
    updateCharacterStatus,
    deleteCharacter,
    getCharactersByIds,
  };
}