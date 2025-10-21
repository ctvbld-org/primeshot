import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageQualityResult, checkBodyShotRequirements } from '@/lib/image-quality'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { formatFileSize } from '@/lib/utils'
import { uploadFileInChunks } from '@/lib/upload-utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { analyzeImageQuality, loadModels, analyzeForBodyShot } from '@/lib/image-quality'
import type { FileWithScore } from '@/lib/types'
import { apiRequest } from '@primeshot/common'
import type { ClaudeAnalysisResponse, ClaudeImageInput } from '@/lib/types/claude-analysis'

interface UseFileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  chunkSize?: number
  existingImages?: FileWithScore[]
  onRemoveExistingImage?: (imageId: string) => void
  petMode?: boolean
}

interface FileProgress {
  progress: number
  isUploading: boolean
  error?: string
}

interface FileState {
  file: File
  previewUrl?: string
  qualityResult?: ImageQualityResult
  uploadProgress: FileProgress
  isAnalyzing?: boolean
  uploadedUrl?: string
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { t } = useTranslation('upload')
  const { toast } = useToast()

  // Split options into separate constants for better memoization
  const {
    maxSize = 25 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png'],
    maxFiles = UPLOAD_CONSTANTS.MAX_IMAGES,
    existingImages = [],
    petMode = false
  } = useMemo(() => {
    return options;
  }, [options]);
  
  // Split state into logical groups
  const [fileStates, setFileStates] = useState<FileState[]>([]);

  // Handle existing images
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      // Convert existing images to FileState format
      const existingFileStates = existingImages.map((file: FileWithScore) => ({
        file: file as unknown as File,
        previewUrl: file.url,
          qualityResult: {
          width: 0,
          height: 0,
          faceCount: 1,
          score: file.score || 0,
          faceScore: 100,
          bodyScore: 100,
          brightnessScore: 100,
          contrastScore: 100,
          blurScore: 100,
          blockinessScore: 100,
          resolutionScore: 100,
          hasSingleFace: true,
          hasGoodResolution: true,
          hasGoodScore: true,
          isAcceptable: true,
          hasFace: true,
          hasBody: true,
          faceDetectionSkipped: false,
          eyesVisible: true,
          eyeDetectionSkipped: false,
          issues: [] as string[],
          i18nIssues: [] as Array<{ key: string; params?: Record<string, string | number> }>
        },
        uploadProgress: { progress: 100, isUploading: false },
        uploadedUrl: file.url
      }));

      // Preserve any non-existing files in the current state
      setFileStates(prev => {
        const nonExistingFiles = prev.filter(state => {
          const fileAsScore = state.file as unknown as FileWithScore;
          return !fileAsScore.id; // Keep files that don't have an id (newly added files)
        });
        return [...existingFileStates, ...nonExistingFiles];
      });
    } else {
      // If no existing images, only clear existing images from state
      setFileStates(prev => prev.filter(state => {
        const fileAsScore = state.file as unknown as FileWithScore;
        return !fileAsScore.id; // Keep files that don't have an id (newly added files)
      }));
    }
  }, [existingImages.length]); // Only run when the number of existing images changes
  
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    analyzingCount: 0,
    currentFileIndex: -1,
    acceptedCount: 0,
    analysisAttempts: 0, // Track how many times analysis has been run
    canBypassQuality: false, // Show "continue anyway" button
    rejectedCount: 0 // Track rejected images count
  })
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // Memoize computed values
  const computedValues = useMemo(() => ({
    isUploading: fileStates.some(state => state.uploadProgress.isUploading),
    totalProgress: fileStates.reduce((sum, state) => sum + state.uploadProgress.progress, 0) / 
      Math.max(fileStates.length, 1),
    acceptedCount: fileStates.filter(state => state.qualityResult?.isAcceptable).length
  }), [fileStates])

  // Load face detection models on mount
  useEffect(() => {
    const initModels = async () => {
      try {
        const success = await loadModels()
        setModelsStatus(success ? 'loaded' : 'error')
        
        if (!success) {
          toast({
            title: 'Warning',
            description: 'Face detection models could not be loaded. Quality analysis will be limited to other image attributes.',
            variant: 'default',
            duration: 5000,
          })
        }
      } catch (error) {
        console.error('Error loading face detection models:', error)
        setModelsStatus('error')
        toast({
          title: 'Warning',
          description: 'Face detection models could not be loaded. Quality analysis may be limited.',
          variant: 'destructive',
        })
      }
    }
    
    if (typeof window !== 'undefined') {
      initModels()
    }
  }, [toast])

  const validateFiles = useCallback((newFiles: File[]): File[] => {
    const validFiles: File[] = []
    const invalidFiles: { file: File; reason: string }[] = []

    // Use Set for O(1) lookup of existing files
    const existingFiles = new Set(fileStates.map(state => 
      `${state.file.name}-${state.file.lastModified}`
    ))

    newFiles.forEach((file) => {
      const fileKey = `${file.name}-${file.lastModified}`
      
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.invalidFileType', { types: allowedTypes.join(', ') })
        })
      } else if (file.size > maxSize) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.fileSizeExceeded', { size: formatFileSize(maxSize) })
        })
      } else if (existingFiles.has(fileKey)) {
        invalidFiles.push({ 
          file, 
          reason: t('errors.duplicateFile')
        })
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      toast({
        title: t('errors.uploadFailedCount', { count: invalidFiles.length }),
        description: invalidFiles.map(({ file, reason }) => 
          `${file.name}: ${reason}`
        ).join('\n'),
        variant: 'destructive',
      })
    }

    return validFiles
  }, [fileStates, allowedTypes, maxSize, t, toast])

  const handleNewFiles = useCallback((newFiles: File[]): File[] => {
    // Basic validation only - type, size, duplicates
    return validateFiles(newFiles)
  }, [validateFiles, fileStates])

  // Helper to compress and convert File to base64
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate new dimensions (max 1024px on longest side - sufficient for quality checks)
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_SIZE) {
          height = (height / width) * MAX_SIZE;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = (width / height) * MAX_SIZE;
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with JPEG compression (0.95 quality for maximum detail)
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        const base64Data = base64.split(',')[1];
        
        URL.revokeObjectURL(img.src);
        resolve(base64Data);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Analyze images using Claude API when we have exactly 9
  const analyzeImagesWithClaude = async (
    files: File[], 
    bodyResults: Array<{ hasBody: boolean; width: number; height: number }>,
    previouslyAcceptedFileNames: Set<string> = new Set()
  ): Promise<Record<string, ImageQualityResult>> => {
    try {
      // Bodyshot check already done by caller, just use the provided results
      console.log('[Image Protection]', {
        previouslyAccepted: Array.from(previouslyAcceptedFileNames)
      });
      setAnalysisState(prev => ({ ...prev, isAnalyzing: true, analyzingCount: files.length }));
      
      // Step 1: Convert files to base64 and send to Claude
      const images: ClaudeImageInput[] = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          data: await fileToBase64(file)
        }))
      );
      
      const analysis = await apiRequest<ClaudeAnalysisResponse>(
        '/api/analyze-photo-quality',
        {
          method: 'POST',
          body: JSON.stringify({ images })
        }
      );
      
      // Validate response has at least as many results as files
      if (analysis.images.length < files.length) {
        console.error('[Analysis] Not enough results:', {
          filesCount: files.length,
          analysisCount: analysis.images.length
        });
        throw new Error(`Returned only ${analysis.images.length} results for ${files.length} files`);
      }
      
      // If Claude returned MORE results than expected (happens sometimes), just use the first N
      if (analysis.images.length > files.length) {
        console.warn('[Analysis] Extra results detected:', {
          filesCount: files.length,
          analysisCount: analysis.images.length,
          action: 'Using first ' + files.length + ' results'
        });
        analysis.images = analysis.images.slice(0, files.length);
      }
      
      // Step 2: Process Claude results
      const results: Record<string, ImageQualityResult> = {};
      
      analysis.images.forEach((img, index) => {
        // Safety check
        if (!files[index]) {
          console.error(`Missing file at index ${index}`);
          return;
        }
        
        // Use actual file name from files array, not Claude's generic names
        const actualFileName = files[index].name;
        const isPreviouslyAccepted = previouslyAcceptedFileNames.has(actualFileName);
        const i18nIssues: Array<{key: string, params?: any}> = [];
        
        // Track quality issues separately from similarity issues
        let hasQualityIssues = false;
        let wasForcedRejection = false;
        
        // Add critical rejections (QUALITY ISSUES)
        if (!img.hasSingleFace) {
          hasQualityIssues = true;
          if (img.faceCount === 0) {
            i18nIssues.push({ key: 'quality.issues.face.none' });
          } else {
            i18nIssues.push({ key: 'quality.issues.face.multiple', params: { count: img.faceCount } });
          }
        }
        
        if (!img.isSharp) {
          hasQualityIssues = true;
          i18nIssues.push({ key: 'quality.issues.sharpness.tooBlurryOrPixelated' });
        }
        
        // Sunglasses check removed - too many false positives from Claude
        
        if (img.hasStrongFilter) {
          hasQualityIssues = true;
          i18nIssues.push({ key: 'quality.issues.filter.strong' });
        }
        
        // Check overall quality score (reject if ≤ 55%)
        if (img.overallScore < 55) {
          hasQualityIssues = true;
          i18nIssues.push({ key: 'quality.issues.score.tooLow' });
        }
        
        // Bokeh rejection DISABLED - too many edge cases and false positives
        const hasVeryPoorBokeh = false;
        
        // Handle similarity-based rejections (ONLY FOR NEW IMAGES)
        const hasSimilarityIssue = img.similarityAnalysis && !img.isAcceptable && img.varietyIssue === 'duplicate';
        
        if (hasSimilarityIssue) {
          // PROTECT PREVIOUSLY ACCEPTED IMAGES: Only apply similarity rejection to new images
          if (!isPreviouslyAccepted) {
            const { sessionSimilarity, sameSessionIndices, varietyRank } = img.similarityAnalysis!;
            const sessionCount = sameSessionIndices?.length || 0;
            
            // Image rejected due to being from same photo session with low variety
            i18nIssues.push({ 
              key: 'quality.issues.duplicate.sameSession',
              params: { 
                count: sessionCount,
                rank: varietyRank
              }
            });
          } else {
            // Previously accepted image - ignore similarity rejection
            console.log(`[Protected] Image "${actualFileName}" was previously accepted, ignoring similarity rejection`);
          }
        }
        
        // Bokeh warnings removed - only reject if < 10, no warnings for 10-40
        // (Too confusing for users when it's not actually causing rejection)
        
        // FORCE REJECTION: NEW images similar to ALREADY ACCEPTED images
        // If a new image is in the same session as a previously accepted image, reject the NEW one
        const isNewImage = !isPreviouslyAccepted;
        const isSimilarToAcceptedImage = img.similarityAnalysis?.sameSessionIndices?.some(idx => {
          const similarFileName = files[idx]?.name;
          return similarFileName && previouslyAcceptedFileNames.has(similarFileName);
        });
        
        if (isNewImage && isSimilarToAcceptedImage && img.similarityAnalysis?.sessionSimilarity && img.similarityAnalysis.sessionSimilarity > 95) {
          // NEW image is too similar to an already-accepted image
          // Reject the NEW one to preserve the already-accepted set
          wasForcedRejection = true;
          const { sessionSimilarity, sameSessionIndices } = img.similarityAnalysis;
          const sessionCount = sameSessionIndices?.length || 0;
          
          i18nIssues.push({ 
            key: 'quality.issues.duplicate.sameSession',
            params: { 
              count: sessionCount,
              rank: 0
            }
          });
          console.log(`[Forced Rejection] NEW image "${actualFileName}" is too similar to previously accepted images, rejecting it`);
        }
        
        // Determine final acceptability:
        // - Previously accepted images: Only reject for quality issues, ignore similarity
        // - NEW images similar to accepted: Force rejection to protect accepted set
        // - Other new images: Reject for both quality and similarity issues
        const isAcceptable = wasForcedRejection
          ? false  // New image too similar to accepted ones: reject it
          : isPreviouslyAccepted 
            ? !hasQualityIssues && !hasVeryPoorBokeh  // Previously accepted: only quality matters
            : img.isAcceptable && !hasVeryPoorBokeh;  // New images: use Claude's decision
        
        results[actualFileName] = {
          width: bodyResults[index].width,
          height: bodyResults[index].height,
          faceCount: img.faceCount,
          score: img.overallScore,
          faceScore: img.hasSingleFace ? 100 : 0,
          bodyScore: bodyResults[index].hasBody ? 100 : 0,
          brightnessScore: img.brightnessScore,
          contrastScore: img.contrastScore,
          blurScore: img.sharpnessScore, // Use Claude's sharpness score directly
          blockinessScore: img.sharpnessScore, // Use sharpness as proxy for compression/pixelation
          resolutionScore: img.sharpnessScore, // Use sharpness as proxy for resolution
          bokehScore: img.bokehScore,
          saturationScore: img.saturationScore,
          hasSingleFace: img.hasSingleFace,
          hasGoodResolution: img.isSharp,
          hasGoodScore: isAcceptable,
          isAcceptable: isAcceptable,
          hasFace: img.faceCount > 0,
          hasBody: bodyResults[index].hasBody,
          faceDetectionSkipped: false,
          issues: img.rejectionReasons,
          i18nIssues: i18nIssues,
          eyesVisible: true, // Sunglasses check disabled due to false positives
          eyeDetectionSkipped: false
        };
      });
      
      // Log protection summary
      const protectedCount = Array.from(previouslyAcceptedFileNames).filter(name => results[name]?.isAcceptable).length;
      const newAcceptedCount = Object.entries(results).filter(([name, result]) => 
        result.isAcceptable && !previouslyAcceptedFileNames.has(name)
      ).length;
      const newRejectedCount = Object.entries(results).filter(([name, result]) => 
        !result.isAcceptable && !previouslyAcceptedFileNames.has(name)
      ).length;
      
      console.log('[Image Protection Summary]', {
        previouslyAccepted: previouslyAcceptedFileNames.size,
        stillAccepted: protectedCount,
        newAccepted: newAcceptedCount,
        newRejected: newRejectedCount
      });
      
      return results;
      
    } catch (error) {
      console.error('API analysis failed, falling back to MediaPipe:', error);
      
      // Fallback to MediaPipe analysis
      const results: Record<string, ImageQualityResult> = {};
      for (const file of files) {
        const result = await analyzeImageQuality(file, { petMode });
        results[file.name] = result;
      }
      
      return results;
    }
  };

  const analyzeImages = async (files: File[]): Promise<[File[], Record<string, ImageQualityResult>]> => {
    try {
      // Check if we have exactly 9 files total (only count accepted files from existing + new files)
      const acceptedExistingCount = fileStates.filter(state => state.qualityResult?.isAcceptable).length;
      const totalFiles = acceptedExistingCount + files.length;
      
      // Set analyzing count to actual number of files that will be analyzed
      const actualAnalyzingCount = totalFiles >= 9 ? 9 : files.length;
      
      setAnalysisState(prev => ({ 
        ...prev, 
        isAnalyzing: true, 
        analyzingCount: actualAnalyzingCount,
        currentFileIndex: -1,
        acceptedCount: 0 
      }));
      
      // STEP 1: Immediately add all new files with placeholder results (show thumbnails)
      const placeholderResult: ImageQualityResult = {
            width: 0,
            height: 0,
            faceCount: 0,
            score: 0,
            faceScore: 0,
            bodyScore: 0,
            brightnessScore: 0,
            contrastScore: 0,
            blurScore: 0,
            blockinessScore: 0,
            resolutionScore: 0,
            hasSingleFace: false,
        hasGoodResolution: true,
        hasGoodScore: true,
        isAcceptable: true,
            hasFace: false,
            hasBody: false,
            faceDetectionSkipped: true,
        issues: [],
        i18nIssues: [],
        eyesVisible: true,
        eyeDetectionSkipped: true
      };
      
      // Add new files immediately
      files.forEach(file => {
        setFileStates(prev => [...prev, {
            file,
            previewUrl: URL.createObjectURL(file),
          qualityResult: placeholderResult,
            uploadProgress: { progress: 0, isUploading: false }
        }]);
      });
      
      // STEP 2 & 3: For 9+ files, check bodyshots THEN analyze with Claude
      let results: Record<string, ImageQualityResult>;
      let bodyResultsArray: Array<{ hasBody: boolean; width: number; height: number }> = [];
      
      if (totalFiles >= 9) {
        const existingFiles = fileStates.filter(state => state.qualityResult?.isAcceptable);
        const allFiles = [
          ...existingFiles.map(state => state.file),
          ...files
        ];
        const filesToAnalyze = allFiles.slice(0, 9);
        
        console.log('[Bodyshot Check]', {
          previouslyAccepted: existingFiles.length,
          newFiles: files.length,
          totalToAnalyze: filesToAnalyze.length,
          fileNames: filesToAnalyze.map(f => f.name)
        });
        
        // Check bodyshots first (runs on ALL files, including previously accepted)
        bodyResultsArray = await Promise.all(filesToAnalyze.map(file => analyzeForBodyShot(file)));
        
        const bodyResultsRecord: Record<string, ImageQualityResult> = {};
        filesToAnalyze.forEach((file, index) => {
          bodyResultsRecord[file.name] = {
            width: bodyResultsArray[index].width,
            height: bodyResultsArray[index].height,
            faceCount: bodyResultsArray[index].hasBody ? 1 : 0,
            score: 100,
            faceScore: 100,
            bodyScore: bodyResultsArray[index].hasBody ? 100 : 0,
            brightnessScore: 100,
            contrastScore: 100,
            blurScore: 100,
            blockinessScore: 100,
            resolutionScore: 100,
            hasSingleFace: true,
            hasGoodResolution: true,
            hasGoodScore: true,
            isAcceptable: true,
            hasFace: true,
            hasBody: bodyResultsArray[index].hasBody,
            faceDetectionSkipped: false,
            issues: [],
            i18nIssues: [],
            eyesVisible: true,
            eyeDetectionSkipped: false
          };
        });
        
        const bodyCheck = checkBodyShotRequirements(bodyResultsRecord);
        
        // If bodyshot requirements not met, update file states with actual results and throw error
        if (!bodyCheck.isValid) {          
          // Update fileStates with actual bodyshot detection results
          setFileStates(prev => prev.map(state => {
            const actualResult = bodyResultsRecord[state.file.name];
            if (actualResult) {
              return {
                ...state,
                qualityResult: actualResult
              };
            }
            return state;
          }));
          
          const errorMessage = bodyCheck.errors[0] || 'Body shot requirements not met';
          throw new Error(errorMessage);
        }
        
        // Track previously accepted images (before this analysis)
        const previouslyAcceptedFileNames = new Set(
          fileStates
            .filter(state => state.qualityResult?.isAcceptable)
            .map(state => state.file.name)
        );
        
        // Proceed with Claude analysis regardless of MediaPipe bodyshot check
        // (MediaPipe is unreliable - too many false positives/negatives)
        results = await analyzeImagesWithClaude(filesToAnalyze, bodyResultsArray, previouslyAcceptedFileNames);
      } else {
        // For less than 9, use placeholder results
        results = {};
        files.forEach(file => {
          results[file.name] = placeholderResult;
        });
      }
      
      // STEP 3: Update fileStates with real analysis results
      const acceptedFiles: File[] = [];
      const rejectedFileStates: FileState[] = [];
      const newAcceptedStates: FileState[] = [];
      
      if (totalFiles >= 9) {
        // Rebuild fileStates with Claude results (for analyzed files only)
        const existingFiles = fileStates.filter(state => state.qualityResult?.isAcceptable);
        const allFiles = [
          ...existingFiles.map(state => state.file),
          ...files
        ];
        
        // Create a map of existing preview URLs
        const existingPreviewUrls = new Map(
          existingFiles.map(state => [state.file.name, state.previewUrl])
        );
        
        // Process analyzed files (first 9)
        allFiles.slice(0, 9).forEach(file => {
          const result = results[file.name];
          const previewUrl = existingPreviewUrls.get(file.name) || URL.createObjectURL(file);
          
          if (result?.isAcceptable) {
            newAcceptedStates.push({
              file,
              previewUrl,
              qualityResult: result,
              uploadProgress: { progress: 0, isUploading: false }
            });
            acceptedFiles.push(file);
          } else if (result) {
            rejectedFileStates.push({
              file,
              previewUrl,
              qualityResult: result,
              uploadProgress: { progress: 0, isUploading: false }
            });
          }
        });
        
        // Remove any excess files beyond the first 9 from fileStates
        const analyzedFileNames = new Set(allFiles.slice(0, 9).map(f => f.name));
        setFileStates(prev => prev.filter(state => analyzedFileNames.has(state.file.name)));
        
        // Replace with new results
        setFileStates([...newAcceptedStates, ...rejectedFileStates]);
      } else {
        // For < 9 files, fileStates were already updated in STEP 1
        files.forEach(file => {
          const result = results[file.name];
          if (result?.isAcceptable) {
            acceptedFiles.push(file);
          }
        });
      }
      
      // Calculate rejected count
      const totalAnalyzed = Object.keys(results).length;
      const acceptedCount = Object.values(results).filter(r => r.isAcceptable).length;
      const rejectedCount = totalAnalyzed - acceptedCount;
      const newAttempts = analysisState.analysisAttempts + 1;
      
      // Enable bypass if 3rd+ attempt and 2 or fewer rejected images
      const canBypassQuality = newAttempts >= 3 && rejectedCount > 0 && rejectedCount <= 2;
      
      setAnalysisState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        currentFileIndex: -1,
        acceptedCount: acceptedCount,
        analysisAttempts: newAttempts,
        rejectedCount: rejectedCount,
        canBypassQuality: canBypassQuality
      }));
      
      return [acceptedFiles, results];
      
    } catch (error) {
      console.error('Error during image analysis:', error);
      
      // DON'T remove files - keep thumbnails visible
      // The bodyshot error will be shown in the UI by the FileUploader component
      
      setAnalysisState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        currentFileIndex: -1,
        acceptedCount: 0 
      }));
      
      // Return empty results so files stay in state with placeholder data
      return [[], {}];
    }
  };

  const clearRejectedFiles = () => {
    setFileStates(prev => prev.filter(state => state.qualityResult?.isAcceptable))
  }

  const addFiles = useCallback(async (newFiles: File[]) => {
    // First do basic validation
    const validFiles = validateFiles(newFiles)
    if (validFiles.length === 0) return []

    // Analyze files - file states are added during analysis
    const [analyzedFiles, results] = await analyzeImages(validFiles)

    // Check how many slots are available
    const remainingSlots = maxFiles - computedValues.acceptedCount
    
    // Separate files by status:
    // 1. Analyzed and rejected (have results, not acceptable)
    const rejectedFiles = validFiles.filter(f => results[f.name] && !results[f.name]?.isAcceptable)
    // 2. Analyzed and accepted (have results, acceptable)
    const acceptableFiles = validFiles.filter(f => results[f.name]?.isAcceptable)
    // 3. Not analyzed (no results - happens when adding more than 9 files)
    const notAnalyzedFiles = validFiles.filter(f => !results[f.name])
    
    // Only keep acceptable files that fit within the limit
    const filesToKeep = acceptableFiles.slice(0, remainingSlots)
    const filesToDiscard = acceptableFiles.slice(remainingSlots)
    
    // Remove discarded files from fileStates (they were added during analysis)
    if (filesToDiscard.length > 0) {
      setFileStates(prev => prev.filter(state => 
        !filesToDiscard.some(f => f.name === state.file.name)
      ))
    }
    
    // Check for issues
    const rejectedCount = rejectedFiles.length
    const hasRejectedFiles = rejectedCount > 0
    const hasDiscardedFiles = filesToDiscard.length > 0
    const hasNotAnalyzedFiles = notAnalyzedFiles.length > 0
    
    // Clear rejected files if all files passed quality checks
    if (!hasRejectedFiles) {
      clearRejectedFiles();
    }
    
    // Show appropriate toasts
    // Only show toasts for actual quality/limit issues, not bodyshot check failures
    // (bodyshot errors are shown in the FileUploader UI component)
    const totalSkipped = filesToDiscard.length + notAnalyzedFiles.length
    const hasAnySkipped = hasDiscardedFiles || hasNotAnalyzedFiles
    
    // Don't show toasts if no files were actually analyzed (bodyshot error case)
    const hasAnyAnalyzedFiles = Object.keys(results).length > 0
    
    if (hasAnyAnalyzedFiles) {
      if (hasRejectedFiles && hasAnySkipped) {
        // Both rejections and limit reached
        toast({
          title: t('errors.qualityAndLimitIssues'),
          description: t('errors.qualityAndLimitMessage', { 
            rejected: rejectedCount,
            skipped: totalSkipped
          }),
          duration: 7000,
        })
      } else if (hasAnySkipped) {
        // Only limit reached (no quality issues)
        const skippedFileNames = [...filesToDiscard, ...notAnalyzedFiles].map(f => f.name).join(', ')
        toast({
          title: t('errors.someImagesSkipped'),
          description: t('errors.skippedMessage', { 
            count: remainingSlots,
            files: skippedFileNames
          }),
          duration: 5000,
        })
      } else if (hasRejectedFiles) {
        // Only quality issues (no limit reached)
        toast({
          title: t('errors.qualityIssues'),
          description: t('errors.qualityIssuesMessage', { 
            count: rejectedCount
          }),
          duration: 5000,
        })
      }
    }

    return fileStates
  }, [validateFiles, computedValues.acceptedCount, maxFiles, analyzeImages, t, toast, clearRejectedFiles, setFileStates])

  const removeFile = useCallback(async (index: number) => {
    const state = fileStates[index]
    
    // Check if this is an existing file with an ID
    const existingFile = state?.file as unknown as FileWithScore
    if (existingFile?.id) {
      // This is an existing file, delete it from S3 and database
      try {
        await apiRequest(`/api/user-images?imageId=${existingFile.id}`, {
          method: 'DELETE',
        })

        // Call the callback to update existingImages in the parent
        if (existingFile.id) {
          options.onRemoveExistingImage?.(existingFile.id)
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        toast({
          title: t('errors.deleteFailed'),
          description: t('errors.genericError'),
          variant: 'destructive',
        })
        return
      }
    }
    
    // If there was a URL created, revoke it
    if (state?.uploadedUrl) {
      URL.revokeObjectURL(state.uploadedUrl)
    }

    // Revoke any blob URL we created  
    if (state?.previewUrl?.startsWith('blob:')) {  
      URL.revokeObjectURL(state.previewUrl)  
    }  
    
    // Remove the file from state
    setFileStates(prev => prev.filter((_, i) => i !== index))

  }, [fileStates, t, toast, options.onRemoveExistingImage])

  const clearFiles = () => {
    fileStates.forEach(state => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl)
      }
    })
    setFileStates([])
    
    // Reset analysis state including attempts counter (important for bypass feature)
    setAnalysisState({
      isAnalyzing: false,
      analyzingCount: 0,
      currentFileIndex: -1,
      acceptedCount: 0,
      analysisAttempts: 0,
      canBypassQuality: false,
      rejectedCount: 0
    })
  }

  const uploadFile = async (file: File, orderId: string, characterId: string) => {
    const index = fileStates.findIndex(state => state.file === file)
    if (index === -1) return

    setFileStates(prev => prev.map((state, i) => 
      i === index 
        ? { ...state, uploadProgress: { progress: 0, isUploading: true } }
        : state
    ))
    
    try {
      const url = await uploadFileInChunks(
        file,
        characterId,
        (progress: number) => {
          setFileStates(prev => prev.map((state, i) => 
            i === index 
              ? { ...state, uploadProgress: { progress, isUploading: true } }
              : state
          ))
        }
      )

      setFileStates(prev => prev.map((state, i) => 
        i === index 
          ? { 
              ...state, 
              uploadProgress: { progress: 100, isUploading: false },
              uploadedUrl: url
            }
          : state
      ))

      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      setFileStates(prev => prev.map((state, i) => 
        i === index 
          ? { ...state, uploadProgress: { progress: 0, isUploading: false } }
          : state
      ))
      throw error
    }
  }

  // Bypass quality checks and accept all images (including rejected ones)
  const bypassQualityChecks = useCallback(() => {
    setFileStates(prev => prev.map(state => ({
      ...state,
      qualityResult: state.qualityResult ? {
        ...state.qualityResult,
        isAcceptable: true,
        hasGoodScore: true
      } : undefined
    })));
    
    // Reset bypass state
    setAnalysisState(prev => ({
      ...prev,
      canBypassQuality: false,
      acceptedCount: prev.acceptedCount + prev.rejectedCount,
      rejectedCount: 0
    }));
  }, []);

  return {
    files: fileStates.map(state => state.file),
    fileStates,
    qualityResults: useMemo(() => Object.fromEntries(
      fileStates
        .filter(state => state.qualityResult)
        .map(state => [state.file.name, state.qualityResult!])
    ), [fileStates]),
    ...computedValues,
    addFiles,
    removeFile,
    clearFiles,
    clearRejectedFiles,
    ...analysisState,
    handleNewFiles,
    uploadFile,
    modelsStatus,
    bypassQualityChecks
  }
}