import Image from 'next/image'
import { UserNav } from '@/components/user-nav'
import { User } from '@supabase/supabase-js'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import styles from './app-header.module.css'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Icon } from '@/components/icons/icon'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { useStyles } from '@/hooks/useStyles'

interface AppHeaderProps {
  user: User | null
}

const NAVIGATION_STEPS = [
  { id: 'shoot', label: 'navigation.addStyles' as const, paths: ['/app/shoot', '/app/styles'] },
  { id: 'payment', label: 'navigation.checkout' as const, paths: ['/app/payment'] },
  { id: 'upload', label: 'navigation.uploadPhotos' as const, paths: ['/app/upload'] },
  { id: 'generate', label: 'navigation.generate' as const, paths: ['/app/generate'] }
] as const

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Memoize derived values
  const showBasket = useMemo(() => 
    pathname.startsWith('/app/shoot') || 
    pathname.startsWith('/app/styles') || 
    pathname.startsWith('/app/payment')
  , [pathname])
  
  // Only fetch styles when basket is shown
  const { styles: draftStyles = [], isLoading } = useStyles({ 
    status: 'draft'
  })
  
  const stylesCount = draftStyles.length

  const currentStepIndex = NAVIGATION_STEPS.findIndex(step => 
    step.paths.some(path => pathname.startsWith(path))
  )

  const currentStep = currentStepIndex >= 0 ? NAVIGATION_STEPS[currentStepIndex] : null

  // Handle click outside using custom hook
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        buttonRef.current && 
        !popupRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPopupStyle = () => {
    if (!buttonRef.current || !popupRef.current) return {}
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const popupRect = popupRef.current.getBoundingClientRect()
    const stepHeight = 48 // Height of each step item
    const currentStepOffset = currentStepIndex * stepHeight
    
    return {
      top: `${buttonRect.top - currentStepOffset}px`,
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }

  const handleBasketClick = () => {
    router.push('/app/shoot')
  }

  const renderStep = (step: typeof NAVIGATION_STEPS[number], index: number, isMobile = false) => {
    const isCompleted = currentStepIndex > index
    const isActive = currentStepIndex === index
    
    const stepContent = (
      <>
        {isCompleted ? (
          <Icon variant='check' size={isMobile ? 20 : 23} />
        ) : (
          <div className={styles.stepIcon}>{index + 1}</div>
        )}
        <span>{t(step.label)}</span>
      </>
    )

    return isMobile ? (
      <div 
        key={step.id}
        className={cn(
          styles.mobileStep,
          isActive && styles.active,
          isCompleted && styles.completed
        )}
      >   
        {stepContent}
      </div>
    ) : (
      <div 
        key={step.id}
        className={cn(
          styles.step,
          isActive && styles.active,
          isCompleted && styles.completed
        )}
      >   
        {stepContent}
      </div>
    )
  }
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Image 
          src="/logo.svg" 
          alt="Primeshot Logo" 
          width={40} 
          height={40}
          priority
        />
        
        <div className={styles.progressSteps}>
          {NAVIGATION_STEPS.map((step, index) => renderStep(step, index))}
        </div>

        {/* Mobile Progress Button & Popup */}
        <button 
          ref={buttonRef}
          className={styles.mobileProgressButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.stepIcon}>{currentStepIndex + 1}</div>
          <span>{currentStep ? t(currentStep.label) : t('navigation.addStyles')}</span>
          <MoreVertical size={12} />
        </button>

        <div 
          ref={popupRef}
          className={cn(styles.mobileStepsList, isOpen && styles.visible)}
          style={getPopupStyle()}
          onClick={() => setIsOpen(false)}
        >
          {NAVIGATION_STEPS.map((step, index) => renderStep(step, index, true))}
        </div>

        <div className={styles.rightSection}>
          {showBasket && (
            <button 
              onClick={handleBasketClick}
              className={cn(
                styles.basketButton,
                stylesCount > 0 && styles.basketActive
              )}
            >
              <Icon 
                variant="basket" 
                size={20} 
                className={cn(
                  styles.basketIcon,
                  stylesCount > 0 && styles.basketIconActive
                )}
              />
              {stylesCount > 0 && (
                <span className={styles.basketCount}>{stylesCount}</span>
              )}
            </button>
          )}
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
} 