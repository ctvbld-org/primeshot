import { useMemo } from 'react';
import { filterStylesByGender } from '../utils/get-styles-images';
import { useAuth } from '@/contexts/auth-context';
import { Gender } from '../types';

/**
 * Hook that filters an array of styles based on the current user's gender
 * If no user is logged in or no gender is specified, returns all styles
 * 
 * @param styles Array of style objects with availableGenders property
 * @param overrideGender Optional gender to override the user's gender
 * @returns Filtered array of styles
 */
export function useGenderFilter<T extends { availableGenders?: Gender[] }>(
  styles: T[],
  overrideGender?: Gender
): T[] {
  // Get user from auth context
  const { user } = useAuth();
  const userGender = user?.gender as Gender | undefined;
  
  // Use the override gender if provided, otherwise use the user's gender
  const gender = overrideGender || userGender;
  
  return useMemo(() => {
    return filterStylesByGender(styles, gender);
  }, [styles, gender]);
}

export default useGenderFilter; 