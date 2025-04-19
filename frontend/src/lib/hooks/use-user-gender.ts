import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Gender } from '@/lib/types';

/**
 * Hook to fetch and provide the user's gender
 * Returns null if not specified
 */
export function useUserGender() {
  const { user } = useAuth();
  const [gender, setGender] = useState<Gender | null>(null); 
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();
  // State to track if the initial load has completed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      if (gender !== null) setGender(null);
      // Ensure loading is false if no user
      if (!initialLoadComplete) setIsLoading(false);
      setInitialLoadComplete(true); 
      return;
    }
    
    let isMounted = true;

    async function fetchUserGender() {
      // Only set loading true on the very first fetch attempt
      if (!initialLoadComplete) {
         setIsLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('gender')
          .eq('id', userId)
          .single();
          
        if (!isMounted) return;
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const newGender = data?.gender as Gender | null;
        
        if (newGender !== gender) {
          setGender(newGender);
        }
        setError(null);
        
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching user gender:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user gender'));
        if (gender !== null) { 
          setGender(null); 
        }
      } finally {
        if (isMounted) {
          // Always mark loading as false and initial load as complete after the first attempt
          setIsLoading(false);
          setInitialLoadComplete(true);
        }
      }
    }

    fetchUserGender();
    
    return () => {
      isMounted = false;
    };
    
    // Rerun if userId changes, but not based on gender/isLoading state itself
  }, [user?.id, supabase]); 

  return { gender, isLoading, error };
}

export default useUserGender; 