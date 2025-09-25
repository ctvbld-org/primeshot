'use client';

import { WebGLProvider } from "./WebGLContext";

interface HomePageWrapperProps {
  children: React.ReactNode;
}

export function HomePageWrapper({ children }: HomePageWrapperProps) {
  return (
    <WebGLProvider>
      {children}
    </WebGLProvider>
  );
}
