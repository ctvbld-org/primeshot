export interface StyleSelections {
    scene: string | null;
    wardrobe: string | null;
    color: string | null;
}
export interface LegacyStyleSelections {
    background: string | null;
    clothing: string | null;
    clothingColor: string | null;
}
/**
 * Get stored selected style index
 */
export declare function getStoredSelectedStyleIndex(): number | null;
/**
 * Store selected style index
 */
export declare function storeSelectedStyleIndex(styleIndex: number): void;
/**
 * Get stored selections for a specific style
 */
export declare function getStoredStyleSelections(styleId: string): StyleSelections;
/**
 * Store selections for a specific style
 */
export declare function storeStyleSelections(styleId: string, selections: Partial<StyleSelections>): void;
