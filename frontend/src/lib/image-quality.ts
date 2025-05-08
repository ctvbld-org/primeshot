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
    const modelPath = '/models'; // Public directory path
    
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
    console.error('Error loading face-api models:', error);
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
  
  // Additional info
  issues: string[];
}

// Analyze image quality using face-api.js and browser canvas
export async function analyzeImageQuality(file: File): Promise<ImageQualityResult> {
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
      // First try with TinyFaceDetector with lower threshold
      const faceDetections = await faceapi.detectAllFaces(
        img, 
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })
      ).withFaceLandmarks();
      
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
      } else if (faceDetections.length > 1) {
        result.hasFace = true;
        result.faceCount = faceDetections.length;
        result.issues.push('Multiple faces detected.');
        result.faceScore = 0.5;
      } else {
        // One face detected
        result.hasFace = true;
        result.faceCount = 1;
        
        // Evaluate face position and size
        result.faceScore = evaluateFacePosition(faceDetections[0], width, height);
        
        if (result.faceScore < 0.7) {
          result.issues.push('Face position is not optimal.');
        }
      }
    } catch (error) {
      console.error('Face/body detection error:', error);
      result.hasBody = false;
      result.bodyScore = 0;
      result.faceDetectionSkipped = true;
      result.hasFace = false; 
      result.faceCount = 0;
      result.faceScore = 0.5; // Give a medium score as fallback
      result.issues.push('Face/body detection was skipped.');
    }
  } else {
    // Models not available
    result.hasBody = false;
    result.bodyScore = 0;
    result.faceDetectionSkipped = true;
    result.hasFace = false;
    result.faceCount = 0;
    result.faceScore = 0.5; // Medium fallback score when face detection is skipped
    result.issues.push('Face/body detection was skipped.');
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
    face: 0.30,
    body: 0.05,
    resolution: 0.25,
    brightness: 0.15,
    contrast: 0.15,
    blur: 0.1
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
  
  // Normal scoring with binary face detection
  return (
    weights.face * faceScore +
    weights.body * result.bodyScore +
    weights.resolution * result.resolutionScore +
    weights.brightness * result.brightnessScore +
    weights.contrast * result.contrastScore +
    weights.blur * result.blurScore
  );
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
  // Check for minimum dimensions
  result.hasGoodResolution = result.width >= 1000 && result.height >= 1000;
  
  // Check for single face - binary check
  result.hasSingleFace = result.faceCount === 1;
  result.hasFace = result.faceCount === 1; // Only true for exactly one face
  
  // Check for overall quality score - slightly more lenient since face detection is now stricter
  result.hasGoodScore = result.score >= 0.55; // 55% threshold since face detection is now stricter
  
  // Set final acceptability
  result.isAcceptable = result.hasGoodResolution && result.hasSingleFace && result.hasGoodScore;
  return result.isAcceptable;
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
    issues: []
  };
} 