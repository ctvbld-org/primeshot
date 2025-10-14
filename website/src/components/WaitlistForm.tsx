"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

// Create schema factory to use translations
const createFormSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('waitlist.validation.invalidEmail')),
});

type FormData = {
  email: string;
};

// Separate types for better type safety
type SubmitStatus = {
  type: 'success' | 'error' | null;
  message: string;
};

type SubmitSource = 'enter' | 'button' | 'autofill';

interface WaitlistFormProps {
  className?: string;
}

export default function WaitlistForm({ className }: WaitlistFormProps) {
  const { t, i18n } = useTranslation('homepage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({ 
    type: null, 
    message: '' 
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastValueRef = useRef<string>('');
  const autofillTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSubmittingRef = useRef(false);
  const isTypingRef = useRef(false);

  const formSchema = createFormSchema(t);
  
  const {
    register,
    reset,
    formState: { errors },
    trigger,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
  });

  // Watch email value for changes
  const emailValue = watch('email');

  // Handle form submission
  const onSubmit = useCallback(async (data: FormData, source: SubmitSource = 'button') => {
    // Prevent double submission
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, language: i18n.language }),
      });

      const result = await response.json();
      console.log('API Response:', { 
        status: response.status, 
        ok: response.ok,
        data: result,
        error: result.error,
        source 
      });

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: t('waitlist.messages.success'),
        });
      } else if (result.error === 'ALREADY_EXISTS') {
        setSubmitStatus({
          type: 'error',
          message: t('waitlist.messages.alreadyOnWaitlist'),
        });
      } else {
        throw new Error(t('waitlist.messages.defaultError'));
      }
      
      // Reset form after a short delay to ensure message visibility
      setTimeout(() => {
        reset();
        isSubmittingRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : t('waitlist.messages.defaultError'),
      });
      isSubmittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, t, i18n.language]);

  // Handle autofill detection and submission
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const checkAndSubmitAutofill = async () => {
      // Don't submit if already submitting or if user is typing
      if (isSubmittingRef.current || isTypingRef.current) return;

      if (input.value && input.value.includes('@')) {
        const isValid = await trigger('email');
        if (isValid) {
          onSubmit({ email: input.value }, 'autofill');
        }
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const currentValue = target.value;

      // Clear any existing timeout
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }

      // If the value changed and contains @, it might be autofill
      if (currentValue && currentValue.includes('@')) {
        // Set a timeout to check if this was autofill
        autofillTimeoutRef.current = setTimeout(() => {
          // Only consider it autofill if:
          // 1. The input is not focused (browser autofill)
          // 2. The value changed significantly (not just typing)
          // 3. The user is not actively typing
          const isSignificantChange = currentValue.length > lastValueRef.current.length + 5;
          if (!target.matches(':focus') && isSignificantChange && !isTypingRef.current) {
            setValue('email', currentValue, { shouldValidate: true });
            checkAndSubmitAutofill();
          }
        }, 100);
      }

      lastValueRef.current = currentValue;
    };

    const handleFocus = () => {
      // Clear any pending autofill check
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
      isTypingRef.current = true;
    };

    const handleBlur = () => {
      // Set a small delay before allowing autofill detection
      // This prevents autofill from triggering during normal typing
      setTimeout(() => {
        isTypingRef.current = false;
        // Check for autofill on blur
        if (input.value && input.value.includes('@')) {
          checkAndSubmitAutofill();
        }
      }, 200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        trigger('email').then((isValid) => {
          if (isValid) {
            onSubmit({ email: emailValue }, 'enter');
          }
        });
      }
    };

    // Add all event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', handleKeyDown);

    // Also check for autofill on mount
    if (input.value && input.value.includes('@')) {
      checkAndSubmitAutofill();
    }

    // Cleanup
    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      input.removeEventListener('keydown', handleKeyDown);
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
    };
  }, [onSubmit, setValue, trigger, emailValue]);

  // Memoize the input change handler
  const handleInputChange = useCallback(() => {
    // Clear any previous submit status when typing
    setSubmitStatus({ type: null, message: '' });
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // Don't submit if already submitting
    if (isSubmittingRef.current) return;

    const isValid = await trigger('email');
    if (isValid) {
      onSubmit({ email: emailValue }, 'button');
    }
  }, [onSubmit, trigger, emailValue]);

  return (
    <form 
      ref={formRef}
      onSubmit={handleFormSubmit} 
      className={`w-full ${className || ''}`}
    >
      <div className="flex items-center w-full h-11 bg-mist/70 focus-within:bg-mist rounded-full pl-5 pr-0.5">
        <input
          {...register('email', {
            onChange: handleInputChange,
          })}
          ref={(e) => {
            const { ref } = register('email');
            if (typeof ref === 'function') {
              ref(e);
            }
            inputRef.current = e;
          }}
          type="email"
          placeholder={t('waitlist.placeholder')}
          className="flex-grow bg-transparent placeholder:text-obsidian focus:placeholder:text-obsidian/40 text-black text-[16px] font-medium outline-none autofill:bg-transparent"
          disabled={isSubmitting}
          aria-label={t('waitlist.ariaLabel')}
          tabIndex={0}
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-10 h-10 bg-transparent active:bg-glacier rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-glacier focus-visible:ring-offset-2" 
          aria-label={isSubmitting ? t('waitlist.submittingLabel') : t('waitlist.submitLabel')}
          tabIndex={0}
        >
          {isSubmitting ? (
            <div 
              className="w-5 h-5 border-2 border-[#0c1013] border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#0c1013]"
              aria-hidden="true"
            >
              <path
                d="M4.16666 10H15.8333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 4.16666L15.8333 9.99999L10 15.8333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Fixed height container for messages */}
      <div className="h-5 mt-2">
        {(errors.email || submitStatus.message) && (
          <div
            className={`text-sm ${
              submitStatus.type === 'success'
                ? 'text-glacier'
                : 'text-ignite'
            }`}
            role="alert"
          >
            {errors.email?.message || submitStatus.message}
          </div>
        )}
      </div>
    </form>
  );
} 