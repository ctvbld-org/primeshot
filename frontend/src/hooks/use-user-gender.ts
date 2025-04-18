import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Gender } from '@/lib/types';

/**
 * Hook to fetch and provide the user's gender
 * Falls back to 'other' if not specified
 */
export function useUserGender() {
  const { user } = useAuth();
  const [gender, setGender] = useState<Gender>('other');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserGender() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('gender')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        // Set gender if available, otherwise default to 'other'
        if (data && data.gender) {
          setGender(data.gender as Gender);
        } else {
          setGender('other');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user gender:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user gender'));
        setGender('other'); // Default to 'other' on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserGender();
  }, [user, supabase]);

  return { gender, isLoading, error };
}

export default useUserGender; 