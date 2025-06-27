import React from 'react';
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    fallback?: React.ReactNode;
    alt?: string;
}
export declare function Avatar({ src, fallback, alt, className, ...props }: AvatarProps): import("react/jsx-runtime").JSX.Element;
export {};
