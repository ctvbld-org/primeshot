'use client';

import WebGLImageTransition from "./WebGLImageTransition";
import { useWebGL } from "./WebGLContext";

interface WebGLBackgroundProps {
  images: string[];
}

export function WebGLBackground({ images }: WebGLBackgroundProps) {
  const { webGLRef } = useWebGL();

  return (
    <div 
      id="slider" 
      className="fixed inset-0 w-full h-full z-0"
      style={{
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        overflow: 'hidden',
      }}
    >
      <WebGLImageTransition 
        ref={webGLRef} 
        images={images} 
        duration={1.6}
        easing="power2.out"
      />
    </div>
  );
}

export function TransitionButton() {
  const { triggerTransition } = useWebGL();
  
  return (
    <div className="w-16 h-16 rounded-full p-[3px] border-2 border-white/80 select-none">
      <button
        onClick={triggerTransition}
        className="bg-ignite hover:bg-frost active:bg-ignite rounded-full w-[54px] h-[54px] transition-colors"
      > 
      </button>
    </div>
  );
}