import * as React from 'react';
export type Option = {
    value: string | number;
    content?: React.ReactNode;
    disabled?: boolean;
};
export declare function SegmentedControl({ options, value, onChange, className, fullWidth, size, ariaLabel, }: {
    options: Option[];
    value: string | number;
    onChange: (v: string | number) => void;
    className?: string;
    fullWidth?: boolean;
    size?: 'sm' | 'md';
    ariaLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
