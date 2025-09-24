"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './SignInForm.module.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from './Icon';
export function SignInForm() {
    const { t } = useTranslation('auth');
    const { signIn, signInWithGoogle, signInWithLinkedIn, signInWithAzure, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);
    const heightRef = useRef(null);
    const optionsRef = useRef(null);
    const emailRef = useRef(null);
    // Measure and animate height between sections for a seamless transition
    const updateHeight = () => {
        const target = showEmailForm ? emailRef.current : optionsRef.current;
        if (heightRef.current && target) {
            heightRef.current.style.height = `${target.offsetHeight}px`;
        }
    };
    useLayoutEffect(() => {
        updateHeight();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        updateHeight();
        const onResize = () => updateHeight();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showEmailForm]);
    const handleEmail = async (e) => {
        e.preventDefault();
        await signIn(email);
    };
    const providers = [
        {
            key: 'google',
            labelKey: 'signin.google.button',
            onClick: () => signInWithGoogle(),
        },
        {
            key: 'microsoft',
            labelKey: 'signin.microsoft.button',
            onClick: () => signInWithAzure(),
        },
        {
            key: 'apple',
            labelKey: 'signin.apple.button',
            disabled: true,
        },
        {
            key: 'linkedin',
            labelKey: 'signin.linkedin.button',
            onClick: () => signInWithLinkedIn(),
        },
    ];
    return (_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.logoContainer, children: _jsx(Image, { src: (process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg` : '/app-images/assets/logo-primeshot.svg'), alt: "Primeshot", width: 64, height: 64 }) }), _jsx("div", { className: `${styles.headingContainer} ${showEmailForm ? styles.headingContainerLeft : ''}`, children: showEmailForm ? (_jsxs(Button, { variant: "ghost", size: "sm", type: "button", onClick: () => setShowEmailForm(false), children: [_jsx(Icon, { variant: "arrowLeft", className: "text-[#2ADED8]", size: 16 }), _jsx("span", { children: t('signin.email.return', 'Return to sign in options') })] })) : (_jsx("h1", { className: styles.heading, children: t('signin.title') })) }), _jsx("div", { className: styles.cardContent, children: _jsxs("div", { ref: heightRef, className: styles.heightContainer, children: [_jsxs("div", { ref: optionsRef, className: `${styles.section} ${showEmailForm ? styles.sectionHidden : styles.sectionVisible}`, children: [_jsx("div", { className: styles.socialButtons, children: providers.map((p) => (_jsxs(Button, { variant: "primary", className: styles.socialButton, onClick: p.onClick, disabled: isLoading || !!p.disabled, children: [_jsx(Icon, { variant: p.key, size: 16 }), _jsx("span", { children: t(p.labelKey) })] }, p.key))) }), _jsxs("div", { className: styles.divider, children: [_jsx("span", { className: styles.dividerLine }), _jsx("span", { className: styles.dividerText, children: t('signin.divider.text') }), _jsx("span", { className: styles.dividerLine })] }), _jsxs(Button, { variant: "primary", className: styles.emailButton, onClick: () => setShowEmailForm(true), disabled: isLoading, children: [_jsxs("svg", { width: "17", height: "16", viewBox: "0 0 17 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { width: "16", height: "16", transform: "translate(0.5)", fill: "white", style: { mixBlendMode: 'multiply' } }), _jsx("path", { d: "M14.5 3H2.5C2.23478 3 1.98043 3.10536 1.79289 3.29289C1.60536 3.48043 1.5 3.73478 1.5 4V12C1.5 12.2652 1.60536 12.5196 1.79289 12.7071C1.98043 12.8946 2.23478 13 2.5 13H14.5C14.7652 13 15.0196 12.8946 15.2071 12.7071C15.3946 12.5196 15.5 12.2652 15.5 12V4C15.5 3.73478 15.3946 3.48043 15.2071 3.29289C15.0196 3.10536 14.7652 3 14.5 3ZM13.4 4L8.5 7.39L3.6 4H13.4ZM2.5 12V4.455L8.215 8.41C8.2987 8.46806 8.39813 8.49918 8.5 8.49918C8.60187 8.49918 8.7013 8.46806 8.785 8.41L14.5 4.455V12H2.5Z", fill: "#161616" })] }), _jsx("span", { children: t('signin.email.button') })] })] }), _jsx("div", { ref: emailRef, className: `${styles.section} ${showEmailForm ? styles.sectionVisible : styles.sectionHidden}`, children: _jsxs("form", { onSubmit: handleEmail, className: styles.form, children: [_jsx(Input, { type: "email", placeholder: t('signin.emailInput.placeholder'), value: email, onChange: e => setEmail(e.target.value), required: true }), error && _jsx("p", { className: styles.errorMessage, children: error.message }), _jsx(Button, { variant: "primary", className: styles.submitButton, type: "submit", disabled: isLoading, children: t('signin.emailInput.sendButton') })] }) })] }) }), _jsxs("p", { className: styles.terms, children: [t('signin.terms.text'), " ", _jsx(Link, { href: "/terms", className: styles.termsLink, children: t('signin.terms.termsLink') }), " ", t('signin.terms.and'), " ", _jsx(Link, { href: "/privacy", className: styles.termsLink, children: t('signin.terms.privacyLink') }), t('signin.terms.ageConsent')] })] }));
}
