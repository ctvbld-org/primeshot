'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle, XCircle, Info, CircleAlert } from 'lucide-react'
import { ImageQualityResult } from '@/lib/image-quality'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface ImageQualityScoreProps {
  result: ImageQualityResult
  fileName: string
}

export function ImageQualityScore({ result, fileName }: ImageQualityScoreProps) {
  // Handle no-face scenario
  if (!result.hasFace && !result.faceDetectionSkipped) {
    return (
      <div className="space-y-1">
        <div className="flex items-center text-destructive">
          <CircleAlert className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Face detection issue</span>
        </div>
        <div className="text-xs text-muted-foreground">
          This may be a technical error. Try the following:
          <ul className="list-disc pl-4 mt-1">
            <li>Ensure face is clearly visible</li>
            <li>Try a different photo angle</li>
            <li>Check for good lighting</li>
            <li>Try converting to JPG format</li>
          </ul>
        </div>
      </div>
    )
  }

  // Format score as percentage
  const formatScore = (score: number) => `${Math.round(score * 100)}%`
  
  // Get status info
  const getStatus = () => {
    if (result.isAcceptable) {
      return {
        label: 'Acceptable',
        color: 'bg-green-500',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      }
    } else if (result.score >= 0.5) {
      return {
        label: 'Needs Improvement',
        color: 'bg-yellow-500',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      }
    } else {
      return {
        label: 'Poor Quality',
        color: 'bg-red-500',
        icon: <XCircle className="h-5 w-5 text-red-500" />
      }
    }
  }
  
  const status = getStatus()
  
  // Determine face detection status text
  const getFaceStatusText = () => {
    if (result.faceDetectionSkipped) {
      return "Detection skipped";
    } else if (!result.hasFace) {
      return "No face detected";
    } else {
      return formatScore(result.faceScore);
    }
  }

  // Get face score background color
  const getFaceScoreClass = () => {
    if (result.faceDetectionSkipped) {
      return "bg-blue-200";
    } else if (!result.hasFace) {
      return "bg-red-200";
    } else {
      return "";
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          {status.icon}
          <h3 className="font-medium">{fileName}</h3>
        </div>
        <Badge variant={result.isAcceptable ? 'default' : 'outline'} className="ml-auto">
          {status.label}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Quality</span>
          <span className="font-medium">{formatScore(result.score)}</span>
        </div>
        <Progress value={result.score * 100} className={`h-2 ${status.color}`} />
      </div>
      
      {/* Quality metrics */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex justify-between">
            <span>Resolution</span>
            <span>{formatScore(result.resolutionScore)}</span>
          </div>
          <Progress value={result.resolutionScore * 100} className="h-1.5 mt-1" />
        </div>
        
        <div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span>Face Detection</span>
              {result.faceDetectionSkipped && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Info className="h-3.5 w-3.5 text-blue-500 ml-1 cursor-help" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Face detection failed or was skipped due to technical reasons</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!result.hasFace && !result.faceDetectionSkipped && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 ml-1 cursor-help" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>No human face was detected in this image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className={result.faceDetectionSkipped || !result.hasFace ? "font-medium text-red-600" : ""}>
              {getFaceStatusText()}
            </span>
          </div>
          <Progress 
            value={result.faceScore * 100} 
            className={`h-1.5 mt-1 ${getFaceScoreClass()}`} 
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>Brightness</span>
            <span>{formatScore(result.brightnessScore)}</span>
          </div>
          <Progress value={result.brightnessScore * 100} className="h-1.5 mt-1" />
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>Contrast</span>
            <span>{formatScore(result.contrastScore)}</span>
          </div>
          <Progress value={result.contrastScore * 100} className="h-1.5 mt-1" />
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>Sharpness</span>
            <span>{formatScore(result.blurScore)}</span>
          </div>
          <Progress value={result.blurScore * 100} className="h-1.5 mt-1" />
        </div>
      </div>
      
      {/* Issues list */}
      {result.issues.length > 0 ? (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Issues Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
              {result.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : result.score < 1.0 && (
        <Alert variant="default" className="mt-4 bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">Good Quality Image</AlertTitle>
          <AlertDescription className="text-blue-700">
            This image meets all the quality requirements for good results.
          </AlertDescription>
        </Alert>
      )}
      
      {!result.hasFace && !result.faceDetectionSkipped && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Face Detection Issue</AlertTitle>
          <AlertDescription>
            <p className="mt-1">Our face detection system had trouble identifying a face in this image. This could be due to:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Technical limitations of our detection system</li>
              <li>Unusual angle or lighting conditions</li>
              <li>Image format or quality issues</li>
            </ul>
            <p className="mt-2">You can still proceed with this image, but results may vary. For best results, try a different photo with a clear, centered face.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 