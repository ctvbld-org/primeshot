'use client'

import React, { useState, useEffect } from 'react'
import styles from './CountdownTimer.module.css'

export interface CountdownTimerProps {
  targetDate: Date
  className?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime()
  const target = targetDate.getTime()
  const difference = target - now

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isExpired: false
  }
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => 
    calculateTimeRemaining(targetDate)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (timeRemaining.isExpired) {
    return (
      <div className={`${styles.countdownContainer} ${className || ''}`}>
        <span className={styles.expiredText}>Offer Ended</span>
      </div>
    )
  }

  return (
    <div className={`${styles.countdownContainer} ${className || ''}`}>
      <div className={styles.timeUnit}>
        <span className={styles.timeValue}>{String(timeRemaining.days).padStart(2, '0')}</span>
        <span className={styles.timeLabel}>days</span>
      </div>
      <div className={styles.timeUnit}>
        <span className={styles.timeValue}>{String(timeRemaining.hours).padStart(2, '0')}</span>
        <span className={styles.timeLabel}>hours</span>
      </div>
      <div className={styles.timeUnit}>
        <span className={styles.timeValue}>{String(timeRemaining.minutes).padStart(2, '0')}</span>
        <span className={styles.timeLabel}>minutes</span>
      </div>
      <div className={styles.timeUnit}>
        <span className={styles.timeValue}>{String(timeRemaining.seconds).padStart(2, '0')}</span>
        <span className={styles.timeLabel}>seconds</span>
      </div>
    </div>
  )
}

