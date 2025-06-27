import * as React from "react";
type BannerVariant = "default" | "success" | "destructive";
interface BannerProps {
    title?: string;
    description?: string;
    variant?: BannerVariant;
    duration?: number;
    className?: string;
}
interface BannerState extends BannerProps {
    isVisible: boolean;
}
interface BannerContextValue {
    banner: BannerState | null;
    showBanner: (props: BannerProps) => void;
    hideBanner: () => void;
}
export declare function BannerProvider({ children, }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useBanner(): BannerContextValue;
export {};
