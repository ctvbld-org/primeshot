'use client';

// Early guard to detect server-side environment
const isServer = typeof window === 'undefined';

// If we are running on the server, we short-circuit the heavy browser-only logic
// with safe fallbacks so that static prerendering and other SSR phases don't
// crash when `window` or other DOM APIs are unavailable.

// Stubbed result for server usage
const SERVER_STUB_RESULT = {
  width: 0,
  height: 0,
  faceCount: 0,
  score: 100,
  faceScore: 100,
  bodyScore: 100,
  brightnessScore: 100,
  contrastScore: 100,
  blurScore: 100,
  resolutionScore: 100,
  hasSingleFace: false,
  hasGoodResolution: true,
  hasGoodScore: true,
  isAcceptable: true,
  hasFace: false,
  hasBody: false,
  faceDetectionSkipped: true,
  issues: [] as string[],
  eyesVisible: true,
  eyeDetectionSkipped: true,
} as const;

// Using dynamic import for face-api.js to ensure it only loads on the client side
let faceapi: any = null;

// Define types for facial landmarks based on face-api.js structure
interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface WithFaceLandmarks<T> {
  detection: FaceDetection;
  landmarks: any;
}

// Constants for quality checks
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 1000;
const MIN_BRIGHTNESS = 0.3;
const MAX_BRIGHTNESS = 0.8;
const MIN_CONTRAST = 0.15; // Reduced from 0.4 - more realistic threshold
const MAX_BLUR = 0.15; // Reduced from 0.5 - more realistic threshold

// Constants for body detection
const MIN_BODY_COUNT = 2; // Minimum 2 images with body shots
const MAX_BODY_PERCENTAGE = 0.80; // 80% maximum for body shots

// Add after other constants
const MIN_EYE_CONFIDENCE = 0.3;
const MIN_EYE_BRIGHTNESS = 0.12;
const MIN_EYE_CONTRAST = 0.15;
const MAX_DARKNESS_RATIO = 0.6;
const MIN_BRIGHTNESS_VARIANCE = 0.05;
const MAX_COLOR_UNIFORMITY = 0.8; // Maximum allowed color uniformity (for detecting tinted lenses)
const EYE_REGION_SIZE = 25;

// Age detection constants
const MIN_AGE_CONFIDENCE = 0.6; // Minimum confidence for age detection

// NEW BLUR DETECTION:
// - Multiple detection algorithms: Variance of Laplacian, Tenengrad, Brenner, Modified Laplacian
// - Face-region focused analysis when face is detected
// - Normalized 0-1 range with calibrated thresholds  
// - Blur weight remains at 25% of total score
// - Acceptance threshold remains at 0.75

// Contrast detection constants
const MIN_ACCEPTABLE_CONTRAST = 0.05; // Minimum contrast to avoid completely flat images
const MIN_SUBJECT_BACKGROUND_SEPARATION = 0.05; // Minimum separation between subject and background (relaxed)
const FACE_PERIMETER_SAMPLE_WIDTH = 20; // Width of sampling area around face perimeter

// Subject-background separation penalty tiers (AGGRESSIVE penalties for portrait quality):
// < 5%: Almost guaranteed failure (max score 0.35)
// 5-7%: Major penalty (max score 0.45) 
// 7-10%: Significant penalty (max score 0.55)
// Also weighted at 45% of total contrast calculation

// Initialize face-api models
let modelsLoaded = false;
let modelsLoading = false;
let modelLoadError = false;

export async function loadModels() {
  if (isServer) {
    // Skip model loading during SSR/prerendering
    return false;
  }
  if (modelsLoaded) return true;
  if (modelsLoading) {
    // Wait for loading to complete
    let attempts = 0;
    while (modelsLoading && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    return !modelLoadError;
  }
  
  modelsLoading = true;
  
  try {
    // Dynamically import face-api.js
    if (!faceapi) {
      const faceApiModule = await import('face-api.js');
      faceapi = faceApiModule as any; // Simplified assignment to avoid .default issues
    }
    
    console.log('Starting to load face detection models...');
    // Use CloudFront distribution URL for models
    const modelPath = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/face-models`;
    
    // Check if models are available at the path
    try {
      //console.log(`Loading TinyFaceDetector from ${modelPath}`);
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      //console.log('TinyFaceDetector loaded successfully');
      
      //console.log(`Loading FaceLandmark68Net from ${modelPath}`);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
      //console.log('FaceLandmark68Net loaded successfully');
      
      // Note: We no longer preload SSD MobileNet. It will be loaded lazily
      // only if TinyFaceDetector fails to detect a face.

      // AgeGenderNet removed: we no longer perform age/gender inference
      
      console.log('All face detection models loaded successfully');
    } catch (loadError) {
      console.error('Error loading models:', loadError);
      console.log('Model loading failed. Error details:', loadError);
      throw loadError;
    }
    
    modelsLoaded = true;
    modelLoadError = false;
    return true;
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    console.log('Model loading failed completely. Error details:', error);
    modelLoadError = true;
    return false;
  } finally {
    modelsLoading = false;
  }
}

// Quality analysis result interface
export interface ImageQualityResult {
  // Basic image properties
  width: number;
  height: number;
  faceCount: number;
  // Normalized face bounding box for primary face (0..1 coordinates)
  faceBox?: { x: number; y: number; width: number; height: number };
  
  // Scores
  score: number;
  faceScore: number;
  bodyScore: number;
  brightnessScore: number;
  contrastScore: number;
  blurScore: number;
  resolutionScore: number;
  
  // Status flags
  hasSingleFace: boolean;
  hasGoodResolution: boolean;
  hasGoodScore: boolean;
  isAcceptable: boolean;
  hasFace: boolean;
  hasBody: boolean;
  faceDetectionSkipped: boolean;
  
  // Removed age/gender/bodyType/glasses metadata
  
  // Additional info
  issues: string[];
  
  // New properties
  eyesVisible: boolean;
  eyeDetectionSkipped: boolean;
}

// Analyze image quality using face-api.js and browser canvas
export async function analyzeImageQuality(file: File, options?: { petMode?: boolean }): Promise<ImageQualityResult> {
  if (isServer) {
    // Return a stubbed "acceptable" result so server code relying on the
    // structure still works without errors.
    return SERVER_STUB_RESULT as any;
  }
  let modelsReady = false;
  const petMode = !!options?.petMode;
  
  try {
    modelsReady = await loadModels();
  } catch (error) {
    console.error('Failed to load face detection models, will skip face detection:', error);
    modelsReady = false;
  }
  
  // Create an image element for analysis
  const img = await createImageElement(file);
  const width = img.width;
  const height = img.height;
  
  // Initialize result
  const result: ImageQualityResult = initializeResult(width, height);
  
  // Check resolution - HARD REQUIREMENT (not part of scoring)
  result.hasGoodResolution = width >= MIN_WIDTH && height >= MIN_HEIGHT;
  if (!result.hasGoodResolution) {
    // Early rejection for resolution - don't bother with other analysis
    result.resolutionScore = 0; // Keep for compatibility but not used in scoring
    result.issues.push(`Low resolution image. Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT}px.`);
    result.isAcceptable = false;
    
    console.log('Image rejected due to insufficient resolution:', `${width}x${height} < ${MIN_WIDTH}x${MIN_HEIGHT}`);
    
    // Return early - no point analyzing other aspects
    return result;
  } else {
    result.resolutionScore = 1; // Perfect score when requirements are met
  }
  
  // Face detection
  let faceDetectionPerformed = false;
  let primaryFaceDetection: WithFaceLandmarks<{ detection: FaceDetection }> | null = null;
  
  if (!petMode && modelsReady && faceapi) {
    try {
      // First try with TinyFaceDetector with lower threshold
      const faceDetections = await faceapi.detectAllFaces(
        img, 
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })
      ).withFaceLandmarks();
      
      // Set faceCount based on TinyFaceDetector results
      result.faceCount = faceDetections.length;
      
      // Store primary face detection for contrast analysis
      if (faceDetections.length > 0) {
        primaryFaceDetection = faceDetections[0];
      }
      
      // Only proceed with body detection if we have at least one face
      if (faceDetections.length > 0) {
        // Detect body presence by checking face position and size relative to image
        const faceBox = faceDetections[0].detection.box;
        const faceArea = faceBox.width * faceBox.height;
        const imageArea = img.width * img.height;
        const faceRelativeSize = faceArea / imageArea;
        const faceBottomY = faceBox.y + faceBox.height;
        const spaceBelow = (img.height - faceBottomY) / img.height;
        
        // Consider it a body shot if:
        // 1. Face takes up less than 15% of the image area AND
        // 2. There's significant space below the face (at least 40% of image height) AND
        // 3. Face is positioned in the upper 35% of the image
        const hasBody = faceRelativeSize < 0.15 && // Face should be smaller for body shots
          spaceBelow > 0.4 && // Significant space below face for body
          faceBox.y < img.height * 0.35; // Face in upper portion
        
        result.hasBody = hasBody;
        result.bodyScore = hasBody ? 1 : 0;
      } else {
        result.hasBody = false;
        result.bodyScore = 0;
      }
      
      // If no faces detected, try SSD MobileNet as a fallback with lower threshold
      if (faceDetections.length === 0) {
        // Load SSD model lazily if needed (not preloaded)
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          const ssdModelPath = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/face-models`;
          await faceapi.nets.ssdMobilenetv1.loadFromUri(ssdModelPath);
        }
        
        // Detect with SSD model with a very low confidence threshold
        const ssdDetections = await faceapi.detectAllFaces(
          img,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })
        ).withFaceLandmarks();
        
        console.log('SSD MobileNet face detection results:', ssdDetections.length > 0 ? 'Face detected' : 'No face detected');
        
          if (ssdDetections.length > 0) {
          // SSD found faces that TinyFaceDetector missed
          faceDetectionPerformed = true;
          result.hasFace = true;
          result.faceCount = ssdDetections.length;
          
          // Store primary face detection for contrast analysis
          primaryFaceDetection = ssdDetections[0];
          
          // Use the largest face if multiple are detected
          if (ssdDetections.length > 1) {
            // Sort by face box area (largest first)
            ssdDetections.sort((a: WithFaceLandmarks<{ detection: FaceDetection }>, b: WithFaceLandmarks<{ detection: FaceDetection }>) => {
              const areaA = a.detection.box.width * a.detection.box.height;
              const areaB = b.detection.box.width * b.detection.box.height;
              return areaB - areaA;
            });
            
            result.faceScore = evaluateFacePosition(ssdDetections[0], width, height);
            result.issues.push('Multiple faces detected.');
          } else {
            result.faceScore = evaluateFacePosition(ssdDetections[0], width, height);
          }
          
            // Attach normalized face box for server-side thumbnail hints
            const fb = ssdDetections[0].detection.box;
            const bx = Math.max(0, fb.x) / width;
            const by = Math.max(0, fb.y) / height;
            const bw = Math.min(width, fb.width) / width;
            const bh = Math.min(height, fb.height) / height;
            result.faceBox = {
              x: Math.min(1, Math.max(0, bx)),
              y: Math.min(1, Math.max(0, by)),
              width: Math.min(1, Math.max(0, bw)),
              height: Math.min(1, Math.max(0, bh))
            };
          
          if (result.faceScore < 0.7) {
            result.issues.push('Face position is not optimal.');
          }
          
          // Update body detection for SSD results
          const ssdFaceBox = ssdDetections[0].detection.box;
          const ssdFaceArea = ssdFaceBox.width * ssdFaceBox.height;
          const ssdFaceRelativeSize = ssdFaceArea / (width * height);
          const ssdFaceBottomY = ssdFaceBox.y + ssdFaceBox.height;
          const ssdSpaceBelow = (height - ssdFaceBottomY) / height;
          
          result.hasBody = ssdFaceRelativeSize < 0.15 && 
            ssdSpaceBelow > 0.4 &&
            ssdFaceBox.y < height * 0.35;
          result.bodyScore = result.hasBody ? 1 : 0;
          
          return result;
        }
        
        // Last resort: try SSD MobileNet without landmarks
        try {
          console.log('Trying SSD MobileNet without landmarks as last resort');
          const rawFaceDetections = await faceapi.detectAllFaces(
            img,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 })
          );
          
          if (rawFaceDetections.length > 0) {
            console.log('SSD MobileNet (raw) detected faces:', rawFaceDetections.length);
            faceDetectionPerformed = true;
            result.hasFace = true;
            result.faceCount = rawFaceDetections.length;
                        
            // Since we don't have landmarks, estimate face score based on size and position
            const face = rawFaceDetections[0];
            // Attach normalized face box from raw detection
            if (face?.box) {
              const bx = Math.max(0, face.box.x) / width;
              const by = Math.max(0, face.box.y) / height;
              const bw = Math.min(width, face.box.width) / width;
              const bh = Math.min(height, face.box.height) / height;
              result.faceBox = {
                x: Math.min(1, Math.max(0, bx)),
                y: Math.min(1, Math.max(0, by)),
                width: Math.min(1, Math.max(0, bw)),
                height: Math.min(1, Math.max(0, bh))
              };
            }
            const relativeSize = (face.box.width * face.box.height) / (width * height);
            const centerX = face.box.x + face.box.width / 2;
            const centerY = face.box.y + face.box.height / 2;
            
            // Simplified position evaluation
            const distFromCenterX = Math.abs(centerX - width/2) / width;
            const distFromCenterY = Math.abs(centerY - height/2) / height;
            const positionScore = 1 - (distFromCenterX + distFromCenterY);
            
            // Simplified size score
            let sizeScore = 0;
            if (relativeSize < 0.05) {
              sizeScore = relativeSize * 20;
            } else if (relativeSize > 0.7) {
              sizeScore = 1 - (relativeSize - 0.7) * 3.33;
            } else {
              sizeScore = 1;
            }
            
            result.faceScore = Math.min(1, Math.max(0.4, (sizeScore * 0.6 + positionScore * 0.4)));
            result.issues.push('Face detection succeeded using fallback method. Results may vary.');
          }
        } catch (rawDetectionError) {
          console.error('Error with raw face detection:', rawDetectionError);
          // Continue with the regular flow
        }
      }
      
      faceDetectionPerformed = true;
      
      if (faceDetections.length === 0) {
        // No face detected - mark as an issue
        result.hasFace = false;
        result.faceCount = 0;
        result.faceScore = 0.1; // Very low score for no face
        result.issues.push('No face detected.');
        // gender detection removed
      } else if (faceDetections.length > 1) {
        result.hasFace = true;
        result.faceCount = faceDetections.length;
        result.issues.push('Multiple faces detected.');
        result.faceScore = 0.5;
        // gender detection removed
      } else {
        // One face detected
        result.hasFace = true;
        result.faceCount = 1;
        
        // Evaluate face position and size
        result.faceScore = evaluateFacePosition(faceDetections[0], width, height);
        
        if (result.faceScore < 0.7) {
          result.issues.push('Face position is not optimal.');
        }
        
        // Check for eye visibility and analyze eye color
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const eyeCheck = await checkEyesVisible(img, faceDetections[0].landmarks, ctx);
          result.eyesVisible = eyeCheck.visible;
          result.eyeDetectionSkipped = false;
          
          if (!eyeCheck.visible) {
            if (eyeCheck.confidence > MIN_EYE_CONFIDENCE) {
              // Record as an issue, but do not hard-reject here. Scoring already penalizes covered eyes.
              result.issues.push('Eyes are not clearly visible (possibly covered by sunglasses or hair)');
            } else {
              // If confidence is low, add a warning but don't reject
              result.issues.push('Eye visibility could not be determined with high confidence');
            }
          }
                    
        }
      }
    } catch (error) {
      console.error('Face/body/gender detection error:', error);
      result.hasBody = false;
      result.bodyScore = 0;
      result.faceDetectionSkipped = true;
      // gender detection removed
      result.hasFace = false; 
      result.faceCount = 0;
      result.faceScore = 0.5; // Give a medium score as fallback
      result.issues.push('Face/body/gender detection was skipped.');
    }
  } else if (!petMode) {
    // Models not available
    result.hasBody = false;
    result.bodyScore = 0;
    result.faceDetectionSkipped = true;
    // gender detection removed
    result.hasFace = false;
    result.faceCount = 0;
    result.faceScore = 0.5; // Medium fallback score when face detection is skipped
    result.issues.push('Face/body/gender detection was skipped.');
  } else {
    // Pet mode: skip human face/eye detection entirely
    result.hasBody = false;
    result.bodyScore = 0;
    result.faceDetectionSkipped = true;
    result.hasFace = false;
    result.faceCount = 0;
    result.faceScore = 0.7; // neutral-passing when skipped
    result.eyeDetectionSkipped = true;
  }
  
  // Analyze image stats using canvas
  const stats = await analyzeImageStats(img, primaryFaceDetection);
  
  // Check brightness
  result.brightnessScore = calculateBrightnessScore(stats.brightness);
  if (result.brightnessScore < 0.7) {
    if (stats.brightness < MIN_BRIGHTNESS) {
      result.issues.push('Image is too dark.');
    } else if (stats.brightness > MAX_BRIGHTNESS) {
      result.issues.push('Image is too bright.');
    }
  }
  
  // Check contrast
  result.contrastScore = calculateContrastScore(stats.contrast, stats.subjectBackgroundSeparation);
  if (result.contrastScore < 0.5) { // Further reduced to be more forgiving
    // Check if the issue is specifically subject-background separation
    if (stats.subjectBackgroundSeparation !== undefined && stats.subjectBackgroundSeparation < MIN_SUBJECT_BACKGROUND_SEPARATION) {
      if (stats.subjectBackgroundSeparation < 0.03) {
        result.issues.push('Subject and background are nearly identical in tone - use a strongly contrasting background.');
      } else if (stats.subjectBackgroundSeparation < 0.05) {
        result.issues.push('Subject and background are too similar in tone - consider using a contrasting background.');
      } else {
        result.issues.push('Subject and background could be more distinct - try a different background color.');
      }
    } else {
      result.issues.push('Image has poor contrast or appears too flat.');
    }
  }
  

  
   // Check blur
  result.blurScore = calculateBlurScore(stats.blurValue);
  const passesBlurTest = result.blurScore >= 0.5; // Relaxed from 0.8
  
  // Remove hard auto-reject for blur: keep as warning and rely on overall score
  // This prevents portrait-mode bokeh (sharp subject, blurry background) from failing outright.
  
  if (!passesBlurTest) {
    result.issues.push('Image appears to be blurry or lacks sufficient detail.');
  }
  

  
  // Calculate overall score
  const rawOverallScore = calculateOverallScore(result);
  result.score = rawOverallScore * 100; // Convert to 0-100 scale
  
  // Determine if image is acceptable
  result.isAcceptable = isAcceptable(result, { petMode });
  
  // Clean up
  URL.revokeObjectURL(img.src);
  
  // Attach normalized face box from primary detection if available
  if (primaryFaceDetection) {
    const fb = primaryFaceDetection.detection.box;
    const bx = Math.max(0, fb.x) / width;
    const by = Math.max(0, fb.y) / height;
    const bw = Math.min(width, fb.width) / width;
    const bh = Math.min(height, fb.height) / height;
    result.faceBox = {
      x: Math.min(1, Math.max(0, bx)),
      y: Math.min(1, Math.max(0, by)),
      width: Math.min(1, Math.max(0, bw)),
      height: Math.min(1, Math.max(0, bh))
    };
  }
  
  return result;
}

// Helper functions
async function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function evaluateFacePosition(detection: WithFaceLandmarks<{ detection: FaceDetection }>, imgWidth: number, imgHeight: number): number {
  const face = detection.detection;
  const relativeSize = (face.box.width * face.box.height) / (imgWidth * imgHeight);
  
  // Check if face is centered
  const centerX = face.box.x + face.box.width / 2;
  const centerY = face.box.y + face.box.height / 2;
  const imgCenterX = imgWidth / 2;
  const imgCenterY = imgHeight / 2;
  
  const distanceFromCenter = Math.sqrt(
    Math.pow((centerX - imgCenterX) / imgWidth, 2) + 
    Math.pow((centerY - imgCenterY) / imgHeight, 2)
  );
  
  // Ideal face size is 10-70% of the image (more lenient than before)
  let sizeScore = 0;
  if (relativeSize < 0.05) {
    sizeScore = relativeSize * 20; // Too small
  } else if (relativeSize > 0.7) {
    sizeScore = 1 - (relativeSize - 0.7) * 3.33; // Too large
  } else {
    sizeScore = 1; // Good size
  }
  
  // Ideal position is centered, but we're more lenient here
  const positionScore = 1 - distanceFromCenter * 2;
  
  return Math.min(1, Math.max(0, (sizeScore * 0.6 + positionScore * 0.4)));
}

async function analyzeImageStats(img: HTMLImageElement, faceDetection: WithFaceLandmarks<{ detection: FaceDetection }> | null = null) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate brightness
  let totalBrightness = 0;
  const pixelCount = data.length / 4; // RGBA values
  
  // For variance calculations (contrast)
  let rSum = 0, gSum = 0, bSum = 0;
  let rSquaredSum = 0, gSquaredSum = 0, bSquaredSum = 0;
  
  // For improved contrast calculation
  const brightnessValues: number[] = [];
  let minBrightness = 1;
  let maxBrightness = 0;
  
  // Loop through all pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate relative luminance
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;
    brightnessValues.push(brightness);
    
    // Track brightness range for better contrast calculation
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    
    // For variance calculations (legacy method)
    rSum += r;
    gSum += g;
    bSum += b;
    
    rSquaredSum += r * r;
    gSquaredSum += g * g;
    bSquaredSum += b * b;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Legacy contrast calculation (variance-based)
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  
  const rVariance = rSquaredSum / pixelCount - (rMean * rMean);
  const gVariance = gSquaredSum / pixelCount - (gMean * gMean);
  const bVariance = bSquaredSum / pixelCount - (bMean * bMean);
  
  // Average variance (legacy contrast)
  const avgVariance = (rVariance + gVariance + bVariance) / 3;
  const legacyContrast = Math.sqrt(avgVariance) / 255;
  
  // Improved contrast calculation: combination of range and standard deviation
  const brightnessRange = maxBrightness - minBrightness;
  
  // Calculate brightness standard deviation
  let brightnessVariance = 0;
  for (const brightness of brightnessValues) {
    brightnessVariance += Math.pow(brightness - avgBrightness, 2);
  }
  brightnessVariance /= pixelCount;
  const brightnessStdDev = Math.sqrt(brightnessVariance);
  
  // Combine range and standard deviation for a more robust contrast measure
  const improvedContrast = (brightnessRange * 0.6) + (brightnessStdDev * 0.4);
  
  // Calculate subject-background separation (portrait-specific contrast)
  const subjectBackgroundSeparation = calculateSubjectBackgroundSeparation(canvas, faceDetection);
  
  // Combine all contrast measures with weighted importance
  // For portraits, subject-background separation is crucial
  const weights = {
    improved: 0.4,    // Reduced from 0.5
    legacy: 0.15,     // Reduced from 0.2
    separation: 0.45  // Increased from 0.3 - now the dominant factor!
  };
  
  const finalContrast = (
    improvedContrast * weights.improved +
    legacyContrast * weights.legacy +
    subjectBackgroundSeparation * weights.separation
  );
  
  // Use the maximum of individual methods vs weighted combination for robustness
  const contrast = Math.max(finalContrast, Math.max(improvedContrast, legacyContrast));
  

  
  // Calculate blur using multiple detection methods with face-region focus
  const blurValue = detectBlur(canvas, faceDetection);
  
  return {
    brightness: avgBrightness,
    contrast: contrast,
    blurValue: blurValue,
    subjectBackgroundSeparation: subjectBackgroundSeparation
  };
}

// NEW: Multiple blur detection methods for better sensitivity
function detectBlur(canvas: HTMLCanvasElement, faceDetection: WithFaceLandmarks<{ detection: FaceDetection }> | null = null): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Compute face-focused blur when a face is available
  let faceBlur: number | null = null;
  if (faceDetection) {
    faceBlur = detectFaceRegionBlur(canvas, faceDetection);
  }
  
  // Multiple full-image blur detection algorithms (background may be intentionally blurred)
  const results = {
    varianceOfLaplacian: detectBlurVarianceOfLaplacian(canvas),
    tenengrad: detectBlurTenengrad(canvas),
    brenner: detectBlurBrenner(canvas),
    modifiedLaplacian: detectBlurModifiedLaplacian(canvas)
  };
  
  // Combine multiple methods with weighting
  const combinedScore = (
    results.varianceOfLaplacian * 0.3 +
    results.tenengrad * 0.25 +
    results.brenner * 0.25 +
    results.modifiedLaplacian * 0.2
  );
  
  const globalScore = Math.min(0.95, combinedScore);
  
  // Prefer the sharper face region over globally blurred backgrounds (portrait-mode bokeh)
  if (faceBlur !== null) {
    return Math.min(0.95, Math.max(faceBlur, globalScore));
  }
  
  return globalScore;
}

// Face-region focused blur detection
function detectFaceRegionBlur(canvas: HTMLCanvasElement, faceDetection: WithFaceLandmarks<{ detection: FaceDetection }>): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const face = faceDetection.detection.box;
  
  // Add margin but stay within image bounds
  const margin = 20;
  const x = Math.max(0, face.x - margin);
  const y = Math.max(0, face.y - margin);
  const width = Math.min(canvas.width - x, face.width + 2 * margin);
  const height = Math.min(canvas.height - y, face.height + 2 * margin);
  
  // Extract face region
  const faceImageData = ctx.getImageData(x, y, width, height);
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = width;
  faceCanvas.height = height;
  const faceCtx = faceCanvas.getContext('2d', { willReadFrequently: true });
  if (!faceCtx) return 0;
  
  faceCtx.putImageData(faceImageData, 0, 0);
  
  // Apply multiple methods to face region
  const faceResults = {
    varianceOfLaplacian: detectBlurVarianceOfLaplacian(faceCanvas),
    tenengrad: detectBlurTenengrad(faceCanvas),
    brenner: detectBlurBrenner(faceCanvas)
  };
  
  // Weight face-specific methods
  return (
    faceResults.varianceOfLaplacian * 0.4 +
    faceResults.tenengrad * 0.35 +
    faceResults.brenner * 0.25
  );
}

// Method 1: Variance of Laplacian (improved version)
function detectBlurVarianceOfLaplacian(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  // Apply Laplacian kernel: [0, -1, 0; -1, 4, -1; 0, -1, 0]
  let sum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian = 
        -gray[idx - width] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + width];
      sum += laplacian * laplacian;
      count++;
    }
  }
  
  const variance = count > 0 ? sum / count : 0;
  
  // Normalize to 0-1 range (recalibrated based on test data)
  const normalized = Math.min(1, variance / 200);
  
  return normalized;
}

// Method 2: Tenengrad variance (gradient-based)
function detectBlurTenengrad(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  // Sobel operators
  let sum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel X
      const gx = 
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];
      
      // Sobel Y  
      const gy =
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
         1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      sum += magnitude * magnitude;
      count++;
    }
  }
  
  const tenengrad = count > 0 ? sum / count : 0;
  
  // Normalize to 0-1 range (recalibrated)
  const normalized = Math.min(1, tenengrad / 5000);
  
  return normalized;
}

// Method 3: Brenner gradient
function detectBlurBrenner(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  let sum = 0;
  let count = 0;
  
  // Brenner focus measure: (f(x+2,y) - f(x,y))^2
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 2; x++) {
      const idx = y * width + x;
      const diff = gray[idx + 2] - gray[idx];
      sum += diff * diff;
      count++;
    }
  }
  
  const brenner = count > 0 ? sum / count : 0;
  
  // Normalize to 0-1 range (recalibrated)
  const normalized = Math.min(1, brenner / 200);
  
  return normalized;
}

// Method 4: Modified Laplacian
function detectBlurModifiedLaplacian(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  let sum = 0;
  let count = 0;
  
  // Modified Laplacian: |2*f(x,y) - f(x-1,y) - f(x+1,y)| + |2*f(x,y) - f(x,y-1) - f(x,y+1)|
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      const horizontal = Math.abs(2 * gray[idx] - gray[idx - 1] - gray[idx + 1]);
      const vertical = Math.abs(2 * gray[idx] - gray[idx - width] - gray[idx + width]);
      
      sum += horizontal + vertical;
      count++;
    }
  }
  
  const modifiedLaplacian = count > 0 ? sum / count : 0;
  
  // Normalize to 0-1 range (recalibrated) 
  const normalized = Math.min(1, modifiedLaplacian / 20);
  
  return normalized;
}

function calculateBrightnessScore(brightness: number): number {
  if (brightness < MIN_BRIGHTNESS) {
    return brightness / MIN_BRIGHTNESS;
  } else if (brightness > MAX_BRIGHTNESS) {
    return 1 - (brightness - MAX_BRIGHTNESS) / (1 - MAX_BRIGHTNESS);
  }
  return 1;
}

function calculateContrastScore(contrast: number, subjectBackgroundSeparation?: number): number {
  // More sophisticated contrast scoring based on improved calculation
  // With the new method, contrast values typically range from 0.05 to 0.8+
  

  
  // Handle edge cases
  if (contrast < MIN_ACCEPTABLE_CONTRAST) {
    // Very low contrast indicates a flat/uniform image
    return 0.3;
  }
  
  // Check for poor subject-background separation specifically
  if (subjectBackgroundSeparation !== undefined && subjectBackgroundSeparation < MIN_SUBJECT_BACKGROUND_SEPARATION) {
    // Even if overall contrast is decent, poor separation is a major issue for portraits
    // Apply very aggressive penalty that significantly caps the score
    
    const separationRatio = subjectBackgroundSeparation / MIN_SUBJECT_BACKGROUND_SEPARATION;
    
    // Less aggressive penalties – allow borderline images to pass
    let maxScoreWithPoorSeparation;
    
    if (subjectBackgroundSeparation < 0.035) {
      // Very poor separation – still penalize but not an auto-fail
      maxScoreWithPoorSeparation = 0.55;
    } else if (subjectBackgroundSeparation < 0.055) {
      // Poor separation – moderate cap
      maxScoreWithPoorSeparation = 0.65;
    } else {
      // Mild separation issue – light cap
      maxScoreWithPoorSeparation = 0.75;
    }
    
    // Calculate base score then apply harsh separation penalty
    let baseScore = 0.6; // Start with moderate score
    if (contrast >= 0.2) {
      baseScore = Math.min(1, 0.85 + (contrast - 0.2) * 0.375);
    } else if (contrast >= 0.1) {
      baseScore = 0.7 + (contrast - 0.1) * 1.5;
    } else if (contrast >= MIN_ACCEPTABLE_CONTRAST) {
      baseScore = 0.5 + (contrast - MIN_ACCEPTABLE_CONTRAST) / (0.1 - MIN_ACCEPTABLE_CONTRAST) * 0.2;
    }
    
    const finalScore = Math.min(baseScore, maxScoreWithPoorSeparation);
    return finalScore;
  }
  
  // Good contrast range - most well-lit photos should fall here
  if (contrast >= 0.2) {
    // Scale from 0.2+ to high scores (0.85-1.0)
    const normalizedScore = Math.min(1, 0.85 + (contrast - 0.2) * 0.375);
    return normalizedScore;
  }
  
  // Moderate contrast range
  if (contrast >= 0.1) {
    // Scale from 0.1-0.2 to 0.7-0.85
    const normalizedScore = 0.7 + (contrast - 0.1) * 1.5;
    return normalizedScore;
  }
  
  // Low but acceptable contrast range
  if (contrast >= MIN_ACCEPTABLE_CONTRAST) {
    // Scale from MIN_ACCEPTABLE_CONTRAST to 0.1 as 0.5-0.7
    const normalizedScore = 0.5 + (contrast - MIN_ACCEPTABLE_CONTRAST) / (0.1 - MIN_ACCEPTABLE_CONTRAST) * 0.2;
    return normalizedScore;
  }
  
  // Fallback for very low values
  const normalizedScore = Math.max(0.3, contrast * 6);
  return normalizedScore;
}

function calculateBlurScore(blur: number): number {
  // AGGRESSIVE blur scoring - much stricter thresholds
  // Blur values typically range from 0.3 to 0.8 after our detection improvements
  
  // AGGRESSIVE blur thresholds - raised for stricter requirements  
  const EXCELLENT_BLUR_THRESHOLD = 0.8;   // Only very sharp images get excellent scores
  const GOOD_BLUR_THRESHOLD = 0.6;        // Raised threshold for good sharpness
  const ACCEPTABLE_BLUR_THRESHOLD = 0.4;  // Raised minimum acceptable sharpness  
  const POOR_BLUR_THRESHOLD = 0.15;        // Raised threshold for poor sharpness

  // Excellent sharpness - only truly crisp images get high scores
  if (blur >= EXCELLENT_BLUR_THRESHOLD) {
    const normalizedScore = 1; // Scale 0.8-1.0 to 0.85-1.0
    const finalScore = Math.min(1, normalizedScore);
    return finalScore;
  }
  
  // Good sharpness - reasonably sharp images but lower max scores
  if (blur >= GOOD_BLUR_THRESHOLD) {
    const normalizedScore = 0.95 + (blur - GOOD_BLUR_THRESHOLD) * 1.0; // Scale 0.6-0.8 to 0.65-0.85  
    return normalizedScore;
  }
  
  // Acceptable sharpness - lower scores, harder to pass
  if (blur >= ACCEPTABLE_BLUR_THRESHOLD) {
    const normalizedScore = 0.45 + (blur - ACCEPTABLE_BLUR_THRESHOLD) * 1.0; // Scale 0.4-0.6 to 0.45-0.65
    return normalizedScore;
  }
  
  // Poor sharpness - significantly reduced scores  
  if (blur >= POOR_BLUR_THRESHOLD) {
    const normalizedScore = 0.25 + (blur - POOR_BLUR_THRESHOLD) * 1.0; // Scale 0.2-0.4 to 0.25-0.45
    return normalizedScore;
  }
  
  // Very poor/blurry - harsh penalties
  if (blur >= 0.05) {
    const normalizedScore = 0.05 + (blur - 0.05) * 1.33; // Scale 0.05-0.2 to 0.05-0.25
    return normalizedScore;
  }
  
  // Extremely blurry or detection failed - almost zero score
  return 0.02;
}

function calculateOverallScore(result: ImageQualityResult): number {
  // Weight factors for different aspects
  // Resolution removed - now a hard requirement, not part of scoring
  const weights = {
    face: 0.25,      // Increased from 0.25
    body: 0.05,
    brightness: 0.2, // Increased from 0.15  
    contrast: 0.2,   // Increased from 0.15
    blur: 0.2,      // Increased from 0.1
    eyes: 0.1       // Eye visibility weight
  };
  
  // Binary face score: 1 for single face, 0 for no face or multiple faces
  let faceScore = result.faceCount === 1 ? 1 : 0;
  
  // If face detection was skipped, redistribute weights
  if (result.faceDetectionSkipped) {
    // When face detection is skipped, we reduce its importance and use a default passing score
    const reducedFaceWeight = 0.1;
    faceScore = 0.7; // Default passing score when skipped
    
    // Redistribute remaining face weight to other factors
    const weightToRedistribute = (weights.face - reducedFaceWeight);
    const redistributionPerFactor = weightToRedistribute / 4; // Split among brightness, contrast, blur, and eyes
    
    return (
      reducedFaceWeight * faceScore +
      (weights.brightness + redistributionPerFactor) * result.brightnessScore +
      (weights.contrast + redistributionPerFactor) * result.contrastScore +
      (weights.blur + redistributionPerFactor) * result.blurScore +
      (weights.eyes + redistributionPerFactor) * (result.eyesVisible ? 1 : 0)
    );
  }

  // Calculate base score (resolution excluded)
  let score = (
    weights.face * faceScore +
    weights.body * result.bodyScore +
    weights.brightness * result.brightnessScore +
    weights.contrast * result.contrastScore +
    weights.blur * result.blurScore +
    weights.eyes * (result.eyesVisible ? 1 : 0)
  );

  // Apply critical penalties
  if (!result.eyeDetectionSkipped && !result.eyesVisible) {
    // Significant penalty for covered eyes (reduces score by 50%)
    score *= 0.5;
  }

  // Gender matching removed - no longer penalizing gender detection

  return score;
}

// Add function to check body shot requirements
export function checkBodyShotRequirements(results: Record<string, ImageQualityResult>): { 
  isValid: boolean; 
  bodyCount: number; 
  totalImages: number; 
  bodyPercentage: number;
  errors: string[];
} {
  if (isServer) return { isValid: true, bodyCount: 0, totalImages: 0, bodyPercentage: 0, errors: [] };
  
  const totalImages = Object.keys(results).length;
  if (totalImages === 0) return { isValid: false, bodyCount: 0, totalImages: 0, bodyPercentage: 0, errors: ['No images uploaded'] };
  
  const bodyCount = Object.values(results).filter(r => r.hasBody).length;
  const bodyPercentage = bodyCount / totalImages;
  
  const errors: string[] = [];
  
  // Check minimum body count
  if (bodyCount < MIN_BODY_COUNT) {
    errors.push(`Need at least ${MIN_BODY_COUNT} body shots (currently have ${bodyCount})`);
  }
  
  // Check maximum percentage
  if (bodyPercentage > MAX_BODY_PERCENTAGE) {
    errors.push(`Too many body shots (${Math.round(bodyPercentage * 100)}%). Maximum ${Math.round(MAX_BODY_PERCENTAGE * 100)}% allowed`);
  }
  
  return {
    isValid: errors.length === 0,
    bodyCount,
    totalImages,
    bodyPercentage,
    errors
  };
}

function isAcceptable(result: ImageQualityResult, opts?: { petMode?: boolean }): boolean {
  // Track critical failures separately
  const criticalFailures: string[] = [];
  const warnings: string[] = [];
  const petMode = !!opts?.petMode;

  // HARD REQUIREMENT: Check for minimum dimensions first
  // This is a binary pass/fail - no gradual scoring
  result.hasGoodResolution = result.width >= MIN_WIDTH && result.height >= MIN_HEIGHT;
  if (!result.hasGoodResolution) {
    // Immediate rejection for resolution - no other checks matter
    result.isAcceptable = false;
    result.issues.push(`Image resolution too low. Minimum required is ${MIN_WIDTH}x${MIN_HEIGHT}px`);
    return false;
  }
  
  // Check for single face (skip as critical when pet mode)
  result.hasSingleFace = result.faceCount === 1;
  result.hasFace = result.faceCount === 1;
  if (!petMode) {
    if (!result.hasSingleFace) {
      if (result.faceCount === 0) {
        criticalFailures.push('No face detected in the image');
      } else {
        criticalFailures.push('Multiple faces detected in the image');
      }
    }
  }

  // Check eye visibility as a critical factor
  const hasVisibleEyes = result.eyeDetectionSkipped || result.eyesVisible;
  if (!petMode) {
    if (!result.eyeDetectionSkipped && !result.eyesVisible) {
      // No longer a critical failure: already penalized in score; keep as warning
      warnings.push('Eyes are not clearly visible (possibly covered by sunglasses or hair)');
    }
  }

  // Gender matching removed - no longer checking gender validation
  
  // Check for overall quality score
  result.hasGoodScore = result.score >= 0.5; // Relaxed overall score threshold
  if (!result.hasGoodScore) {
    if (criticalFailures.length === 0) {
      // Only add as a critical failure if there are no other critical issues
      criticalFailures.push('Image quality score is too low');
    }
  }

  // Add all critical failures to issues
  result.issues = [...result.issues, ...warnings];
  
  // Image is acceptable only if there are no critical failures
  result.isAcceptable = criticalFailures.length === 0;
  
  return result.isAcceptable;
}

// Improve eye visibility check function
async function checkEyesVisible(img: HTMLImageElement, landmarks: any, ctx: CanvasRenderingContext2D): Promise<{visible: boolean, confidence: number}> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const eyeCtx = canvas.getContext('2d', { willReadFrequently: true });
  if (!eyeCtx) throw new Error('Could not get canvas context');
  
  eyeCtx.drawImage(img, 0, 0);
  
  try {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    if (!leftEye.length || !rightEye.length) {
      return { visible: false, confidence: 0 };
    }

    // Calculate eye regions
    const getEyeRegion = (eyePoints: any[]) => {
      const xs = eyePoints.map((p: any) => p.x);
      const ys = eyePoints.map((p: any) => p.y);
      const minX = Math.max(0, Math.min(...xs) - EYE_REGION_SIZE);
      const minY = Math.max(0, Math.min(...ys) - EYE_REGION_SIZE);
      const width = Math.min(img.width - minX, Math.max(...xs) - Math.min(...xs) + 2 * EYE_REGION_SIZE);
      const height = Math.min(img.height - minY, Math.max(...ys) - Math.min(...ys) + 2 * EYE_REGION_SIZE);
      return { x: minX, y: minY, width, height };
    };

    const leftRegion = getEyeRegion(leftEye);
    const rightRegion = getEyeRegion(rightEye);

    // Enhanced eye region analysis with brightness variance
    const analyzeEyeRegion = (region: any) => {
      const imageData = eyeCtx.getImageData(region.x, region.y, region.width, region.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let maxContrast = 0;
      let darkPixels = 0;
      let pixels = 0;
      let hasHighContrast = false;
      const brightnessValues: number[] = [];
      
      // Color analysis arrays
      const rValues: number[] = [];
      const gValues: number[] = [];
      const bValues: number[] = [];
      let totalR = 0, totalG = 0, totalB = 0;
      
      // First pass: collect brightness and color values
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Store color values
        rValues.push(r);
        gValues.push(g);
        bValues.push(b);
        totalR += r;
        totalG += g;
        totalB += b;
        
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightnessValues.push(brightness);
        totalBrightness += brightness;
        
        if (brightness < 0.2) {
          darkPixels++;
        }
        
        if (i > 0 && i < data.length - 4) {
          const prevBrightness = (0.299 * data[i-4] + 0.587 * data[i-3] + 0.114 * data[i-2]) / 255;
          const contrast = Math.abs(brightness - prevBrightness);
          maxContrast = Math.max(maxContrast, contrast);
          
          if (contrast > MIN_EYE_CONTRAST) {
            hasHighContrast = true;
          }
        }
        
        pixels++;
      }
      
      // Calculate brightness variance
      const avgBrightness = totalBrightness / pixels;
      let brightnessVariance = 0;
      for (const brightness of brightnessValues) {
        brightnessVariance += Math.pow(brightness - avgBrightness, 2);
      }
      brightnessVariance /= pixels;
      
      // Calculate color uniformity (higher value means more uniform color)
      const avgR = totalR / pixels;
      const avgG = totalG / pixels;
      const avgB = totalB / pixels;
      
      let colorVariance = 0;
      for (let i = 0; i < pixels; i++) {
        colorVariance += (
          Math.pow(rValues[i] - avgR, 2) +
          Math.pow(gValues[i] - avgG, 2) +
          Math.pow(bValues[i] - avgB, 2)
        );
      }
      colorVariance /= (pixels * 3);
      const colorUniformity = 1 - Math.min(1, colorVariance / 2000); // Normalize variance to 0-1 range
      
      const darknessRatio = darkPixels / pixels;
      
      return {
        brightness: avgBrightness,
        contrast: maxContrast,
        darknessRatio,
        hasHighContrast,
        brightnessVariance,
        colorUniformity
      };
    };

    const leftAnalysis = analyzeEyeRegion(leftRegion);
    const rightAnalysis = analyzeEyeRegion(rightRegion);

    // Stricter eye visibility detection
    const isEyeVisible = (analysis: ReturnType<typeof analyzeEyeRegion>) => {
      // Enhanced sunglasses detection including semi-transparent lenses
      const hasSunglassesCharacteristics = 
        // Very dark with uniform appearance
        (analysis.darknessRatio > MAX_DARKNESS_RATIO && analysis.brightnessVariance < MIN_BRIGHTNESS_VARIANCE) ||
        // Extremely dark with no contrast
        (analysis.brightness < MIN_EYE_BRIGHTNESS && analysis.darknessRatio > 0.7) ||
        // Semi-transparent or colored lenses (high color uniformity with moderate darkness)
        (analysis.colorUniformity > MAX_COLOR_UNIFORMITY && analysis.darknessRatio > 0.4);
      
      // Natural eye characteristics
      const hasNaturalEyeCharacteristics = 
        // Good brightness and some variance
        (analysis.brightness > MIN_EYE_BRIGHTNESS && analysis.colorUniformity < MAX_COLOR_UNIFORMITY) ||
        // Or clear eye features with enough contrast and color variation
        (analysis.hasHighContrast && analysis.brightnessVariance > MIN_BRIGHTNESS_VARIANCE);
      
      return !hasSunglassesCharacteristics && hasNaturalEyeCharacteristics;
    };

    const leftVisible = isEyeVisible(leftAnalysis);
    const rightVisible = isEyeVisible(rightAnalysis);

    // Calculate confidence
    const confidence = Math.max(
      leftAnalysis.brightness,
      rightAnalysis.brightness,
      leftAnalysis.contrast,
      rightAnalysis.contrast
    );

    // Both eyes must be visible
    return {
      visible: leftVisible && rightVisible,
      confidence: confidence
    };
  } catch (error) {
    console.error('Error checking eye visibility:', error);
    return { visible: false, confidence: 0 };
  }
}

// Calculate subject-background separation for detected faces
function calculateSubjectBackgroundSeparation(
  canvas: HTMLCanvasElement, 
  faceDetection: WithFaceLandmarks<{ detection: FaceDetection }> | null
): number {
  if (!faceDetection) {
    return 0.5; // Neutral score when no face detected
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0.5;

  const face = faceDetection.detection.box;
  const width = canvas.width;
  const height = canvas.height;

  // Define face area with small margin
  const faceMargin = 10;
  const faceArea = {
    x: Math.max(0, face.x - faceMargin),
    y: Math.max(0, face.y - faceMargin),
    width: Math.min(width - (face.x - faceMargin), face.width + 2 * faceMargin),
    height: Math.min(height - (face.y - faceMargin), face.height + 2 * faceMargin)
  };

  // Define background sampling areas around the face
  const sampleWidth = FACE_PERIMETER_SAMPLE_WIDTH;
  const backgroundAreas = [
    // Left side
    {
      x: Math.max(0, faceArea.x - sampleWidth),
      y: faceArea.y,
      width: Math.min(sampleWidth, faceArea.x),
      height: faceArea.height
    },
    // Right side
    {
      x: Math.min(width, faceArea.x + faceArea.width),
      y: faceArea.y,
      width: Math.min(sampleWidth, width - (faceArea.x + faceArea.width)),
      height: faceArea.height
    },
    // Top
    {
      x: faceArea.x,
      y: Math.max(0, faceArea.y - sampleWidth),
      width: faceArea.width,
      height: Math.min(sampleWidth, faceArea.y)
    },
    // Bottom
    {
      x: faceArea.x,
      y: Math.min(height, faceArea.y + faceArea.height),
      width: faceArea.width,
      height: Math.min(sampleWidth, height - (faceArea.y + faceArea.height))
    }
  ].filter(area => area.width > 0 && area.height > 0);

  // Calculate average brightness for face area
  const faceImageData = ctx.getImageData(faceArea.x, faceArea.y, faceArea.width, faceArea.height);
  const faceBrightness = calculateAreaBrightness(faceImageData);

  // Calculate average brightness for background areas
  let totalBackgroundBrightness = 0;
  let backgroundPixelCount = 0;
  
  for (const bgArea of backgroundAreas) {
    const bgImageData = ctx.getImageData(bgArea.x, bgArea.y, bgArea.width, bgArea.height);
    const bgBrightness = calculateAreaBrightness(bgImageData);
    const pixelCount = bgArea.width * bgArea.height;
    
    totalBackgroundBrightness += bgBrightness * pixelCount;
    backgroundPixelCount += pixelCount;
  }

  if (backgroundPixelCount === 0) {
    return 0.5; // Fallback if no background areas available
  }

  const avgBackgroundBrightness = totalBackgroundBrightness / backgroundPixelCount;
  
  // Calculate separation as absolute difference
  const separation = Math.abs(faceBrightness - avgBackgroundBrightness);

  return separation;
}

// Helper function to calculate average brightness of an image data area
function calculateAreaBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;
  }

  return totalBrightness / pixelCount;
}

// Initialize result with all required properties
function initializeResult(width: number, height: number): ImageQualityResult {
  return {
    width,
    height,
    faceCount: 0,
    faceBox: undefined,
    score: 0,
    faceScore: 0,
    bodyScore: 0,
    brightnessScore: 0,
    contrastScore: 0,
    blurScore: 0,
    resolutionScore: 0,
    hasSingleFace: false,
    hasGoodResolution: false,
    hasGoodScore: false,
    isAcceptable: false,
    hasFace: false,
    hasBody: false,
    faceDetectionSkipped: false,
    issues: [],
    eyesVisible: false,
    eyeDetectionSkipped: false
  };
} 