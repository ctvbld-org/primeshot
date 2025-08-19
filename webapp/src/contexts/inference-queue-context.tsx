'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useInferenceQueueWithProgress } from '@/hooks/useInferenceQueue';

type InferenceQueueContextType = ReturnType<typeof useInferenceQueueWithProgress>;

const InferenceQueueContext = createContext<InferenceQueueContextType | null>(null);

interface InferenceQueueProviderProps {
  children: ReactNode;
}

export function InferenceQueueProvider({ children }: InferenceQueueProviderProps) {
  const inferenceQueue = useInferenceQueueWithProgress();

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

