"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { SignInForm } from './SignInForm';
import { useTranslation } from 'react-i18next';
import styles from './SignInForm.module.css';
export function SignInModal() {
    const { t } = useTranslation();
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", children: t('buttons.signIn', { defaultValue: 'Sign in' }) }) }), _jsx(DialogContent, { className: styles.signinContent, children: _jsx(SignInForm, {}) })] }));
}
