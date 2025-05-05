import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'has_seen_photo_requirements';

interface PhotoRequirementsHook {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasSeenRequirements: boolean;
}

function getFromStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return localStorage.getItem(key) === 'true';
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return false;
  }
}

function setToStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export function usePhotoRequirements(): PhotoRequirementsHook {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSeenRequirements, setHasSeenRequirements] = useState<boolean>(false);

  useEffect(() => {
    // Check if it's the first visit
    const hasSeenFromStorage = getFromStorage(STORAGE_KEY);
    setHasSeenRequirements(hasSeenFromStorage);
    if (!hasSeenFromStorage) {
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open === false) {
      // Mark as seen when closing
      setToStorage(STORAGE_KEY, 'true');
      setHasSeenRequirements(true);
    }
  }, []);

  return {
    isOpen,
    onOpenChange,
    hasSeenRequirements
  };
} 