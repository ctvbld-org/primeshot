import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const bannerVariants: (props?: ({
    variant?: "destructive" | "default" | "success" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
interface TopBannerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bannerVariants> {
    title?: string;
    description?: string;
    onClose?: () => void;
    showClose?: boolean;
}
declare const TopBanner: React.ForwardRefExoticComponent<TopBannerProps & React.RefAttributes<HTMLDivElement>>;
export { TopBanner };
