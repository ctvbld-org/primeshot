'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageQualityResult } from '@/lib/image-quality'
import { ImageQualityScore } from '@/components/upload/image-quality-score'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export default function ReviewPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [qualityResults, setQualityResults] = useState<Record<string, ImageQualityResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Get the quality results from session storage
  useEffect(() => {
    // Only run this in the browser
    if (typeof window === 'undefined') {
      return;
    }
    
    const storedResults = sessionStorage.getItem('qualityResults')
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults)
        setQualityResults(parsedResults)
      } catch (error) {
        console.error('Error parsing quality results:', error)
      }
    } else {
      // If no results, redirect back to upload
      toast({
        title: 'No photos found',
        description: 'Please upload photos before reviewing.',
        variant: 'destructive',
      })
      router.push('/app/upload')
    }
    
    setIsLoading(false)
  }, [router, toast])
  
  const handleContinue = async () => {
    try {
      // Save user progress to indicate they're in the payment stage
      if (user) {
        await saveUserProgress('payment');
      }
      
      // Navigate to payment page
      router.push('/app/payment')
    } catch (error) {
      console.error('Error continuing to payment:', error)
      toast({
        title: 'Error',
        description: 'There was a problem proceeding to payment. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  // Save user progress to Supabase
  const saveUserProgress = async (stage: string) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          current_stage: stage,
          last_active_at: new Date().toISOString(),
          completed_stages: ['compositions', 'upload', 'review'],
          stage_data: {
            review: {
              reviewedImages: Object.keys(qualityResults),
              lastReviewAt: new Date().toISOString()
            }
          }
        });
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  };
  
  // Categorize images
  const getImageCategories = () => {
    const acceptable: string[] = [];
    const needsImprovement: string[] = [];
    const poor: string[] = [];
    
    Object.entries(qualityResults).forEach(([fileName, result]) => {
      if (result.isAcceptable) {
        acceptable.push(fileName);
      } else if (result.score >= 0.5) {
        needsImprovement.push(fileName);
      } else {
        poor.push(fileName);
      }
    });
    
    return { acceptable, needsImprovement, poor };
  };
  
  const imageCategories = getImageCategories();
  const hasQualityIssues = imageCategories.needsImprovement.length > 0 || imageCategories.poor.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Photo Review</h2>
        <p className="text-muted-foreground">
          Review your uploaded photos before proceeding.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Loading image analysis...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Summary</CardTitle>
              <CardDescription>
                Overview of your uploaded photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-medium">Good Quality</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">{imageCategories.acceptable.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Ready to use</p>
                </div>
                
                <div className="flex flex-col p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div className="flex items-center">
                    <ArrowRightIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-medium">Needs Improvement</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">{imageCategories.needsImprovement.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Usable but not ideal</p>
                </div>
                
                <div className="flex flex-col p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center">
                    <XIcon className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-medium">Poor Quality</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">{imageCategories.poor.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Consider replacing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed analysis cards */}
          {Object.entries(qualityResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detailed Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(qualityResults).map(([fileName, result]) => (
                  <Card key={fileName} className={
                    result.isAcceptable 
                      ? 'border-green-200' 
                      : result.score >= 0.5 
                        ? 'border-yellow-200' 
                        : 'border-red-200'
                  }>
                    <CardContent className="p-4">
                      <ImageQualityScore result={result} fileName={fileName} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {hasQualityIssues && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Consider replacing photos with poor quality scores</li>
                  <li>Ensure good lighting for best results</li>
                  <li>Make sure your face is clearly visible and centered</li>
                  <li>Use higher resolution photos when possible</li>
                  <li>Avoid blurry or over-processed images</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/app/upload')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>
        
        {!isLoading && (
          <Button 
            onClick={handleContinue}
            disabled={Object.keys(qualityResults).length === 0}
          >
            Continue
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
} 