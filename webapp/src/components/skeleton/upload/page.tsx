'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function UploadPageSkeleton() {
  return (
    <div className="text-[#C0CED8] text-center space-y-6 pb-[80px]">
      {/* Title Section */}
      <div>
        <Skeleton className="h-7 w-1/4 mx-auto" /> {/* Title */}
        <Skeleton className="h-4 w-1/3 mx-auto mt-2" /> {/* Description */}
      </div>

      {/* Requirements Section */}
      <Skeleton className="h-10 w-48 mx-auto mb-2" />

      {/* File Uploader Section */}
      <div className="flex justify-center mt-[32px]">
        <div className="w-[860px] max-w-[calc(100%-64px)] rounded-[36px] border-2 border-dashed border-[#1F2937] bg-[#09090B] flex flex-col items-center justify-center gap-4 p-[72px]">
          <Skeleton className="w-12 h-12 rounded-full" /> {/* Icon placeholder */}
          <Skeleton className="h-5 w-48 mb-2" /> {/* Primary text */}
          <Skeleton className="h-4 w-64" /> {/* Secondary text */}
        </div>
      </div>

      {/* Footer Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#09090B] border-t border-[#1F2937] p-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* File thumbnails */}
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-12 h-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="w-32 h-10 rounded-lg" /> {/* Button */}
        </div>
      </div>
    </div>
  )
} 