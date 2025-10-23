import * as React from 'react';
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    className?: string;
    variant: 'primeshotLogo' | 'primeshotSymbol' | 'scene' | 'wardrobe' | 'camera' | 'dizzyFace' | 'plusFill' | 'plus' | 'arrowLeft' | 'arrowRight' | 'arrowUp' | 'arrowDown' | 'wardrobeColor' | 'cross' | 'check' | 'bin' | 'basket' | 'sun' | 'crop' | 'smilyFace' | 'insights' | 'tshirt' | 'multitask' | 'idea' | 'chevronRight' | 'chevronLeft' | 'checkOutline' | 'lock' | 'chevronDown' | 'settings' | 'generate' | 'download' | 'dotsMenu' | 'magnifier' | 'ar11' | 'ar23' | 'ar32' | 'info' | 'restart' | 'maximize' | 'heart' | 'heartOutline' | 'secure' | 'warning' | 'diamond' | 'credits' | 'checkmark' | 'angles' | 'variety' | 'linkedin' | 'apple' | 'microsoft' | 'google' | 'logout' | 'settings2' | 'profile' | 'subscription' | 'help' | 'email' | 'x' | 'facebook' | 'handDrawnArrow' | 'styles';
}
export declare function Icon({ size, className, variant, ...props }: IconProps): import("react/jsx-runtime").JSX.Element;
export {};
