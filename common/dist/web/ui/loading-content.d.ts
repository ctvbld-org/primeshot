export interface LoadingContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onLoadComplete?: () => void;
    waitForImages?: boolean;
}
export declare function LoadingContent({ children, className, fallback, onLoadComplete, waitForImages, ...props }: LoadingContentProps): import("react/jsx-runtime").JSX.Element;
export declare function SkeletonImage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
export declare function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
export declare function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
