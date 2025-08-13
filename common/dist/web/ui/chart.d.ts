import * as React from "react";
export interface ChartConfig {
    [k: string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
        color?: string;
        theme?: {
            light: string;
            dark: string;
        };
    };
}
type ChartContextProps = {
    config: ChartConfig;
};
declare function useChart(): ChartContextProps;
declare const ChartContainer: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ReactNode;
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChartStyle: ({ id, config }: {
    id: string;
    config: ChartConfig;
}) => import("react/jsx-runtime").JSX.Element | null;
declare const ChartTooltip: React.ForwardRefExoticComponent<Omit<any, "ref"> & React.RefAttributes<HTMLDivElement>>;
interface TooltipPayload {
    name?: string;
    value?: any;
    dataKey?: string;
    color?: string;
    payload?: any;
}
declare const ChartTooltipContent: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    labelFormatter?: (label: any, payload: TooltipPayload[]) => React.ReactNode;
    formatter?: (value: any, name: any, entry: any, index: number) => React.ReactNode;
    labelClassName?: string;
    color?: string;
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChartLegend: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
interface LegendPayload {
    value?: string;
    type?: string;
    id?: string;
    color?: string;
    dataKey?: string;
}
declare const ChartLegendContent: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    payload?: LegendPayload[];
    nameKey?: string;
    hideIcon?: boolean;
    verticalAlign?: "top" | "bottom";
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, useChart, };
