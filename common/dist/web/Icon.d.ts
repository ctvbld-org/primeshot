import * as React from 'react';
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    className?: string;
    variant: 'scene' | 'wardrobe' | 'camera' | 'dizzyFace' | 'plusFill' | 'arrowLeft' | 'arrowRight' | 'wardrobeColor' | 'cross' | 'check' | 'bin' | 'basket' | 'sun' | 'crop' | 'smilyFace' | 'insights' | 'tshirt' | 'multitask' | 'idea' | 'chevronRight' | 'checkOutline' | 'lock' | 'chevronDown';
}
export declare function Icon({ size, className, variant, ...props }: IconProps): import("react/jsx-runtime").JSX.Element;
export {};
