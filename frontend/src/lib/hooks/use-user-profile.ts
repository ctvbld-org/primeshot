import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cacheData, getCachedData, generateCacheKey } from '@/lib/cache';

// Define the UserProfile interface
interface UserProfile {
  full_name: string | null;
  gender: 'male' | 'female' | null;
}

// Cache TTL for user profiles
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useUserProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Check cache first
      const cacheKey = generateCacheKey('userProfile', { userId });
      const cachedProfile = getCachedData<UserProfile>(cacheKey);
      
      if (cachedProfile) {
        return cachedProfile;
      }
      
      // Not in cache, make database query
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('full_name, gender')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // Cache the profile data
      if (data) {
        cacheData(cacheKey, data, PROFILE_CACHE_TTL);
      }
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user profile');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, profile: Partial<UserProfile>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('users')
        .update(profile)
        .eq('id', userId);

      if (error) throw error;
      
      // Clear profile cache after update
      const cacheKey = generateCacheKey('userProfile', { userId });
      cacheData.clear(cacheKey);
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update user profile');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchProfile,
    updateProfile,
    isLoading,
    error
  };
}

export default useUserProfile; 