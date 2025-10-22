import React from 'react';
import type { Style } from '../types/styles';
interface StyleSelectionContextType {
    selectedStyleId: string | null;
    selectedStyleIndex: number;
    setSelectedStyleId: (styleId: string | null) => void;
    setSelectedStyleIndex: (index: number) => void;
    stylesData: Style[];
    setStylesData: (styles: Style[]) => void;
}
export declare function useStyleSelection(): StyleSelectionContextType;
export declare function StyleSelectionProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
