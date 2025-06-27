"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './signin.module.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Link from 'next/link';
import { Icon } from './Icon';
export function SignInForm() {
    const { t } = useTranslation();
    const { signIn, signInWithGoogle, signInWithLinkedIn, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const handleEmail = async (e) => {
        e.preventDefault();
        await signIn(email);
    };
    return (_jsx("div", { className: styles.card, children: _jsxs("div", { className: styles.cardContent, children: [_jsx("div", { className: styles.logoContainer, children: _jsx(Icon, { variant: "camera", size: 48, className: styles.logo }) }), _jsxs("div", { className: styles.headingContainer, children: [_jsx("h1", { className: styles.heading, children: t('signin.getStarted.title') }), _jsx("p", { className: styles.subheading, children: t('signin.getStarted.description') })] }), _jsxs("div", { className: styles.socialButtons, children: [_jsx(Button, { variant: "ghost", className: styles.socialButton, onClick: () => signInWithGoogle(), disabled: isLoading, children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", children: _jsx("path", { fill: "#EA4335", d: "M12 10.8v3.6h5.1c-.2 1.2-1.6 3.4-5.1 3.4-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 4 14.6 3 12 3 6.6 3 2.2 7.4 2.2 12.8S6.6 22.6 12 22.6c6.1 0 10.1-4.3 10.1-10.4 0-.7-.1-1.2-.2-1.6H12z" }) }) }), _jsx(Button, { variant: "ghost", className: styles.socialButton, onClick: () => signInWithLinkedIn(), disabled: isLoading, children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "#0A66C2", children: _jsx("path", { d: "M20.447 20.452H17.24v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.135 1.445-2.135 2.935v5.671H9.046V9h3.072v1.561h.043c.428-.81 1.473-1.66 3.034-1.66 3.245 0 3.843 2.136 3.843 4.917v6.633zM5.337 7.433a1.792 1.792 0 110-3.585 1.792 1.792 0 010 3.585zM6.863 20.452H3.806V9h3.057v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.728v20.543C0 23.225.792 24 1.771 24h20.451C23.205 24 24 23.225 24 22.271V1.728C24 .774 23.205 0 22.225 0z" }) }) })] }), _jsxs("div", { className: styles.divider, children: [_jsx("span", { className: styles.dividerLine }), _jsx("span", { className: styles.dividerText, children: t('signin.divider.text') }), _jsx("span", { className: styles.dividerLine })] }), _jsxs("form", { onSubmit: handleEmail, className: styles.form, children: [_jsx(Input, { type: "email", placeholder: t('signin.emailInput.placeholder'), value: email, onChange: e => setEmail(e.target.value), required: true }), error && _jsx("p", { className: styles.errorMessage, children: error.message }), _jsxs(Button, { variant: "primary", className: styles.submitButton, type: "submit", disabled: isLoading, children: [t('signin.emailInput.sendButton'), _jsx(Icon, { variant: "arrowRight", className: styles.arrowRight })] })] }), _jsxs("p", { className: styles.terms, children: [t('signin.terms.text'), " ", _jsx(Link, { href: "/terms", className: styles.termsLink, children: t('signin.terms.termsLink') }), " ", t('signin.terms.and'), " ", _jsx(Link, { href: "/privacy", className: styles.termsLink, children: t('signin.terms.privacyLink') })] })] }) }));
}
