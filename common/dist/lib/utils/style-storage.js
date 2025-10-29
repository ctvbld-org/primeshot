const STYLE_SELECTIONS_KEY = 'primeshot_style_selections';
const SELECTED_STYLE_INDEX_KEY = 'primeshot_selected_style_index';
/**
 * Check if localStorage is available (SSR-safe)
 */
function isLocalStorageAvailable() {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Migrate legacy style selections to new format
 */
function migrateLegacySelections(legacySelections) {
    if (!legacySelections) {
        return { scene: null, wardrobe: null, color: null };
    }
    // If already in new format, return as-is
    if ('scene' in legacySelections || 'wardrobe' in legacySelections || 'color' in legacySelections) {
        return {
            scene: legacySelections.scene || null,
            wardrobe: legacySelections.wardrobe || null,
            color: legacySelections.color || null
        };
    }
    // Migrate from legacy format
    return {
        scene: legacySelections.background || null,
        wardrobe: legacySelections.clothing || null,
        color: legacySelections.clothingColor || null
    };
}
/**
 * Get stored selected style index
 */
export function getStoredSelectedStyleIndex() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }
    try {
        const stored = localStorage.getItem(SELECTED_STYLE_INDEX_KEY);
        return stored ? parseInt(stored, 10) : null;
    }
    catch (error) {
        console.error('Error reading selected style index from localStorage:', error);
        return null;
    }
}
/**
 * Store selected style index
 */
export function storeSelectedStyleIndex(styleIndex) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        localStorage.setItem(SELECTED_STYLE_INDEX_KEY, styleIndex.toString());
    }
    catch (error) {
        console.error('Error storing selected style index to localStorage:', error);
    }
}
/**
 * Get stored selections for a specific style
 */
export function getStoredStyleSelections(styleId) {
    if (!isLocalStorageAvailable()) {
        return { scene: null, wardrobe: null, color: null };
    }
    try {
        const stored = localStorage.getItem(STYLE_SELECTIONS_KEY);
        if (!stored)
            return { scene: null, wardrobe: null, color: null };
        const allSelections = JSON.parse(stored);
        const selections = allSelections[styleId];
        return migrateLegacySelections(selections);
    }
    catch (error) {
        console.error('Error reading style selections from localStorage:', error);
        return { scene: null, wardrobe: null, color: null };
    }
}
/**
 * Store selections for a specific style
 */
export function storeStyleSelections(styleId, selections) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        const stored = localStorage.getItem(STYLE_SELECTIONS_KEY);
        let allSelections = {};
        if (stored) {
            allSelections = JSON.parse(stored);
        }
        // Get current selections or default, and migrate if needed
        const currentSelections = migrateLegacySelections(allSelections[styleId]);
        allSelections[styleId] = {
            ...currentSelections,
            ...selections
        };
        localStorage.setItem(STYLE_SELECTIONS_KEY, JSON.stringify(allSelections));
    }
    catch (error) {
        console.error('Error storing style selections to localStorage:', error);
    }
}
