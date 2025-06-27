import { jsx as _jsx } from "react/jsx-runtime";
export function Icon({ size = 28, className, variant, ...props }) {
    const viewBoxes = {
        background: "0 0 28 28",
        clothing: "0 0 28 28",
        clothingColor: "0 0 28 28",
        camera: "0 0 14 11",
        dizzyFace: "0 0 22 22",
        plusFill: "0 0 14 14",
        arrowLeft: "0 0 21 20",
        arrowRight: "0 0 21 20",
        cross: "0 0 16 16",
        check: "0 0 16 16",
        bin: "0 0 22 22",
        basket: "0 0 20 20",
        sun: "0 0 32 32",
        crop: "0 0 32 32",
        smilyFace: "0 0 32 32",
        insights: "0 0 32 32",
        tshirt: "0 0 32 32",
        multitask: "0 0 32 32",
        idea: "0 0 24 24",
        chevronRight: "0 0 17 16",
        checkOutline: "0 0 16 16",
        lock: " 0 0 16 16",
        chevronDown: "0 0 16 16"
    };
    const icons = { /* icons object omitted for brevity; same as in webapp version */};
    return (_jsx("svg", { width: size, height: size, viewBox: viewBoxes[variant], fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className + ` ${variant}`, ...props, children: icons[variant] }));
}
