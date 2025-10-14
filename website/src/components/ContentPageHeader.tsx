'use client';

import React, { useEffect, useState, useRef } from 'react';

interface HeaderProps {
  title: string | React.ReactNode;
  backgroundImage?: string;
  className?: string;
}

export default function ContentPageHeader({ title, backgroundImage, className = "" }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = backgroundImage;
  }, [backgroundImage]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className={`w-full px-1 rounded-2xl sm:rounded-[28px] overflow-hidden h-[240px] sm:h-[340px] mt-5 relative ${className}`}
      >
        {/* Background image - always visible, no transition */}
        {backgroundImage && (
          <>
            <div 
              className="absolute inset-0 h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${backgroundImage}')` }}
            ></div>
            {/* Black overlay that fades OUT */}
            <div 
              className={`absolute inset-0 h-full w-full bg-black transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            ></div>
          </>
        )}
        {backgroundImage && (
          <div className="absolute inset-0 h-full w-full backdrop-blur-[40px] sm:backdrop-blur-[60px] md:backdrop-blur-[80px]"></div>
        )}
        <div className="absolute inset-0 px-6 h-full w-full bg-[#102B34] mix-blend-lighten"></div>
        <div className="absolute inset-0 h-full w-full bg-[url('/noise.png')] bg-repeat mix-blend-color-dodge" style={{ backgroundSize: '130px 130px' }}></div>
        <div className="max-w-screen-xl mx-auto h-full relative z-10 flex items-end justify-start text-left px-6 pb-6 xl:pb-12 mix-blend-lighten">
          <h1 className={`font-carb-bold tracking-tightest text-mist leading-none text-5xl sm:text-[68px] md:text-[88px] transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>{title}</h1>
        </div>
      </div>
    </div>
  );
}
