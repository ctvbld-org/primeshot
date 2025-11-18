'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './ContentPageHeader.module.css';

interface HeaderProps {
  title: string | React.ReactNode;
  backgroundImage?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ContentPageHeader({ title, backgroundImage, className = "", children }: HeaderProps) {
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
    <div className={styles.wrapper + ' ' + (children && styles.hasChildren)}>
      <div 
        ref={containerRef}
        className={`${styles.container} ${className}`}
      >
        {/* Background image - always visible, no transition */}
        {backgroundImage && (
          <>
            <div 
              className={styles.backgroundImage}
              style={{ backgroundImage: `url('${backgroundImage}')` }}
            ></div>
            {/* Black overlay that fades OUT */}
            <div 
              className={`${styles.blackOverlay} ${imageLoaded ? styles.loaded : styles.loading}`}
            ></div>
          </>
        )}
        {backgroundImage && (
          <div className={styles.blurLayer}></div>
        )}
        <div className={styles.colorLayer}></div>
        <div className={styles.noiseLayer}></div>
        <div className={styles.contentWrapper}>
          <h1 className={`${styles.title} ${isVisible ? styles.visible : styles.hidden}`}>{title}</h1>
        </div>
        {children && (
          <div className={styles.childrenWrapper}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
