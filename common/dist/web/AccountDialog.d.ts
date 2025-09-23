import React from 'react';
interface AccountDialogProps {
    /** Optional custom trigger element. Must be a single element (use asChild). */
    triggerSlot?: React.ReactNode;
    /** Optional handler to open credit purchase dialog from host app */
    onBuyCredits?: () => void;
    /** Optional handler to open subscription dialog from host app */
    onSubscribe?: () => void;
}
export declare function AccountDialog({ triggerSlot, onBuyCredits, onSubscribe }: AccountDialogProps): import("react/jsx-runtime").JSX.Element | null;
export {};
