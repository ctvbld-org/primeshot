'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
const BannerContext = React.createContext({
    banner: null,
    showBanner: () => { },
    hideBanner: () => { },
});
export function BannerProvider({ children, }) {
    const [banner, setBanner] = React.useState(null);
    const timerRef = React.useRef(undefined);
    const showBanner = React.useCallback(({ title, description, variant = "default", duration = 5000, className }) => {
        setBanner({ title, description, variant, duration, className, isVisible: true });
        if (duration !== Infinity) {
            timerRef.current = window.setTimeout(() => {
                setBanner(prev => prev ? { ...prev, isVisible: false } : null);
                window.setTimeout(() => setBanner(null), 150); // Wait for animation
            }, duration);
        }
    }, []);
    const hideBanner = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setBanner(prev => prev ? { ...prev, isVisible: false } : null);
        window.setTimeout(() => setBanner(null), 150); // Wait for animation
    }, []);
    return (_jsx(BannerContext.Provider, { value: {
            banner,
            showBanner,
            hideBanner,
        }, children: children }));
}
export function useBanner() {
    const context = React.useContext(BannerContext);
    if (!context) {
        throw new Error("useBanner must be used within a BannerProvider");
    }
    return context;
}
