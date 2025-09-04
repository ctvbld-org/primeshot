"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../lib/utils";
const ChartContext = React.createContext(null);
function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }
    return context;
}
const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
    return (_jsx(ChartContext.Provider, { value: { config }, children: _jsxs("div", { "data-chart": chartId, ref: ref, className: cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/20 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none", className), ...props, children: [_jsx(ChartStyle, { id: chartId, config: config }), children] }) }));
});
ChartContainer.displayName = "ChartContainer";
const ChartStyle = ({ id, config }) => {
    const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color);
    if (!colorConfig.length) {
        return null;
    }
    return (_jsx("style", { dangerouslySetInnerHTML: {
            __html: [
                `[data-chart=${id}] {`,
                ...colorConfig.map(([key, itemConfig]) => {
                    var _a, _b;
                    const color = (_b = (_a = itemConfig.theme) === null || _a === void 0 ? void 0 : _a.light) !== null && _b !== void 0 ? _b : itemConfig.color;
                    return color ? `  --color-${key}: ${color};` : null;
                }),
                `}`,
                `[data-chart=${id}][data-theme=dark] {`,
                ...colorConfig.map(([key, itemConfig]) => {
                    var _a;
                    const color = (_a = itemConfig.theme) === null || _a === void 0 ? void 0 : _a.dark;
                    return color ? `  --color-${key}: ${color};` : null;
                }),
                `}`,
            ]
                .filter(Boolean)
                .join("\n"),
        } }));
};
const ChartTooltip = React.forwardRef(({ ...props }, ref) => {
    return _jsx("div", { ...props });
});
ChartTooltip.displayName = "ChartTooltip";
const ChartTooltipContent = React.forwardRef(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey, ...props }, ref) => {
    const { config } = useChart();
    const tooltipLabel = React.useMemo(() => {
        var _a;
        if (hideLabel || !(payload === null || payload === void 0 ? void 0 : payload.length)) {
            return null;
        }
        const [item] = payload;
        const key = `${labelKey || item.dataKey || item.name || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const value = !labelKey && typeof label === "string"
            ? ((_a = config[label]) === null || _a === void 0 ? void 0 : _a.label) || label
            : itemConfig === null || itemConfig === void 0 ? void 0 : itemConfig.label;
        if (labelFormatter) {
            return (_jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(label, payload) }));
        }
        if (!value) {
            return null;
        }
        return _jsx("div", { className: cn("font-medium", labelClassName), children: value });
    }, [
        label,
        labelFormatter,
        payload,
        hideLabel,
        labelClassName,
        config,
        labelKey,
    ]);
    if (!active || !(payload === null || payload === void 0 ? void 0 : payload.length)) {
        return null;
    }
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return (_jsxs("div", { ref: ref, className: cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className), ...props, children: [!nestLabel ? tooltipLabel : null, _jsx("div", { className: "grid gap-1.5", children: payload.map((item, index) => {
                    var _a;
                    const key = `${nameKey || item.name || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);
                    const indicatorColor = color || ((_a = item.payload) === null || _a === void 0 ? void 0 : _a.fill) || item.color;
                    return (_jsxs("div", { className: cn("flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground", indicator === "dot" && "items-center"), children: [!hideIndicator && (_jsx("div", { className: cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                                    "h-2.5 w-2.5": indicator === "dot",
                                    "w-1": indicator === "line",
                                    "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                                    "my-0.5": nestLabel && indicator === "dashed",
                                }), style: {
                                    "--color-bg": indicatorColor,
                                    "--color-border": indicatorColor,
                                } })), _jsxs("div", { className: cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center"), children: [_jsxs("div", { className: "grid gap-1.5", children: [nestLabel ? tooltipLabel : null, _jsx("span", { className: "text-muted-foreground", children: (itemConfig === null || itemConfig === void 0 ? void 0 : itemConfig.label) || item.name })] }), _jsx("span", { className: "font-mono font-medium tabular-nums text-foreground", children: formatter ? formatter(item.value, item.name, item, index) : item.value })] })] }, item.dataKey || index));
                }) })] }));
});
ChartTooltipContent.displayName = "ChartTooltipContent";
const ChartLegend = React.forwardRef(({ className, ...props }, ref) => {
    return _jsx("div", { ref: ref, className: cn(className), ...props });
});
ChartLegend.displayName = "ChartLegend";
const ChartLegendContent = React.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props }, ref) => {
    const { config } = useChart();
    if (!(payload === null || payload === void 0 ? void 0 : payload.length)) {
        return null;
    }
    return (_jsx("div", { ref: ref, className: cn("flex items-center justify-center gap-4", verticalAlign === "top" && "pb-3", className), ...props, children: payload.map((item, index) => {
            const key = `${nameKey || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            return (_jsxs("div", { className: cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"), children: [!hideIcon && (_jsx("div", { className: "h-2 w-2 shrink-0 rounded-[2px]", style: {
                            backgroundColor: item.color,
                        } })), (itemConfig === null || itemConfig === void 0 ? void 0 : itemConfig.icon) && (_jsx(itemConfig.icon, {})), _jsx("span", { className: "text-muted-foreground", children: itemConfig === null || itemConfig === void 0 ? void 0 : itemConfig.label })] }, item.value || index));
        }) }));
});
ChartLegendContent.displayName = "ChartLegendContent";
// Utility functions
function getPayloadConfigFromPayload(config, payload, key) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }
    const payloadPayload = "payload" in payload &&
        typeof payload.payload === "object" &&
        payload.payload !== null
        ? payload.payload
        : undefined;
    let configLabelKey = key;
    if (key in payload &&
        typeof payload[key] === "string") {
        configLabelKey = payload[key];
    }
    else if (payloadPayload &&
        key in payloadPayload &&
        typeof payloadPayload[key] === "string") {
        configLabelKey = payloadPayload[key];
    }
    return configLabelKey in config ? config[configLabelKey] : config[key];
}
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, useChart, };
