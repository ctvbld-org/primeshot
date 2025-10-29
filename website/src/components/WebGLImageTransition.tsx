'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface WebGLImageTransitionProps {
  images: string[];
  duration?: number;
  easing?: string;
}

export interface WebGLImageTransitionRef {
  transition: () => void;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float progress;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform vec4 resolution;
  uniform float imageAspect;

  varying vec2 vUv;
  varying vec4 vPosition;

  void main() {
    // Cover-corrected UV for image sampling
    float screenRatio = resolution.x / resolution.y;
    float scaleX = 1.0;
    float scaleY = 1.0;
    if (screenRatio > imageAspect) {
      scaleY = imageAspect / screenRatio;
    } else {
      scaleX = screenRatio / imageAspect;
    }
    vec2 coverUV = (vUv - 0.5) * vec2(scaleX, scaleY) + 0.5;

    // Aspect-ratio-corrected UV for transition only
    float aspect = resolution.x / resolution.y;
    vec2 transitionUV = vec2(coverUV.x, (coverUV.y - 0.5) * aspect + 0.5);

    float x = progress;
    x = smoothstep(0.0, 1.0, (x * 2.0 + transitionUV.y - 1.0));
    vec4 f = mix(
      texture2D(texture1, (coverUV - 0.5) * (1.0 - x) + 0.5), 
      texture2D(texture2, (coverUV - 0.5) * x + 0.5), 
      x
    );
    gl_FragColor = f;
  }
`;

const WebGLImageTransition = forwardRef<WebGLImageTransitionRef, WebGLImageTransitionProps>(({ 
  images, 
  duration = 1.5, 
  easing = 'easeOut' 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [opacity, setOpacity] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get stable viewport height that accounts for mobile browser UI
  const getStableViewportHeight = () => {
    // Use visual viewport API if available (more stable on mobile)
    if (window.visualViewport) {
      return window.visualViewport.height;
    }
    // Fallback to document.documentElement.clientHeight
    return document.documentElement.clientHeight;
  };

  // Get stable viewport width
  const getStableViewportWidth = () => {
    if (window.visualViewport) {
      return window.visualViewport.width;
    }
    return document.documentElement.clientWidth;
  };

  // Scene refs to persist between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const texturesRef = useRef<THREE.Texture[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializingRef = useRef(false);

  // Add a ref to track the actual displayed index
  const displayedIndexRef = useRef(0);

  // Transition function
  const transition = () => {
    if (!materialRef.current || !texturesRef.current.length) {
      return;
    }
    
    // If there's an ongoing transition, update our displayed index to what we were transitioning to
    if (materialRef.current.uniforms.progress.value > 0) {
      gsap.killTweensOf(materialRef.current.uniforms.progress);
      // Update the base texture to what we were transitioning to
      materialRef.current.uniforms.texture1.value = materialRef.current.uniforms.texture2.value;
      materialRef.current.uniforms.progress.value = 0;
      // Update the displayed index to what we were transitioning to
      const interruptedIndex = (displayedIndexRef.current + 1) % images.length;
      displayedIndexRef.current = interruptedIndex;
      setCurrentIndex(interruptedIndex);
    }
    
    // Always move to the next image in sequence
    const nextIndex = (displayedIndexRef.current + 1) % images.length;
    const nextTexture = texturesRef.current[nextIndex];
    
    if (materialRef.current && nextTexture) {
      // Create a new texture for the transition
      const transitionTexture = new THREE.Texture(nextTexture.image);
      transitionTexture.minFilter = THREE.LinearFilter;
      transitionTexture.magFilter = THREE.LinearFilter;
      transitionTexture.needsUpdate = true;
      
      materialRef.current.uniforms.texture2.value = transitionTexture;

      gsap.to(materialRef.current.uniforms.progress, {
        value: 1,
        duration,
        ease: easing,
        onComplete: () => {
          if (!materialRef.current) return;
          // Update texture1 with the transition texture
          materialRef.current.uniforms.texture1.value = transitionTexture;
          materialRef.current.uniforms.progress.value = 0;
          // Update both the state and ref
          setCurrentIndex(nextIndex);
          displayedIndexRef.current = nextIndex;
        },
      });
    }
  };

  // Initialize displayedIndexRef when component mounts
  useEffect(() => {
    displayedIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Expose transition method via ref
  useImperativeHandle(ref, () => ({
    transition: () => {
      transition();
    }
  }));

  // Cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (planeRef.current) {
      planeRef.current.geometry.dispose();
    }
    if (materialRef.current) {
      materialRef.current.dispose();
    }
    texturesRef.current.forEach(texture => {
      if (texture && texture.image) {
        texture.dispose();
      }
    });
    if (rendererRef.current) {
      rendererRef.current.dispose();
      const canvas = rendererRef.current.domElement;
      canvas.parentElement?.removeChild(canvas);
    }
    
    sceneRef.current = null;
    cameraRef.current = null;
    rendererRef.current = null;
    materialRef.current = null;
    planeRef.current = null;
    texturesRef.current = [];
    animationFrameRef.current = null;
    isInitializingRef.current = false;
    setIsInitialized(false);
  };

  useEffect(() => {
    if (!containerRef.current || isInitialized || isInitializingRef.current) return;
    
    isInitializingRef.current = true;

    // Add a small delay to ensure mobile browser UI is settled
    const initTimeout = setTimeout(() => {
      try {
        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Orthographic camera setup using stable viewport dimensions
        const width = getStableViewportWidth();
        const height = getStableViewportHeight();
        const camera = new THREE.OrthographicCamera(
          width / -2, width / 2, height / 2, height / -2, 0, 10
        );
        camera.position.set(0, 0, 1);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ 
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        
        // Style the canvas
        const canvas = renderer.domElement;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.right = '0';
        canvas.style.bottom = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0'; // Start with opacity 0
        canvasRef.current = canvas;
        
        // Append to the slider div
        const slider = containerRef.current?.closest('#slider');
        if (slider) {
          const existingCanvas = slider.querySelector('canvas');
          if (existingCanvas) {
            existingCanvas.remove();
          }
          slider.appendChild(canvas);
        } else if (containerRef.current) {
          containerRef.current.appendChild(canvas);
        }
        rendererRef.current = renderer;

        // Create empty textures first
        const createEmptyTexture = () => {
          const texture = new THREE.Texture();
          texture.needsUpdate = true;
          return texture;
        };

        // Initialize with empty textures
        const initialTextures = images.map(() => createEmptyTexture());
        texturesRef.current = initialTextures;

        // Material setup with initial empty textures
        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            progress: { value: 0 },
            texture1: { value: initialTextures[0] },
            texture2: { value: initialTextures[1] },
            resolution: { value: new THREE.Vector4() },
            imageAspect: { value: 1.0 },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
        });
        materialRef.current = material;

        // Geometry setup
        const geometry = new THREE.PlaneGeometry(width, height, 2, 2);
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);
        planeRef.current = plane;

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        
        const loadTexture = (url: string, index: number) => {
          return new Promise<void>((resolve, reject) => {
            textureLoader.load(
              url,
              (loadedTexture) => {
                const newTexture = new THREE.Texture(loadedTexture.image);
                newTexture.minFilter = THREE.LinearFilter;
                newTexture.magFilter = THREE.LinearFilter;
                newTexture.needsUpdate = true;
                
                texturesRef.current[index] = newTexture;
                
                if (materialRef.current) {
                  if (index === currentIndex) {
                    materialRef.current.uniforms.texture1.value = newTexture;
                  } else if (index === (currentIndex + 1) % images.length) {
                    materialRef.current.uniforms.texture2.value = newTexture;
                  }
                }
                
                resolve();
              },
              undefined,
              (error) => {
                reject(error);
              }
            );
          });
        };

        // Load all textures
        Promise.all(images.map((url, index) => loadTexture(url, index)))
          .then(() => {
            // Initial resize
            handleResize();

            // Start animation
            animate();

            setIsLoading(false);
            setIsInitialized(true);
            
            // Fade in the canvas
            if (canvasRef.current) {
              gsap.to(canvasRef.current, {
                opacity: 1,
                duration: 0.6,
                ease: "sine.in",
                onStart: () => {
                  setOpacity(1); // Update state for container
                }
              });
            }
          })
          .catch(() => {
            setIsLoading(false);
            cleanup();
          });

        // Handle resize with stable viewport dimensions
        const handleResize = () => {
          if (!rendererRef.current || !cameraRef.current || !materialRef.current || !planeRef.current || !texturesRef.current[0]) return;

          const width = getStableViewportWidth();
          const height = getStableViewportHeight();

          rendererRef.current.setSize(width, height);
          // Update orthographic camera
          cameraRef.current.left = width / -2;
          cameraRef.current.right = width / 2;
          cameraRef.current.top = height / 2;
          cameraRef.current.bottom = height / -2;
          cameraRef.current.updateProjectionMatrix();

          // Image aspect ratio
          const imageWidth = texturesRef.current[0].image.width;
          const imageHeight = texturesRef.current[0].image.height;
          const imageAspect = imageWidth / imageHeight;
          
          // Update material uniforms with image aspect ratio
          materialRef.current.uniforms.imageAspect.value = imageAspect;
          
          // Resize plane geometry to match viewport
          planeRef.current.geometry.dispose();
          planeRef.current.geometry = new THREE.PlaneGeometry(width, height, 2, 2);
          planeRef.current.position.set(0, 0, 0);

          // Update resolution uniform for proper UV mapping
          materialRef.current.uniforms.resolution.value.set(width, height, width / height, 1);
        };

        // Use visualViewport API for more stable resize handling on mobile
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', handleResize);
          window.visualViewport.addEventListener('scroll', handleResize);
        } else {
          window.addEventListener('resize', handleResize);
        }

        // Animation loop
        let time = 0;
        const animate = () => {
          if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

          time += 0.05;
          materialRef.current.uniforms.time.value = time;
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Cleanup
        return () => {
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
            window.visualViewport.removeEventListener('scroll', handleResize);
          } else {
            window.removeEventListener('resize', handleResize);
          }
          cleanup();
        };

      } catch {
        setIsLoading(false);
        cleanup();
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [currentIndex, images, isInitialized]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        cursor: isLoading ? 'wait' : 'default',
        backgroundColor: isLoading ? '#0c1013' : 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: opacity,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* No loading overlay */}
    </div>
  );
});

WebGLImageTransition.displayName = 'WebGLImageTransition';

export default WebGLImageTransition; 