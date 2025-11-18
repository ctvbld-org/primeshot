'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';
function calculateTimeRemaining(targetDate) {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;
    if (difference <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true
        };
    }
    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
    };
}
export function CountdownTimer({ targetDate, className }) {
    const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(targetDate));
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining(targetDate));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    if (timeRemaining.isExpired) {
        return (_jsx("div", { className: `${styles.countdownContainer} ${className || ''}`, children: _jsx("span", { className: styles.expiredText, children: "Offer Ended" }) }));
    }
    return (_jsxs("div", { className: `${styles.countdownContainer} ${className || ''}`, children: [_jsxs("div", { className: styles.timeUnit, children: [_jsx("span", { className: styles.timeValue, children: String(timeRemaining.days).padStart(2, '0') }), _jsx("span", { className: styles.timeLabel, children: "days" })] }), _jsxs("div", { className: styles.timeUnit, children: [_jsx("span", { className: styles.timeValue, children: String(timeRemaining.hours).padStart(2, '0') }), _jsx("span", { className: styles.timeLabel, children: "hours" })] }), _jsxs("div", { className: styles.timeUnit, children: [_jsx("span", { className: styles.timeValue, children: String(timeRemaining.minutes).padStart(2, '0') }), _jsx("span", { className: styles.timeLabel, children: "minutes" })] }), _jsxs("div", { className: styles.timeUnit, children: [_jsx("span", { className: styles.timeValue, children: String(timeRemaining.seconds).padStart(2, '0') }), _jsx("span", { className: styles.timeLabel, children: "seconds" })] })] }));
}
