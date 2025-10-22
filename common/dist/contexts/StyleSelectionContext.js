'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getStoredSelectedStyleIndex, storeSelectedStyleIndex, storeStyleSelections } from '../lib/utils/style-storage';
import { useStylesFromContext, useWardrobesFromContext } from './StyleDataContext';
const StyleSelectionContext = createContext(null);
export function useStyleSelection() {
    const context = useContext(StyleSelectionContext);
    if (!context) {
        throw new Error('useStyleSelection must be used within a StyleSelectionProvider');
    }
    return context;
}
export function StyleSelectionProvider({ children }) {
    const [selectedStyleId, setSelectedStyleId] = useState(null);
    // Initialize from localStorage to ensure consumers start at the saved index
    const [selectedStyleIndex, setSelectedStyleIndex] = useState(() => { var _a; return (_a = getStoredSelectedStyleIndex()) !== null && _a !== void 0 ? _a : 0; });
    const [stylesData, setStylesData] = useState([]);
    // Fetch style configs to validate URL params - now using centralized context
    const { data: styleConfigs = [] } = useStylesFromContext();
    const { data: allWardrobes = [] } = useWardrobesFromContext();
    // Sync styleConfigs to stylesData whenever they change
    useEffect(() => {
        if (styleConfigs.length > 0) {
            setStylesData(styleConfigs);
        }
    }, [styleConfigs]);
    // Ensure we only initialise from URL once
    const urlInitRef = useRef(false);
    // One-time URL parameter initialisation
    useEffect(() => {
        if (urlInitRef.current)
            return;
        if (typeof window === 'undefined')
            return; // SSR guard
        if (styleConfigs.length === 0)
            return; // Wait until configs are ready
        const params = new URLSearchParams(window.location.search);
        const styleParam = params.get('style');
        if (!styleParam) {
            urlInitRef.current = true;
            return;
        }
        const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const styleIndex = styleConfigs.findIndex((s) => {
            // Match by exact id or by slugified name to support links like ?style=studiopro
            return s.id === styleParam || normalize(s.name) === normalize(styleParam);
        });
        if (styleIndex === -1) {
            // Unknown style id
            urlInitRef.current = true;
            return;
        }
        // Apply style selection
        setSelectedStyleIndex(styleIndex);
        storeSelectedStyleIndex(styleIndex);
        const selectedStyle = styleConfigs[styleIndex];
        // Build case-insensitive lookup helpers for style-available arrays
        const findCanonical = (arr, value) => {
            if (!value || !Array.isArray(arr))
                return null;
            const lower = value.toLowerCase();
            return arr.find(v => String(v).toLowerCase() === lower) || null;
        };
        // Optional option params
        const sceneParam = params.get('scene');
        const wardrobeParam = params.get('wardrobe');
        const colorParam = params.get('color');
        // If we need wardrobe catalog to validate but it's not loaded yet, wait
        if (wardrobeParam &&
            Array.isArray(selectedStyle.available_wardrobes) &&
            !selectedStyle.available_wardrobes.includes(wardrobeParam) &&
            (!allWardrobes || allWardrobes.length === 0)) {
            return; // will rerun when allWardrobes changes
        }
        const newSelections = {};
        if (sceneParam) {
            const canonical = findCanonical(selectedStyle.available_scenes, sceneParam);
            if (canonical)
                newSelections.scene = canonical;
        }
        if (wardrobeParam) {
            // Normalize to catalog value even if URL passed an id or different casing
            const list = Array.isArray(allWardrobes) ? allWardrobes : [];
            const lower = wardrobeParam.toLowerCase();
            const byValue = list.find(w => String((w === null || w === void 0 ? void 0 : w.value) || '').toLowerCase() === lower) || null;
            const byId = list.find(w => (w === null || w === void 0 ? void 0 : w.id) === wardrobeParam) || null;
            const wardrobeValueToStore = (byValue === null || byValue === void 0 ? void 0 : byValue.value) || (byId === null || byId === void 0 ? void 0 : byId.value) || findCanonical(selectedStyle.available_wardrobes, wardrobeParam) || wardrobeParam;
            // Map style's available_wardrobes to values (supports either ids or values in DB), compare case-insensitively
            const availableValues = Array.isArray(selectedStyle.available_wardrobes)
                ? selectedStyle.available_wardrobes.map((k) => {
                    const m = list.find(w => (w === null || w === void 0 ? void 0 : w.id) === k || String((w === null || w === void 0 ? void 0 : w.value) || '').toLowerCase() === String(k).toLowerCase());
                    return (m === null || m === void 0 ? void 0 : m.value) || k;
                })
                : [];
            const inStyle = availableValues.map(v => String(v).toLowerCase()).includes(String(wardrobeValueToStore).toLowerCase());
            const inCatalog = !!(byValue || byId);
            if (inStyle || inCatalog) {
                newSelections.wardrobe = wardrobeValueToStore;
            }
        }
        if (colorParam) {
            const canonical = findCanonical(selectedStyle.available_colors, colorParam);
            if (canonical)
                newSelections.color = canonical;
        }
        if (Object.keys(newSelections).length > 0) {
            storeStyleSelections(selectedStyle.id, newSelections);
            try {
                window.dispatchEvent(new CustomEvent('style-selections-updated', { detail: { styleId: selectedStyle.id } }));
            }
            catch { }
        }
        urlInitRef.current = true;
    }, [styleConfigs, allWardrobes]);
    // Note: stylesData is populated by consumers (e.g., StylesCarousel) with sorted data
    // Do not auto-populate here to avoid race conditions with sorting logic
    // Update selectedStyleId when index changes
    useEffect(() => {
        if (stylesData.length > 0 && selectedStyleIndex >= 0 && selectedStyleIndex < stylesData.length) {
            setSelectedStyleId(stylesData[selectedStyleIndex].id);
        }
    }, [selectedStyleIndex, stylesData]);
    return (_jsx(StyleSelectionContext.Provider, { value: {
            selectedStyleId,
            selectedStyleIndex,
            setSelectedStyleId,
            setSelectedStyleIndex,
            stylesData,
            setStylesData
        }, children: children }));
}
