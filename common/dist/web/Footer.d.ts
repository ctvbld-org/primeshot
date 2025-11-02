interface FooterStyle {
    id: string;
    name: string;
    translations?: {
        [lang: string]: {
            name: string;
        };
    };
}
interface FooterProps {
    variant?: 'full' | 'compact';
    latestStyles?: FooterStyle[];
}
export declare const Footer: ({ variant, latestStyles }: FooterProps) => import("react/jsx-runtime").JSX.Element;
export default Footer;
