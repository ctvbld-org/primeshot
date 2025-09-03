import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@primeshot/common/web/ui/alert-dialog';
import { Icon } from '@primeshot/common/web/Icon';
import { dialogServiceSingleton } from '@/contexts/DialogServiceContext';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  icon?: string;
}

interface ConfirmationPromise {
  promise: Promise<boolean>;
  resolve: (value: boolean) => void;
}

class ConfirmationService {
  private currentConfirmation: ConfirmationPromise | null = null;

  confirm(options: ConfirmationOptions): Promise<boolean> {
    // If there's already a confirmation dialog open, reject the previous one
    if (this.currentConfirmation) {
      this.currentConfirmation.resolve(false);
    }

    // Create a new promise for this confirmation
    let resolveConfirmation: (value: boolean) => void;
    const promise = new Promise<boolean>((resolve) => {
      resolveConfirmation = resolve;
    });

    this.currentConfirmation = {
      promise,
      resolve: resolveConfirmation!
    };

    const {
      title,
      description,
      confirmText,
      cancelText = 'Cancel',
      variant = 'default',
      icon
    } = options;

    const getVariantStyles = () => {
      switch (variant) {
        case 'danger':
          return {
            confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
            icon: 'text-red-400'
          };
        case 'warning':
          return {
            confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            icon: 'text-yellow-400'
          };
        default:
          return {
            confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
            icon: 'text-blue-400'
          };
      }
    };

    const styles = getVariantStyles();

    const handleConfirm = () => {
      if (this.currentConfirmation) {
        this.currentConfirmation.resolve(true);
        this.currentConfirmation = null;
      }
      dialogServiceSingleton.closeDialog();
    };

    const handleCancel = () => {
      if (this.currentConfirmation) {
        this.currentConfirmation.resolve(false);
        this.currentConfirmation = null;
      }
      dialogServiceSingleton.closeDialog();
    };

    // Create the confirmation dialog content
    const confirmationContent = React.createElement('div', {
      style: {
        padding: '1.5rem',
        backgroundColor: '#083533',
        border: '1px solid rgba(229,251,250,0.2)',
        borderRadius: '32px',
        color: 'white',
        maxWidth: '28rem',
        width: '100%'
      }
    }, [
      // Inline title/description (no dialog header wrapper)
      icon && React.createElement('div', {
        key: 'icon',
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }
      }, React.createElement(Icon, { variant: icon as any, size: 48, className: styles.icon })),
      React.createElement('h2', {
        key: 'title',
        style: { fontSize: '1.125rem', fontWeight: '600', textAlign: 'center', marginBottom: '0.5rem' }
      }, title),
      React.createElement('p', {
        key: 'description',
        style: { fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center', lineHeight: '1.4', marginBottom: '1rem' }
      }, description),
      // Footer with buttons
      React.createElement('div', {
        key: 'footer',
        style: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }
      }, [
        React.createElement('button', {
          key: 'cancel',
          onClick: handleCancel,
          style: {
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid #6b7280',
            color: '#d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          },
          onMouseEnter: (e: any) => e.target.style.backgroundColor = '#374151',
          onMouseLeave: (e: any) => e.target.style.backgroundColor = 'transparent'
        }, cancelText),
        React.createElement('button', {
          key: 'confirm',
          onClick: handleConfirm,
          style: {
            padding: '0.5rem 1rem',
            backgroundColor: variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#eab308' : '#3b82f6',
            border: 'none',
            color: 'white',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          },
          onMouseEnter: (e: any) => {
            e.target.style.backgroundColor = variant === 'danger' ? '#dc2626' : variant === 'warning' ? '#ca8a04' : '#2563eb';
          },
          onMouseLeave: (e: any) => {
            e.target.style.backgroundColor = variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#eab308' : '#3b82f6';
          }
        }, confirmText)
      ])
    ]);

    // Open the dialog using the existing service. We no longer pass non-DOM props directly to div.
    // Instead, rely on DialogService to always include an accessible title/description.
    dialogServiceSingleton.openDialog(React.createElement('div', null, confirmationContent));

    return promise;
  }
}

export const confirmationService = new ConfirmationService(); 