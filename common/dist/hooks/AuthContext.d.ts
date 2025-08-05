import React from 'react';
import type { AuthContextType } from '../types/auth';
export declare const AuthProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
