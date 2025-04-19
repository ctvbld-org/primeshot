// Web worker for face detection
// This runs in a separate thread from the main UI to prevent blocking

// Cache for loaded models
let faceapi = null;
let modelsLoaded = false;
let modelsLoading = false;
let modelLoadError = false;

// Respond to messages from the main thread
self.onmessage = async function(e) {
  const { type, payload, id } = e.data;
  
  switch(type) {
    case 'LOAD_MODELS':
      await loadModels();
      self.postMessage({
        type: 'MODELS_LOADED',
        success: modelsLoaded,
        error: modelLoadError ? 'Failed to load models' : null,
        id
      });
      break;
      
    case 'DETECT_FACE':
      if (!modelsLoaded) {
        await loadModels();
        if (!modelsLoaded) {
          self.postMessage({
            type: 'FACE_DETECTION_RESULT',
            success: false,
            error: 'Face detection models not loaded',
            id
          });
          return;
        }
      }
      
      try {
        const { imageData, width, height } = payload;
        const result = await detectFace(imageData, width, height);
        self.postMessage({
          type: 'FACE_DETECTION_RESULT',
          success: true,
          result,
          id
        });
      } catch (error) {
        self.postMessage({
          type: 'FACE_DETECTION_RESULT',
          success: false,
          error: error.message || 'Face detection failed',
          id
        });
      }
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        error: `Unknown command: ${type}`,
        id
      });
  }
};

// Load face detection models
async function loadModels() {
  if (modelsLoaded) return true;
  if (modelsLoading) {
    // Wait for loading to complete
    let attempts = 0;
    while (modelsLoading && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return modelsLoaded;
  }
  
  modelsLoading = true;
  
  try {
    // Dynamically import face-api.js
    if (!faceapi) {
      // In worker context, we need to use importScripts
      importScripts('/face-api.min.js');
      // Now faceapi should be available as a global
      faceapi = self.faceapi;
    }
    
    console.log('[Worker] Starting to load face detection models...');
    const modelPath = '/models'; // Public directory path
    
    // Load models
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
    console.log('[Worker] TinyFaceDetector loaded');
    
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
    console.log('[Worker] FaceLandmark68Net loaded');
    
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
    console.log('[Worker] SsdMobilenetv1 loaded');
    
    modelsLoaded = true;
    modelLoadError = false;
    console.log('[Worker] All face detection models loaded successfully');
    return true;
  } catch (error) {
    console.error('[Worker] Error loading face-api models:', error);
    modelLoadError = true;
    return false;
  } finally {
    modelsLoading = false;
  }
}

// Detect faces in an image
async function detectFace(imageData, width, height) {
  // Create an ImageData object
  const image = new ImageData(new Uint8ClampedArray(imageData), width, height);
  
  // Detect faces using TinyFaceDetector first (faster)
  const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 });
  const faceDetections = await faceapi.detectAllFaces(image, tinyFaceDetectorOptions).withFaceLandmarks();
  
  // Initialize result
  const result = {
    faceCount: faceDetections.length,
    hasFace: faceDetections.length > 0,
    faceDetectionPerformed: true,
    faces: []
  };
  
  // If faces found, extract information about each face
  if (faceDetections.length > 0) {
    // For each face, extract position and landmarks
    result.faces = faceDetections.map(detection => ({
      box: detection.detection.box,
      landmarks: detection.landmarks,
      score: detection.detection.score
    }));
    
    return result;
  }
  
  // If no faces detected with TinyFaceDetector, try SSD MobileNet as fallback
  console.log('[Worker] No faces detected with TinyFaceDetector, trying SSD MobileNet');
  const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
  const ssdDetections = await faceapi.detectAllFaces(image, ssdOptions).withFaceLandmarks();
  
  if (ssdDetections.length > 0) {
    result.faceCount = ssdDetections.length;
    result.hasFace = true;
    
    // For each face, extract position and landmarks
    result.faces = ssdDetections.map(detection => ({
      box: detection.detection.box,
      landmarks: detection.landmarks,
      score: detection.detection.score
    }));
  }
  
  return result;
} 