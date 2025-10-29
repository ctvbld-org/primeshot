// MediaPipe face detection helper module
// This contains the face detection logic extracted for clarity

export interface MediaPipeFaceResult {
  faceCount: number;
  hasFace: boolean;
  hasSingleFace: boolean;
  faceScore: number;
  hasBody: boolean;
  bodyScore: number;
  eyesVisible: boolean;
  eyeDetectionSkipped: boolean;
  primaryFaceBox: { x: number; y: number; width: number; height: number } | null;
  faceOrientation: { pitch: number; yaw: number; roll: number } | null;
  issues: string[];
  i18nIssues: Array<{ key: string; params?: Record<string, string | number> }>;
}

export async function detectFaces(
  img: HTMLImageElement,
  faceLandmarker: any,
  poseLandmarker?: any
): Promise<MediaPipeFaceResult> {
  const width = img.width;
  const height = img.height;
  
  const result: MediaPipeFaceResult = {
    faceCount: 0,
    hasFace: false,
    hasSingleFace: false,
    faceScore: 0.5,
    hasBody: false,
    bodyScore: 0,
    eyesVisible: true,
    eyeDetectionSkipped: false,
    primaryFaceBox: null,
    faceOrientation: null,
    issues: [],
    i18nIssues: []
  };
  
  try {
    // Ensure image is valid before detection
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      throw new Error('Image not fully loaded');
    }
    
    // Run face detection and landmarking
    const detection = faceLandmarker.detect(img);
    
    const allFaces = detection.faceLandmarks || [];
    const rawFaceCount = allFaces.length;
    
    // Filter faces to remove false positives
    // Strategy: Secondary faces that are much smaller than primary are likely artifacts
    let validFaces = allFaces;
    
    if (rawFaceCount > 1) {
      // Calculate face bounding boxes for overlap detection only
      const faceBoxes = allFaces.map((landmarks: any) => {
        const xs = landmarks.map((l: any) => l.x * width);
        const ys = landmarks.map((l: any) => l.y * height);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const faceWidth = maxX - minX;
        const faceHeight = maxY - minY;
        return {
          x: minX,
          y: minY,
          width: faceWidth,
          height: faceHeight,
          area: faceWidth * faceHeight
        };
      });
      
      const primaryFaceBox = faceBoxes[0];
      
      // Helper function to calculate overlap between two boxes
      const calculateOverlap = (box1: any, box2: any) => {
        const x1 = Math.max(box1.x, box2.x);
        const y1 = Math.max(box1.y, box2.y);
        const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
        const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
        
        if (x2 <= x1 || y2 <= y1) return 0; // No overlap
        
        const overlapArea = (x2 - x1) * (y2 - y1);
        const smallerArea = Math.min(box1.area, box2.area);
        return overlapArea / smallerArea;
      };
      
      // SIMPLE filtering: Only filter DUPLICATE detections (high overlap)
      // Real secondary people should still be detected and cause rejection
      validFaces = allFaces.filter((landmarks: any, index: number) => {
        if (index === 0) return true; // Always keep primary face
        
        const faceBox = faceBoxes[index];
        const overlapWithPrimary = calculateOverlap(faceBox, primaryFaceBox);
        
        // Only filter if >50% overlap (clear duplicate detection)
        const isDuplicate = overlapWithPrimary > 0.50;
        
        return !isDuplicate;
      });
    }
    
    const numFaces = validFaces.length;
    
    result.faceCount = numFaces;
    result.hasFace = numFaces > 0;
    result.hasSingleFace = numFaces === 1;
    
    if (numFaces === 0) {
      result.faceScore = 0.1;
      
      // Check if this looks like a body shot (tall vertical image)
      // If so, use more appropriate message
      const aspectRatio = height / width;
      const isLikelyBodyShot = aspectRatio > 1.3 && height >= 1500;
      
      if (isLikelyBodyShot) {
        // Body shot with face too small to detect
        result.hasBody = true;
        result.bodyScore = 0.7;
        result.faceScore = 0.5;
        result.i18nIssues.push({ key: 'quality.issues.face.tooSmallToDetect' });
      } else {
        // Portrait with no face detected
        result.i18nIssues.push({ key: 'quality.issues.face.none' });
      }
      
      return result;
    }
    
    if (numFaces > 1) {
      result.faceScore = 0.5;
      result.issues.push('Multiple faces detected.');
      result.i18nIssues.push({ key: 'quality.issues.face.multiple' });
      // Continue processing the first face
    }
    
    // Process the primary (first) face
    const landmarks = validFaces[0];
    
    // Find the index of the primary face in the original detection array
    // to get the correct blendshapes and transformation data
    const primaryFaceIndex = allFaces.indexOf(validFaces[0]);
    const blendshapes = detection.faceBlendshapes?.[primaryFaceIndex];
    const transformation = detection.facialTransformationMatrixes?.[primaryFaceIndex];
    
    // Calculate bounding box from landmarks
    const xs = landmarks.map((l: any) => l.x * width);
    const ys = landmarks.map((l: any) => l.y * height);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    
    const faceBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
    
    result.primaryFaceBox = faceBox;
    
    // Calculate face orientation from transformation matrix
    if (transformation) {
      // Extract rotation angles from the transformation matrix
      // MediaPipe provides a 4x4 transformation matrix
      const matrix = transformation.data;
      
      // Simplified orientation calculation
      // For production, you'd use proper matrix decomposition
      const pitch = Math.atan2(matrix[6], matrix[10]) * (180 / Math.PI);
      const yaw = Math.atan2(-matrix[2], Math.sqrt(matrix[6] * matrix[6] + matrix[10] * matrix[10])) * (180 / Math.PI);
      const roll = Math.atan2(matrix[4], matrix[5]) * (180 / Math.PI);
      
      result.faceOrientation = { pitch, yaw, roll };
      
      // Check if face angle is too extreme
      const MAX_ANGLE = 35;
      if (Math.abs(pitch) > MAX_ANGLE || Math.abs(yaw) > MAX_ANGLE || Math.abs(roll) > MAX_ANGLE) {
        result.issues.push(`Face angle is too extreme (pitch: ${pitch.toFixed(0)}°, yaw: ${yaw.toFixed(0)}°, roll: ${roll.toFixed(0)}°)`);
        result.i18nIssues.push({ 
          key: 'quality.issues.face.angleExtreme',
          params: { pitch: Math.round(pitch), yaw: Math.round(yaw), roll: Math.round(roll) }
        });
        result.faceScore *= 0.7; // Penalize extreme angles
      }
    }
    
    // Check eye openness from blendshapes AND pixel analysis (sunglasses detection)
    if (blendshapes && blendshapes.categories && landmarks.length > 468) {
      const leftEyeBlink = blendshapes.categories.find((c: any) => c.categoryName === 'eyeBlinkLeft');
      const rightEyeBlink = blendshapes.categories.find((c: any) => c.categoryName === 'eyeBlinkRight');
      
      // Blendshape score close to 1 means eyes are closed
      const leftEyeOpen = leftEyeBlink ? (1 - leftEyeBlink.score) : 1;
      const rightEyeOpen = rightEyeBlink ? (1 - rightEyeBlink.score) : 1;
      const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
      
      // Only check for VERY OBVIOUS sunglasses - not a hard rejection
      const hasSunglasses = detectSunglasses(img, landmarks);
      
      if (hasSunglasses) {
        // Don't hard reject - just add to issues and penalize score
        result.issues.push('Eyes may be obscured by sunglasses.');
        result.i18nIssues.push({ key: 'quality.issues.face.sunglasses' });
        result.faceScore *= 0.7; // Moderate penalty, not instant fail
      }
      
      if (avgEyeOpen <= 0.3) {
        result.eyesVisible = false;
        result.eyeDetectionSkipped = false;
        result.issues.push('Eyes appear to be closed or not visible.');
        result.i18nIssues.push({ key: 'quality.issues.face.eyesClosed' });
        result.faceScore *= 0.8; // Penalize closed eyes
      } else {
        result.eyesVisible = true;
        result.eyeDetectionSkipped = false;
      }
    } else {
      result.eyeDetectionSkipped = true;
    }
    
    // Evaluate face position and size
    const faceArea = faceBox.width * faceBox.height;
    const imageArea = width * height;
    const faceRelativeSize = faceArea / imageArea;
    
    // Body shot detection using MediaPipe Pose Landmarker
    // This directly detects body keypoints instead of guessing from face size
    let isBodyShot = false;
    let bodyDetectionMethod = 'none';
    
    if (poseLandmarker) {
      try {
        // Detect pose landmarks (33 keypoints including shoulders, hips, knees, etc.)
        const poseResult = poseLandmarker.detect(img);
        
        if (poseResult.landmarks && poseResult.landmarks.length > 0) {
          const landmarks = poseResult.landmarks[0]; // First person's landmarks
          
          // MediaPipe Pose Landmark indices:
          // 13, 14: Left/Right Elbow
          // 23, 24: Left/Right Hip  
          // 25, 26: Left/Right Knee
          const leftElbow = landmarks[13];
          const rightElbow = landmarks[14];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];
          const leftKnee = landmarks[25];
          const rightKnee = landmarks[26];
          
          // Check visibility with STRICT threshold (> 0.7 = actually visible, not just inferred)
          // MediaPipe often assigns high scores to inferred positions even when occluded
          const STRICT_VISIBILITY_THRESHOLD = 0.7;
          
          const elbowsVisible = (leftElbow?.visibility > STRICT_VISIBILITY_THRESHOLD || rightElbow?.visibility > STRICT_VISIBILITY_THRESHOLD);
          const hipsVisible = (leftHip?.visibility > STRICT_VISIBILITY_THRESHOLD || rightHip?.visibility > STRICT_VISIBILITY_THRESHOLD);
          const kneesVisible = (leftKnee?.visibility > STRICT_VISIBILITY_THRESHOLD || rightKnee?.visibility > STRICT_VISIBILITY_THRESHOLD);
          
          // Body shot detection hierarchy:
          // - Knees visible = full body shot
          // - Hips visible = half body shot (torso down to waist)
          // - Elbows visible = upper body shot (arms/torso visible)
          // - Only face/shoulders = portrait (NOT a body shot)
          if (kneesVisible) {
            isBodyShot = true;
            bodyDetectionMethod = 'pose-full-body';
          } else if (hipsVisible) {
            isBodyShot = true;
            bodyDetectionMethod = 'pose-half-body';
          } else if (elbowsVisible) {
            isBodyShot = true;
            bodyDetectionMethod = 'pose-upper-body';
          } else {
            // Only face/shoulders visible = portrait/headshot
            isBodyShot = false;
            bodyDetectionMethod = 'pose-portrait';
          }
        } else {
          // No pose detected, fallback to face size method
          bodyDetectionMethod = 'fallback-face-size';
          isBodyShot = faceRelativeSize < 0.20;
          console.log('[Bodyshot Detection - Fallback]', {
            method: 'face-size (no pose detected)',
            faceRelativeSize: (faceRelativeSize * 100).toFixed(1) + '%',
            isBodyShot
          });
        }
      } catch (error) {
        console.warn('[Bodyshot Detection] Pose detection failed, using face size fallback:', error);
        bodyDetectionMethod = 'fallback-face-size';
        isBodyShot = faceRelativeSize < 0.20;
      }
    } else {
      // Pose landmarker not available, use face size fallback
      bodyDetectionMethod = 'fallback-face-size';
      isBodyShot = faceRelativeSize < 0.20;
      console.log('[Bodyshot Detection - Fallback]', {
        method: 'face-size (pose landmarker not loaded)',
        faceRelativeSize: (faceRelativeSize * 100).toFixed(1) + '%',
        isBodyShot
      });
    }
    
    result.hasBody = isBodyShot;
    result.bodyScore = isBodyShot ? 1 : 0;
    
    // NOW: Apply different face size thresholds based on shot type
    let sizeScore = 1.0;
    
    if (isBodyShot) {
      // BODY SHOT (face < 20%): Very lenient - face naturally small when body is visible
      if (faceRelativeSize < 0.01) {
        // Face < 1% is TOO small even for body shots (maybe full body from very far)
        sizeScore = Math.max(0.3, faceRelativeSize / 0.01);
        result.issues.push('Face is extremely small, even for a body shot.');
        result.i18nIssues.push({ key: 'quality.issues.face.tooSmall' });
      } else {
        // Faces 1-20% are perfect for body shots (full, half, or 3/4 body)
        sizeScore = 0.98;
      }
    } else {
      // PORTRAIT/HEADSHOT (face >= 20%): Face should be prominent
      if (faceRelativeSize < 0.25) {
        // Face 20-25% is borderline - acceptable but could be closer
        sizeScore = 0.90;
      } else if (faceRelativeSize > 0.80) {
        // Face > 80% is too close
        sizeScore = Math.max(0.5, 1 - (faceRelativeSize - 0.80) / 0.20);
        result.issues.push('Face is too large/close.');
        result.i18nIssues.push({ key: 'quality.issues.face.tooLarge' });
      } else if (faceRelativeSize > 0.70) {
        // Face 70-80% is a bit too close but acceptable
        sizeScore = 0.90;
      }
      // Face size 20-70% is ideal for portraits - full score!
    }
    
    // Check face position (should be centered vertically and horizontally)
    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const horizontalOffset = Math.abs(faceCenterX - centerX) / (width / 2);
    const verticalOffset = Math.abs(faceCenterY - centerY) / (height / 2);
    
    let positionScore = 1.0;
    // More lenient position requirements for body shots
    const positionThreshold = isBodyShot ? 0.5 : 0.4;
    const positionThresholdModerate = isBodyShot ? 0.3 : 0.2;
    
    if (horizontalOffset > positionThreshold || verticalOffset > positionThreshold) {
      positionScore = 0.7;
      result.issues.push('Face is not well-centered.');
      result.i18nIssues.push({ key: 'quality.issues.face.positionNotOptimal' });
    } else if (horizontalOffset > positionThresholdModerate || verticalOffset > positionThresholdModerate) {
      positionScore = 0.9;
    }
    
    // Calculate overall face score based on size and position
    result.faceScore = sizeScore * 0.6 + positionScore * 0.4;
    
  } catch (error) {
    console.error('[MediaPipe] Face detection error:', error);
    result.faceScore = 0.5;
    result.issues.push('Face detection encountered an error.');
    result.i18nIssues.push({ key: 'quality.issues.face.detectSkipped' });
  }
  
  return result;
}

// Pixel-based sunglasses detection for MediaPipe landmarks
// MediaPipe's blendshapes can't detect sunglasses, so we analyze eye region pixels
function detectSunglasses(img: HTMLImageElement, landmarks: any[]): boolean {
  // Create canvas for pixel analysis
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  
  ctx.drawImage(img, 0, 0);
  
  // MediaPipe Face Mesh landmark indices for eyes
  // Left eye: 33, 133, 160, 159, 158, 157, 173, 246
  // Right eye: 263, 362, 385, 386, 387, 388, 398, 466
  const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173, 246];
  const rightEyeIndices = [263, 362, 385, 386, 387, 388, 398, 466];
  
  const analyzeEyeRegion = (eyeIndices: number[]) => {
    // Get eye region bounds from landmarks
    const eyePoints = eyeIndices.map(i => landmarks[i]).filter(p => p);
    if (eyePoints.length === 0) return { hasSunglasses: false };
    
    const xs = eyePoints.map((p: any) => p.x * img.width);
    const ys = eyePoints.map((p: any) => p.y * img.height);
    
    const minX = Math.max(0, Math.min(...xs) - 10);
    const minY = Math.max(0, Math.min(...ys) - 10);
    const maxX = Math.min(img.width, Math.max(...xs) + 10);
    const maxY = Math.min(img.height, Math.max(...ys) + 10);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width <= 0 || height <= 0) return { hasSunglasses: false };
    
    const imageData = ctx.getImageData(minX, minY, width, height);
    const data = imageData.data;
    
    let totalBrightness = 0;
    let darkPixels = 0;
    let veryDarkPixels = 0;
    const pixels = data.length / 4;
    
    // Color analysis for uniform tint detection
    let totalR = 0, totalG = 0, totalB = 0;
    const brightnessValues: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalR += r;
      totalG += g;
      totalB += b;
      
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      brightnessValues.push(brightness);
      totalBrightness += brightness;
      
      if (brightness < 0.3) darkPixels++;
      if (brightness < 0.15) veryDarkPixels++;
    }
    
    const avgBrightness = totalBrightness / pixels;
    const darkRatio = darkPixels / pixels;
    const veryDarkRatio = veryDarkPixels / pixels;
    
    // Calculate brightness variance (low = uniform = likely sunglasses)
    let brightnessVariance = 0;
    for (const b of brightnessValues) {
      brightnessVariance += Math.pow(b - avgBrightness, 2);
    }
    brightnessVariance /= pixels;
    const brightnessStdDev = Math.sqrt(brightnessVariance);
    
    // Calculate color uniformity
    const avgR = totalR / pixels;
    const avgG = totalG / pixels;
    const avgB = totalB / pixels;
    
    let colorVariance = 0;
    for (let i = 0; i < data.length; i += 4) {
      colorVariance += Math.pow(data[i] - avgR, 2);
      colorVariance += Math.pow(data[i + 1] - avgG, 2);
      colorVariance += Math.pow(data[i + 2] - avgB, 2);
    }
    colorVariance /= (pixels * 3);
    const colorStdDev = Math.sqrt(colorVariance);
    
    // Sunglasses detection criteria - EXTREMELY CONSERVATIVE to avoid false positives
    // Only catch VERY OBVIOUS dark sunglasses - require EXTREME evidence
    const isExtremelyDark = avgBrightness < 0.12; // Extremely dark (< 12% brightness)
    const isVeryDark = avgBrightness < 0.18; // Very dark (< 18% brightness)
    const isExtremelyUniform = brightnessStdDev < 0.05; // Extremely uniform (< 5% variance)
    const hasExtremelyHighDarkRatio = darkRatio > 0.85; // > 85% dark pixels
    const hasExtremelyDarkPixels = veryDarkRatio > 0.60; // > 60% very dark pixels
    
    // Require EXTREME conditions - all must be true (very strict AND)
    const obviousSunglasses = isExtremelyDark && isExtremelyUniform && hasExtremelyHighDarkRatio;
    const veryDarkSunglasses = isVeryDark && isExtremelyUniform && hasExtremelyDarkPixels;
    
    // Flag ONLY if overwhelming evidence (catch only obvious cases)
    const hasSunglasses = obviousSunglasses || veryDarkSunglasses;
    
    return {
      hasSunglasses,
      avgBrightness,
      brightnessStdDev,
      darkRatio,
      veryDarkRatio,
      colorStdDev
    };
  };
  
  const leftEye = analyzeEyeRegion(leftEyeIndices);
  const rightEye = analyzeEyeRegion(rightEyeIndices);
  
  // If either eye has sunglasses, flag it
  return leftEye.hasSunglasses || rightEye.hasSunglasses;
}
