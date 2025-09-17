import * as React from "react";
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type ButtonIconOnly = false | true;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconSide?: 'left' | 'right';
    iconOnly?: ButtonIconOnly;
}
declare const buttonVariants: ({ variant, size, className, loading, iconSide, iconOnly, }?: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    iconSide?: string;
    loading?: boolean;
    iconOnly?: ButtonIconOnly;
}) => string;
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
export type { ButtonProps };
