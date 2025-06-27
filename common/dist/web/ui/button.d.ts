import * as React from "react";
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}
declare const buttonVariants: ({ variant, size, className, loading, }?: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    loading?: boolean;
}) => string;
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
export type { ButtonProps };
