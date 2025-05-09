'use client';

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
const MIN_CONTRAST = 0.4;
const MAX_BLUR = 0.5;

// Constants for body detection
const MIN_BODY_PERCENTAGE = 0.10; // 10% of images should include body
const MAX_BODY_PERCENTAGE = 0.40; // 40% maximum for body shots

// Add after other constants
const MIN_EYE_CONFIDENCE = 0.3;
const MIN_EYE_BRIGHTNESS = 0.12;
const MIN_EYE_CONTRAST = 0.15;
const MAX_DARKNESS_RATIO = 0.6;
const MIN_BRIGHTNESS_VARIANCE = 0.05;
const MAX_COLOR_UNIFORMITY = 0.8; // Maximum allowed color uniformity (for detecting tinted lenses)
const EYE_REGION_SIZE = 25;

// Initialize face-api models
let modelsLoaded = false;
let modelsLoading = false;
let modelLoadError = false;

export async function loadModels() {
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
      faceapi = faceApiModule.default || faceApiModule;
    }
    
    console.log('Starting to load face detection models...');
    // Use CloudFront distribution URL for models
    const modelPath = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/face-models`;
    
    // Check if models are available at the path
    try {
      console.log(`Loading TinyFaceDetector from ${modelPath}`);
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      console.log('TinyFaceDetector loaded successfully');
      
      console.log(`Loading FaceLandmark68Net from ${modelPath}`);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
      console.log('FaceLandmark68Net loaded successfully');
      
      console.log(`Loading SsdMobilenetv1 from ${modelPath}`);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
      console.log('SsdMobilenetv1 loaded successfully');

      console.log(`Loading AgeGenderNet from ${modelPath}`);
      await faceapi.nets.ageGenderNet.loadFromUri(modelPath);
      console.log('AgeGenderNet loaded successfully');
      
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
  
  // Gender detection
  detectedGender?: 'male' | 'female';
  genderMatchesUser: boolean;
  genderDetectionSkipped: boolean;
  
  // Additional info
  issues: string[];
  
  // New properties
  eyesVisible: boolean;
  eyeDetectionSkipped: boolean;
}

// Analyze image quality using face-api.js and browser canvas
export async function analyzeImageQuality(file: File, userGender?: 'male' | 'female'): Promise<ImageQualityResult> {
  let modelsReady = false;
  
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
  
  // Check resolution
  const resolutionScore = checkResolution(width, height);
  result.resolutionScore = resolutionScore;
  
  if (resolutionScore < 0.7) {
    result.issues.push(`Low resolution image. Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT}px.`);
  }
  
  // Face detection
  let faceDetectionPerformed = false;
  
  if (modelsReady && faceapi) {
    try {
      // Load gender detection model if needed
      if (!faceapi.nets.ageGenderNet.isLoaded) {
        await faceapi.nets.ageGenderNet.loadFromUri('/models');
      }

      // First try with TinyFaceDetector with lower threshold and include gender detection
      const faceDetections = await faceapi.detectAllFaces(
        img, 
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })
      )
      .withFaceLandmarks()
      .withAgeAndGender();
      
      // Set faceCount based on TinyFaceDetector results
      result.faceCount = faceDetections.length;
      
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
        // Load SSD model if needed
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
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
            
            // Add gender detection for SSD MobileNet results
            try {
              if (!faceapi.nets.ageGenderNet.isLoaded) {
                await faceapi.nets.ageGenderNet.loadFromUri('/models');
              }
              const genderDetection = await faceapi.detectSingleFace(img)
                .withAgeAndGender();
              
              if (genderDetection && genderDetection.gender && genderDetection.genderProbability > 0.6) {
                result.detectedGender = genderDetection.gender.toLowerCase() as 'male' | 'female';
                result.genderDetectionSkipped = false;
                
                // Compare with user's gender if provided
                if (userGender) {
                  result.genderMatchesUser = result.detectedGender === userGender;
                  if (!result.genderMatchesUser) {
                    result.issues.push(`Possible gender mismatch (you chose ${userGender}, detected ${result.detectedGender})`);
                  }
                }
              } else {
                result.genderDetectionSkipped = true;
              }
            } catch (genderError) {
              console.error('Gender detection failed:', genderError);
              result.genderDetectionSkipped = true;
            }
            
            // Since we don't have landmarks, estimate face score based on size and position
            const face = rawFaceDetections[0];
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
        result.genderDetectionSkipped = true;
      } else if (faceDetections.length > 1) {
        result.hasFace = true;
        result.faceCount = faceDetections.length;
        result.issues.push('Multiple faces detected.');
        result.faceScore = 0.5;
        result.genderDetectionSkipped = true;
      } else {
        // One face detected
        result.hasFace = true;
        result.faceCount = 1;
        
        // Get gender from detection
        const detection = faceDetections[0];
        if (detection.gender && detection.genderProbability > 0.6) {
          result.detectedGender = detection.gender.toLowerCase() as 'male' | 'female';
          result.genderDetectionSkipped = false;
          
          // Compare with user's gender if provided
          if (userGender) {
            result.genderMatchesUser = result.detectedGender === userGender;
            if (!result.genderMatchesUser) {
              result.issues.push(`Possible gender mismatch (you chose ${userGender}, detected ${result.detectedGender})`);
              result.isAcceptable = false;
            }
          }
        } else {
          result.genderDetectionSkipped = true;
        }
        
        // Evaluate face position and size
        result.faceScore = evaluateFacePosition(faceDetections[0], width, height);
        
        if (result.faceScore < 0.7) {
          result.issues.push('Face position is not optimal.');
        }
        
        // Check for eye visibility
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const eyeCheck = await checkEyesVisible(img, faceDetections[0].landmarks, ctx);
          result.eyesVisible = eyeCheck.visible;
          result.eyeDetectionSkipped = false;
          
          if (!eyeCheck.visible) {
            if (eyeCheck.confidence > MIN_EYE_CONFIDENCE) {
              result.issues.push('Eyes are not clearly visible (possibly covered by sunglasses or hair)');
              result.isAcceptable = false;
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
      result.genderDetectionSkipped = true;
      result.hasFace = false; 
      result.faceCount = 0;
      result.faceScore = 0.5; // Give a medium score as fallback
      result.issues.push('Face/body/gender detection was skipped.');
    }
  } else {
    // Models not available
    result.hasBody = false;
    result.bodyScore = 0;
    result.faceDetectionSkipped = true;
    result.genderDetectionSkipped = true;
    result.hasFace = false;
    result.faceCount = 0;
    result.faceScore = 0.5; // Medium fallback score when face detection is skipped
    result.issues.push('Face/body/gender detection was skipped.');
  }
  
  // Analyze image stats using canvas
  const stats = await analyzeImageStats(img);
  
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
  result.contrastScore = calculateContrastScore(stats.contrast);
  if (result.contrastScore < 0.7) {
    result.issues.push('Image has poor contrast.');
  }
  
 // Check blur
  result.blurScore = calculateBlurScore(stats.blurValue);
  if (result.blurScore < 0.7) {
    result.issues.push('Image appears to be blurry.');
  }
  
  // Calculate overall score
  result.score = calculateOverallScore(result);
  result.score = result.score * 100; // Convert to 0-100 scale
  
  // Determine if image is acceptable
  result.isAcceptable = isAcceptable(result);
  
  // Clean up
  URL.revokeObjectURL(img.src);
  
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

function checkResolution(width: number, height: number): number {
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    const widthRatio = width / MIN_WIDTH;
    const heightRatio = height / MIN_HEIGHT;
    const ratio = Math.min(widthRatio, heightRatio);
    
    // More aggressive scoring for below-minimum dimensions
    // If either dimension is less than 70% of minimum, score drops rapidly
    if (ratio < 0.7) {
      return ratio * 0.5; // Halve the score for significantly undersized images
    }
    return ratio * 0.7; // 70% max score for any undersized dimension
  }
  return 1;
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

async function analyzeImageStats(img: HTMLImageElement) {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for image analysis');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate brightness
  let totalBrightness = 0;
  const pixelCount = data.length / 4; // RGBA values
  
  // For variance calculations (contrast)
  let rSum = 0, gSum = 0, bSum = 0;
  let rSquaredSum = 0, gSquaredSum = 0, bSquaredSum = 0;
  
  // Loop through all pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate relative luminance
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;
    
    // For variance calculations
    rSum += r;
    gSum += g;
    bSum += b;
    
    rSquaredSum += r * r;
    gSquaredSum += g * g;
    bSquaredSum += b * b;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Calculate variance for each channel (for contrast)
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  
  const rVariance = rSquaredSum / pixelCount - (rMean * rMean);
  const gVariance = gSquaredSum / pixelCount - (gMean * gMean);
  const bVariance = bSquaredSum / pixelCount - (bMean * bMean);
  
  // Average variance (contrast)
  const avgVariance = (rVariance + gVariance + bVariance) / 3;
  const contrast = Math.sqrt(avgVariance) / 255;
  
  // Calculate blur using Laplacian for edge detection
  // This is a simplistic approach but should give us a relative measure
  const blurValue = detectBlur(canvas);
  
  return {
    brightness: avgBrightness,
    contrast: contrast,
    blurValue: blurValue
  };
}

// Detect blur using Laplacian variance
function detectBlur(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale and calculate Laplacian
  const grayScale = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayScale[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  
  // Apply a simple Laplacian kernel to detect edges
  // Kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
  let sum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const laplacian = 
        grayScale[index - width] + 
        grayScale[index - 1] + 
        grayScale[index + 1] + 
        grayScale[index + width] - 
        4 * grayScale[index];
      
      sum += laplacian * laplacian;
      count++;
    }
  }
  
  // Normalize by pixel count
  const variance = count > 0 ? sum / count : 0;
  
  // Return normalized value (higher means less blurry)
  return Math.min(1, variance / 1000);
}

function calculateBrightnessScore(brightness: number): number {
  if (brightness < MIN_BRIGHTNESS) {
    return brightness / MIN_BRIGHTNESS;
  } else if (brightness > MAX_BRIGHTNESS) {
    return 1 - (brightness - MAX_BRIGHTNESS) / (1 - MAX_BRIGHTNESS);
  }
  return 1;
}

function calculateContrastScore(contrast: number): number {
  return Math.min(1, contrast / MIN_CONTRAST);
}

function calculateBlurScore(blur: number): number {
  return Math.min(1, blur / MAX_BLUR);
}

function calculateOverallScore(result: ImageQualityResult): number {
  // Weight factors for different aspects
  const weights = {
    face: 0.25,
    body: 0.05,
    resolution: 0.20,
    brightness: 0.15,
    contrast: 0.15,
    blur: 0.1,
    eyes: 0.1 // New weight for eye visibility
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
    const redistributionPerFactor = weightToRedistribute / 4; // Split among resolution, brightness, contrast, and blur
    
    return (
      reducedFaceWeight * faceScore +
      (weights.resolution + redistributionPerFactor) * result.resolutionScore +
      (weights.brightness + redistributionPerFactor) * result.brightnessScore +
      (weights.contrast + redistributionPerFactor) * result.contrastScore +
      (weights.blur + redistributionPerFactor) * result.blurScore
    );
  }

  // Calculate base score
  let score = (
    weights.face * faceScore +
    weights.body * result.bodyScore +
    weights.resolution * result.resolutionScore +
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

  if (!result.genderDetectionSkipped && !result.genderMatchesUser) {
    // Significant penalty for gender mismatch (reduces score by 50%)
    score *= 0.5;
  }

  return score;
}

// Add function to check body percentage requirements
export function checkBodyPercentageRequirements(results: Record<string, ImageQualityResult>): boolean {
  const totalImages = Object.keys(results).length;
  if (totalImages === 0) return false;
  
  const bodyCount = Object.values(results).filter(r => r.hasBody).length;
  const bodyPercentage = bodyCount / totalImages;
  
  return bodyPercentage >= MIN_BODY_PERCENTAGE && bodyPercentage <= MAX_BODY_PERCENTAGE;
}

function isAcceptable(result: ImageQualityResult): boolean {
  // Track critical failures separately
  const criticalFailures: string[] = [];
  const warnings: string[] = [];

  // Check for minimum dimensions
  result.hasGoodResolution = result.width >= 1000 && result.height >= 1000;
  if (!result.hasGoodResolution) {
    criticalFailures.push(`Image resolution too low. Minimum required is ${MIN_WIDTH}x${MIN_HEIGHT}px`);
  }
  
  // Check for single face
  result.hasSingleFace = result.faceCount === 1;
  result.hasFace = result.faceCount === 1;
  if (!result.hasSingleFace) {
    if (result.faceCount === 0) {
      criticalFailures.push('No face detected in the image');
    } else {
      criticalFailures.push('Multiple faces detected in the image');
    }
  }

  // Check eye visibility as a critical factor
  const hasVisibleEyes = result.eyeDetectionSkipped || result.eyesVisible;
  if (!result.eyeDetectionSkipped && !result.eyesVisible) {
    criticalFailures.push('Eyes must be clearly visible - remove sunglasses or any other coverings');
  }

  // Check gender match as a critical factor
  const hasValidGender = result.genderDetectionSkipped || result.genderMatchesUser;
  if (!result.genderDetectionSkipped && !result.genderMatchesUser) {
    criticalFailures.push('Gender in photo does not match selected gender');
  }
  
  // Check for overall quality score
  result.hasGoodScore = result.score >= 0.55;
  if (!result.hasGoodScore) {
    if (criticalFailures.length === 0) {
      // Only add as a critical failure if there are no other critical issues
      criticalFailures.push('Image quality score is too low');
    }
  }

  // Add all critical failures to issues
  result.issues = [...criticalFailures, ...warnings];
  
  // Image is acceptable only if there are no critical failures
  result.isAcceptable = criticalFailures.length === 0;
  
  return result.isAcceptable;
}

// Improve eye visibility check function
async function checkEyesVisible(img: HTMLImageElement, landmarks: any, ctx: CanvasRenderingContext2D): Promise<{visible: boolean, confidence: number}> {
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
      const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
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

// Initialize result with all required properties
function initializeResult(width: number, height: number): ImageQualityResult {
  return {
    width,
    height,
    faceCount: 0,
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
    genderDetectionSkipped: true,
    genderMatchesUser: false,
    issues: [],
    eyesVisible: false,
    eyeDetectionSkipped: false
  };
} 