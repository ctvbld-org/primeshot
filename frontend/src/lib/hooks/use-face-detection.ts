import { useState, useEffect, useCallback, useRef } from 'react'

// Face detection result interface
interface FaceDetectionResult {
  faceCount: number
  hasFace: boolean
  faceDetectionPerformed: boolean
  faces: Array<{
    box: {
      x: number
      y: number
      width: number
      height: number
    }
    landmarks: any
    score: number
  }>
}

/**
 * Hook for face detection using a web worker
 * Offloads heavy face detection processing to a separate thread
 */
export function useFaceDetection() {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use a ref to keep track of the worker instance
  const workerRef = useRef<Worker | null>(null)
  
  // Map of pending requests
  const pendingRequests = useRef<Map<string, {
    resolve: (result: FaceDetectionResult) => void,
    reject: (error: Error) => void
  }>>(new Map())
  
  // Request counter for unique IDs
  const requestCounter = useRef(0)
  
  // Initialize the worker on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const createWorker = () => {
      try {
        // Create the worker
        const worker = new Worker('/workers/face-detector.worker.js')
        workerRef.current = worker
        
        // Set up message handler
        worker.onmessage = (event) => {
          const { type, success, result, error, id } = event.data
          
          // Handle different message types
          switch (type) {
            case 'MODELS_LOADED':
              setIsReady(success)
              setIsLoading(false)
              if (!success && error) {
                setError(error)
              }
              break
              
            case 'FACE_DETECTION_RESULT':
              // Resolve or reject the corresponding promise
              const request = pendingRequests.current.get(id)
              if (request) {
                if (success) {
                  request.resolve(result)
                } else {
                  request.reject(new Error(error))
                }
                pendingRequests.current.delete(id)
              }
              break
              
            case 'ERROR':
              console.error('Worker error:', error)
              setError(error)
              break
          }
        }
        
        // Handle worker errors
        worker.onerror = (err) => {
          console.error('Worker error:', err)
          setError('Face detection worker encountered an error')
          setIsLoading(false)
        }
        
        // Load the models
        worker.postMessage({
          type: 'LOAD_MODELS',
          id: 'init'
        })
      } catch (err) {
        console.error('Error creating worker:', err)
        setError('Failed to initialize face detection')
        setIsLoading(false)
      }
    }
    
    createWorker()
    
    // Clean up worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])
  
  // Function to detect faces in an image
  const detectFaces = useCallback(async (
    imageSource: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData
  ): Promise<FaceDetectionResult> => {
    if (!workerRef.current) {
      throw new Error('Face detection worker not initialized')
    }
    
    if (!isReady) {
      throw new Error('Face detection models not loaded')
    }
    
    // Create a canvas to extract image data if needed
    let imageData: ImageData
    let width: number
    let height: number
    
    if (imageSource instanceof ImageData) {
      imageData = imageSource
      width = imageSource.width
      height = imageSource.height
    } else {
      const canvas = document.createElement('canvas')
      width = imageSource.width || (imageSource as HTMLVideoElement).videoWidth
      height = imageSource.height || (imageSource as HTMLVideoElement).videoHeight
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not create canvas context')
      }
      
      ctx.drawImage(imageSource, 0, 0)
      imageData = ctx.getImageData(0, 0, width, height)
    }
    
    // Generate a unique request ID
    const requestId = `req_${++requestCounter.current}`
    
    // Create a promise that will be resolved when the worker responds
    return new Promise((resolve, reject) => {
      // Store the promise resolution functions
      pendingRequests.current.set(requestId, { resolve, reject })
      
      // Send the message to the worker
      workerRef.current!.postMessage({
        type: 'DETECT_FACE',
        payload: {
          imageData: imageData.data.buffer,
          width,
          height
        },
        id: requestId
      }, [imageData.data.buffer]) // Transfer the buffer for better performance
    })
  }, [isReady])
  
  // Function to ensure the models are loaded
  const ensureModelsLoaded = useCallback(async (): Promise<boolean> => {
    if (isReady) return true
    
    if (!workerRef.current) {
      return false
    }
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isReady) {
          clearInterval(checkInterval)
          resolve(true)
        } else if (!isLoading && error) {
          clearInterval(checkInterval)
          resolve(false)
        }
      }, 100)
    })
  }, [isReady, isLoading, error])
  
  return {
    detectFaces,
    ensureModelsLoaded,
    isReady,
    isLoading,
    error
  }
} 