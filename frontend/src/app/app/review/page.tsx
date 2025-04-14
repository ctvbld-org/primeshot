'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReviewPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Photo Review</h2>
        <p className="text-muted-foreground">
          Review your uploaded photos before proceeding.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Quality Review</CardTitle>
          <CardDescription>
            This page will be implemented in Task 5.2 with OpenCV.js integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              In the final implementation, this page will:
            </p>
            <ul className="list-disc text-left mt-4 ml-8 space-y-2">
              <li>Analyze uploaded photos for quality issues</li>
              <li>Detect faces and evaluate lighting</li>
              <li>Check resolution and composition</li>
              <li>Provide specific feedback for improvement</li>
              <li>Allow re-uploading rejected images</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/app/upload')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>
      </div>
    </div>
  )
} 