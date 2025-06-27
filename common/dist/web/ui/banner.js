'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { TopBanner } from "./top-banner";
import { useBanner } from "./use-banner";
export function Banner() {
    const { banner, hideBanner } = useBanner();
    if (!(banner === null || banner === void 0 ? void 0 : banner.isVisible)) {
        return null;
    }
    return (_jsx(TopBanner, { title: banner.title, description: banner.description, variant: banner.variant, onClose: hideBanner, className: banner.className }));
}
