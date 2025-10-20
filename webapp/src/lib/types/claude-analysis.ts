/**
 * TypeScript interfaces for Claude photo quality analysis
 */

export interface ClaudeImageInput {
  filename: string;
  data: string; // base64 encoded image
}

export interface SimilarityBreakdown {
  outfit: number;
  location: number;
  pose: number;
  lighting: number;
  expression: number;
  cameraAngle: number;
  framing: number;
}

export interface SimilarityAnalysis {
  // NEW: Session-based similarity (2-step approach)
  sessionSimilarity?: number; // How similar location+outfit+lighting (0-100)
  varietyScore?: number; // How different pose/expression/angle (0-100)
  varietyRank?: number; // Ranking within session group (1=most diverse)
  sameSessionIndices?: number[]; // Images from same photo session
  
  // OLD: Legacy fields (kept for backwards compatibility)
  maxSimilarityScore?: number;
  mostSimilarImageIndex: number;
  similarityBreakdown: SimilarityBreakdown;
  similarImageIndices?: number[];
}

export interface ClaudeImageResult {
  index: number;
  filename: string;
  faceCount: number;
  hasSingleFace: boolean;
  isSharp: boolean;
  hasStrongFilter: boolean;
  brightnessScore: number;
  contrastScore: number;
  saturationScore: number;
  overallScore: number;
  similarityAnalysis?: SimilarityAnalysis;
  isAcceptable: boolean;
  rejectionReasons: string[];
  varietyIssue?: 'duplicate' | null;
}

export interface BokehSummary {
  averageScore: number;
  imagesWithGoodBokeh: number;
  imagesWithPoorBokeh: number;
  shouldRejectBatch: boolean;
  message: string;
}

export interface DuplicateGroup {
  indices: number[];
  reason: string;
  keepIndices: number[];
  rejectIndices: number[];
}

export interface DuplicateAnalysis {
  groups: DuplicateGroup[];
  hasTooManyDuplicates: boolean;
  message: string;
}

export interface BatchAnalysis {
  bokehSummary: BokehSummary;
  duplicates: DuplicateAnalysis;
  varietyScore: number;
  varietyIssues: string[];
}

export interface ClaudeAnalysisResponse {
  images: ClaudeImageResult[];
  batchAnalysis: BatchAnalysis;
}

export interface ClaudeAnalysisRequest {
  images: ClaudeImageInput[];
}

export interface ClaudeAnalysisError {
  error: string;
  message?: string;
  fallback?: boolean;
}

