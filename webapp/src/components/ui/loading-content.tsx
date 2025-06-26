import { useRef } from 'react';
import { usePageReady } from '@/lib/hooks/use-page-ready';
import { cn } from '@/lib/utils';

export interface LoadingContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onLoadComplete?: () => void;
  waitForImages?: boolean;
}

export function LoadingContent({
  children,
  className,
  fallback,
  onLoadComplete,
  waitForImages = true,
  ...props
}: LoadingContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { isReady } = usePageReady({
    rootElement: contentRef.current,
    onComplete: onLoadComplete,
    waitForImages
  });

  // Default fallback if none provided
  const defaultFallback = (
    <div className="min-h-[inherit] w-full flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-muted rounded-full"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>
  );

  return (
    <div 
      ref={contentRef}
      className={cn(
        'min-h-[100px]',
        className
      )}
      {...props}
    >
      {isReady ? children : (fallback || defaultFallback)}
    </div>
  );
}

// Skeleton components for custom loading states
export function SkeletonImage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("animate-pulse bg-muted rounded-md", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("h-4 animate-pulse bg-muted rounded", className)}
      {...props}
    />
  );
}

export function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("w-12 h-12 animate-pulse bg-muted rounded-full", className)}
      {...props}
    />
  );
} 