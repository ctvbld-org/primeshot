'use client';

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { WebGLImageTransitionRef } from './WebGLImageTransition';

interface WebGLContextType {
  webGLRef: React.RefObject<WebGLImageTransitionRef>;
  triggerTransition: () => void;
}

const WebGLContext = createContext<WebGLContextType | null>(null);

export function WebGLProvider({ children }: { children: ReactNode }) {
  const webGLRef = useRef<WebGLImageTransitionRef>(null);
  
  const triggerTransition = () => {
    webGLRef.current?.transition();
  };

  return (
    <WebGLContext.Provider value={{ webGLRef, triggerTransition }}>
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGL() {
  const context = useContext(WebGLContext);
  if (!context) {
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}
