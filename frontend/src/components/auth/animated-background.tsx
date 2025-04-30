import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import styles from './animated-background.module.css';

interface AnimatedBackgroundProps {
  className?: string;
}

interface GridItem {
  type: 'image' | 'text';
  content: {
    title?: string;
    description?: string;
    classes?: string;
    imageUrl?: string;
    overlayImageUrl?: string; // For text items background
  };
}

const GRID_ITEMS: GridItem[] = [
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/business-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/business-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/business-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-3.webp'
    }
  },

  // Second row
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'text', 
    content: {
      title: 'Fast Generation',
      description: 'Create unique photos within minutes',
      classes: 'bg-[#001514] text-white justify-end',
      overlayImageUrl: '/api/app-images?path=app-images/placeholders/male/business-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'text',
    content: {
      description: '<svg width="121" height="121" viewBox="0 0 121 121" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.1904 63.0103C26.1904 67.7109 27.1162 72.3657 28.915 76.7085C30.7139 81.0513 33.351 84.997 36.6748 88.3208C39.9987 91.6447 43.9443 94.2817 48.2871 96.0806C52.6299 97.8794 57.2847 98.8052 61.9854 98.8052V114.195C55.2638 114.195 48.6074 112.871 42.3975 110.298C36.1877 107.726 30.5457 103.955 25.793 99.2026C21.0402 94.4499 17.2695 88.8079 14.6973 82.5981C12.125 76.3882 10.8008 69.7318 10.8008 63.0103H26.1904ZM92.5908 78.313H61.9844V63.0103H77.2881V27.1284H92.5908V78.313ZM52.2227 7.60498C57.614 7.60498 61.9853 11.9754 61.9854 17.3667C61.9854 22.7581 57.614 27.1284 52.2227 27.1284C46.8315 27.1282 42.4609 22.7579 42.4609 17.3667C42.461 11.9756 46.8316 7.60522 52.2227 7.60498Z" fill="black"/></svg>',
      classes: 'bg-[#00CC99] justify-center',
      overlayImageUrl: '/api/app-images?path=app-images/placeholders/female/business-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },

  // Third row
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/business-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'text',
    content: {
      title: 'Maximum Customisation',
      description: 'Mix and match multiple options to fulfil your needs',
      classes: 'bg-[#FFB45E] text-black',
      overlayImageUrl: '/api/app-images?path=app-images/placeholders/male/business-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-3.webp'
    }
  },

  // Fourth row
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/business-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/business-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/business-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-1.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/male/outdoor-fashion-2.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-3.webp'
    }
  },
  { 
    type: 'image', 
    content: { 
      imageUrl: '/api/app-images?path=app-images/placeholders/female/outdoor-fashion-2.webp'
    }
  },
];

// Animation constants
const FRICTION = 0.90;
const MOMENTUM_MULTIPLIER = -20;
const VELOCITY_MULTIPLIER = -0.8;
const SPRING_STRENGTH = 0.015;
const MAX_VELOCITY = 20;
const STOP_THRESHOLD = 0.01;
const RETURN_TO_CENTER_THRESHOLD = 1.2;
const SMOOTHING_FACTOR = 0.15;
const RETURN_SPRING_STRENGTH = 0.03;

// Animation timing constants
const INITIAL_DELAY = 500; // Wait for page load
const ITEM_DELAY = 100; // Delay between items
const CONTENT_DELAY = 400; // Delay between content animations

export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [momentum, setMomentum] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTime = useRef<number>(Date.now());
  const bounds = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const isMoving = useRef<boolean>(false);
  const animationFrame = useRef<number | undefined>(undefined);
  const lastMoveTime = useRef<number>(Date.now());
  const targetPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseInViewport = useRef<boolean>(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Handle page load
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setIsPageLoaded(true), INITIAL_DELAY);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Update bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      bounds.current = {
        width: window.innerWidth * 0.35,
        height: window.innerHeight * 0.35
      };
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Handle mouse movement and viewport exit
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      isMouseInViewport.current = true;
      const currentTime = Date.now();
      const deltaTime = Math.min(currentTime - lastTime.current, 50);
      
      if (deltaTime === 0) return;
      
      // Calculate mouse velocity with extra smoothing
      const velocityX = (e.clientX - lastMousePos.current.x) / deltaTime;
      const velocityY = (e.clientY - lastMousePos.current.y) / deltaTime;
      
      // Set target position with smoothing
      targetPosition.current = {
        x: position.x + velocityX * VELOCITY_MULTIPLIER,
        y: position.y + velocityY * VELOCITY_MULTIPLIER
      };
      
      // Update momentum with extra smoothing
      setMomentum(prev => ({
        x: (prev.x * (1 - SMOOTHING_FACTOR) + velocityX * MOMENTUM_MULTIPLIER * SMOOTHING_FACTOR),
        y: (prev.y * (1 - SMOOTHING_FACTOR) + velocityY * MOMENTUM_MULTIPLIER * SMOOTHING_FACTOR)
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = currentTime;
      lastMoveTime.current = currentTime;
      
      isMoving.current = true;
    };

    const handleMouseLeave = () => {
      isMouseInViewport.current = false;
      // Reset momentum when mouse leaves viewport
      setMomentum({ x: 0, y: 0 });
      lastMoveTime.current = Date.now() - 1000; // Force return to center behavior
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [position]);

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - lastMoveTime.current;
      
      // Smooth movement towards target position
      if (isMoving.current && isMouseInViewport.current) {
        setPosition(prev => ({
          x: prev.x + (targetPosition.current.x - prev.x) * SMOOTHING_FACTOR,
          y: prev.y + (targetPosition.current.y - prev.y) * SMOOTHING_FACTOR
        }));
      }
      
      // Return to center behavior
      if (timeSinceLastMove > 150 || !isMouseInViewport.current) {
        const distanceFromCenter = Math.sqrt(position.x ** 2 + position.y ** 2);
        const shouldReturnToCenter = distanceFromCenter > RETURN_TO_CENTER_THRESHOLD || !isMouseInViewport.current;
        
        if (shouldReturnToCenter) {
          const springStrength = !isMouseInViewport.current ? RETURN_SPRING_STRENGTH : SPRING_STRENGTH;
          const springX = -position.x * springStrength;
          const springY = -position.y * springStrength;
          
          setMomentum(prev => ({
            x: (prev.x + springX) * FRICTION,
            y: (prev.y + springY) * FRICTION
          }));
        }
      }
      
      // Apply momentum with bounds
      setPosition(prev => {
        let newX = prev.x + momentum.x * SMOOTHING_FACTOR;
        let newY = prev.y + momentum.y * SMOOTHING_FACTOR;
        
        // Smooth bounds checking
        if (Math.abs(newX) > bounds.current.width) {
          newX = bounds.current.width * Math.sign(newX);
          setMomentum(prev => ({ ...prev, x: 0 }));
        }
        if (Math.abs(newY) > bounds.current.height) {
          newY = bounds.current.height * Math.sign(newY);
          setMomentum(prev => ({ ...prev, y: 0 }));
        }
        
        return { x: newX, y: newY };
      });
      
      // Update momentum with friction
      setMomentum(prev => ({
        x: prev.x * FRICTION,
        y: prev.y * FRICTION
      }));
      
      // Check if movement has effectively stopped
      const totalMovement = Math.abs(momentum.x) + Math.abs(momentum.y);
      isMoving.current = totalMovement > STOP_THRESHOLD;
      
      // Continue animation if moving or not centered
      if (isMoving.current || Math.abs(position.x) > 0.5 || Math.abs(position.y) > 0.5) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [momentum, position]);

  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(50.57%_98.94%_at_49.33%_0%,rgba(0,0,0,0.70)_0%,rgba(0,0,0,0.90)_100%)] z-10" />

      {/* Animated Background */}
      <div
        ref={containerRef}
        className="absolute inset-[-15%]"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
        <div className="flex flex-col items-start justify-center gap-2 p-2">
          {Array.from({ length: Math.ceil(GRID_ITEMS.length / 8.5) }).map((_, rowIndex) => {
            let startIndex = 0;
            for (let i = 0; i < rowIndex; i++) {
              startIndex += i % 2 === 0 ? 8 : 9;
            }
            
            const itemCount = rowIndex % 2 === 0 ? 8 : 9;
            const rowItems = GRID_ITEMS.slice(startIndex, startIndex + itemCount);
            
            if (rowItems.length === 0) return null;
            
            return (
              <div 
                key={`row-${rowIndex}`} 
                className="flex flex-nowrap items-start justify-center gap-2"
                style={{ 
                  width: '100%',
                  minWidth: '100vw'
                }}
              >
                {rowItems.map((item: GridItem, colIndex: number) => {
                  const imageDelay = isPageLoaded ? ITEM_DELAY * (rowIndex * colIndex) : 0;
                  
                  // For text items, calculate content animation delay based on their position
                  const contentDelay = item.type === 'text' 
                    ? imageDelay + CONTENT_DELAY
                    : 0;
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={cn(
                        "aspect-square rounded-[36px] overflow-hidden",
                        styles.gridItem,
                        isPageLoaded && styles.animate
                      )}
                      style={{ 
                        width: '300px',
                        height: '300px',
                        flex: '0 0 300px',
                        animationDelay: `${imageDelay}ms`,
                        '--content-delay': `${contentDelay}ms`
                      } as React.CSSProperties}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.content.imageUrl}
                          alt="Headshot example"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <img
                            src={item.content.overlayImageUrl}
                            alt="Headshot example"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div 
                            className={cn(
                              "w-full h-full p-8 flex flex-col rounded-[36px]",
                              item.content.classes,
                              styles.textContent
                            )}
                            style={{ animationDelay: `${contentDelay}ms` }}
                          >
                            <h3 className="text-[30px] leading-[34px] mb-2">{item.content.title}</h3>
                            {item.content.description?.startsWith('<svg') ? (
                              <div 
                                className="flex justify-center items-center"
                                dangerouslySetInnerHTML={{ __html: item.content.description }} 
                              />
                            ) : (
                              <p className="text-[18px] font-light opacity-80 leading-[22px]">{item.content.description}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 