'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2Icon } from 'lucide-react'

export function UploadRequirements() {
  const requirements = [
    "JPEG, PNG, or WebP format",
    "Maximum file size: 10MB",
    "Minimum resolution: 1000 x 1000 pixels",
    "Clear face visibility (avoid sunglasses, hats)",
    "Good lighting (avoid harsh shadows)",
    "Neutral background preferred",
    "Portrait or square orientation"
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {requirements.map((requirement, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{requirement}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
} 