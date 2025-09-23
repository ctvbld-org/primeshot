"use client";

import React from 'react';
import styles from './confirmation.module.css';
import { Icon } from '@primeshot/common/web/Icon';
import { dialogServiceSingleton } from '@/contexts/DialogServiceContext';
import { Button } from '@primeshot/common/web/ui/button';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'destructive' | 'secondary' | 'primary' | 'ghost';
  icon?: string;
  hideHeader?: boolean;
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
      variant = 'primary',
      icon,
      hideHeader = true
    } = options;

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

    // Create the confirmation dialog content (top-level element carries hideHeader)
    const confirmationContent = React.createElement('div', { className: styles.container, hideHeader: hideHeader }, [
      // Inline title/description (no dialog header wrapper if hideHeader is true to avoid double header)
      React.createElement('div', { key: 'content', className: styles.content }, [
        icon && React.createElement('div', { key: 'icon', className: `${styles.icon} ${styles['icon-' + variant]}` }, React.createElement(Icon, { variant: icon as any, size: 48 })),
        React.createElement('h2', { key: 'title', className: styles.title }, title),
        React.createElement('p', { key: 'description', className: styles.description }, description),
      ]),
      // Footer with buttons
      React.createElement('div', { key: 'footer', className: styles.footer }, [
        React.createElement(Button, { key: 'confirm', onClick: handleConfirm, className: `${styles.button}`, variant: variant || 'primary', size: 'sm' }, confirmText),
        React.createElement(Button, { key: 'cancel', onClick: handleCancel, className: styles.button, variant: 'secondary', size: 'sm' }, cancelText),
      ])
    ]);

    // Open the dialog using the existing service. We no longer pass non-DOM props directly to div.
    // Instead, rely on DialogService to always include an accessible title/description.
    dialogServiceSingleton.openDialog(confirmationContent, {
      title: title,
      description: description
    });

    return promise;
  }
}

export const confirmationService = new ConfirmationService(); 