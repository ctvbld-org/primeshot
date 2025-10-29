'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useInfiniteInferenceJobsWithProgress } from '@/hooks/useInfiniteInferenceJobsWithProgress';

type InferenceQueueContextType = ReturnType<typeof useInfiniteInferenceJobsWithProgress>;

const InferenceQueueContext = createContext<InferenceQueueContextType | null>(null);

interface InferenceQueueProviderProps {
  children: ReactNode;
}

export function InferenceQueueProvider({ children }: InferenceQueueProviderProps) {
  const inferenceQueue = useInfiniteInferenceJobsWithProgress();

  return (
    <InferenceQueueContext.Provider value={inferenceQueue}>
      {children}
    </InferenceQueueContext.Provider>
  );
}

export function useInferenceQueue() {
  const context = useContext(InferenceQueueContext);
  if (!context) {
    throw new Error('useInferenceQueue must be used within an InferenceQueueProvider');
  }
  return context;
}

// Optional accessor that returns null when provider is missing.
// Useful for components that can function with a fallback (e.g., read-only props)
export function useOptionalInferenceQueue() {
  return useContext(InferenceQueueContext);
}

