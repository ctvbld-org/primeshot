'use client';

import dynamic from 'next/dynamic';

const WebGLImageTransition = dynamic(
  () => import('./WebGLImageTransition'),
  { ssr: false }
);

interface WebGLBackgroundProps {
  images: string[];
}

export default function WebGLBackground({ images }: WebGLBackgroundProps) {
  return <WebGLImageTransition images={images} />;
} 