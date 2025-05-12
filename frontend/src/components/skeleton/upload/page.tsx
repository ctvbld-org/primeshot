'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { UploadRequirements } from '@/components/upload/upload-requirements'

export function UploadPageSkeleton() {
  return (
    <div className="text-[#C0CED8] text-center space-y-6 pb-[80px]">
      {/* Title Section */}
      <div>
        <Skeleton className="h-7 w-3/4 mx-auto" /> {/* Title */}
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" /> {/* Description */}
      </div>

      {/* Requirements Section */}
      <UploadRequirements />

      {/* File Uploader Section */}
      <div className="flex justify-center mt-[32px]">
        <div className="w-full max-w-[640px] aspect-[640/360] rounded-[24px] border-2 border-dashed border-[#1F2937] bg-[#09090B] flex flex-col items-center justify-center p-6">
          <Skeleton className="w-12 h-12 rounded-full mb-4" /> {/* Icon placeholder */}
          <Skeleton className="h-5 w-48 mb-2" /> {/* Primary text */}
          <Skeleton className="h-4 w-64" /> {/* Secondary text */}
        </div>
      </div>

      {/* Footer Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#09090B] border-t border-[#1F2937] p-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* File thumbnails */}
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-12 h-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="w-32 h-10 rounded-lg" /> {/* Button */}
        </div>
      </div>
    </div>
  )
} 