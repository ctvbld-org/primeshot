'use client';

import React, { useState } from 'react';
import styles from './form-field.module.css';
import { ChevronDown, ChevronUp, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
  color?: string;
  gradient?: string;
};

type FormFieldProps = {
  label: string;
  options?: Option[];
  value?: string;
  disabled?: boolean;
  icon?: 'lock';
};

const FormField = ({ label, options, value: initialValue, disabled = false, icon }: FormFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue || '');
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectOption = (option: Option) => {
    setValue(option.label);
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className={styles.fieldContainer}>
      <label className={styles.label}>{label}</label>
      
      <div 
        className={cn(
          styles.fieldValue, 
          disabled ? styles.disabled : '', 
          isOpen ? styles.open : ''
        )}
        onClick={toggleDropdown}
      >
        <div className={styles.selectedValue}>
          {icon === 'lock' && <Lock size={16} className={styles.lockIcon} />}
          
          {selectedOption && (selectedOption.color || selectedOption.gradient) && (
            <span 
              className={styles.colorDot} 
              style={
                selectedOption.gradient 
                  ? { background: selectedOption.gradient } 
                  : { backgroundColor: selectedOption.color }
              }
            ></span>
          )}
          
          {value || 'Select..'}
        </div>
        
        {!disabled && (
          <div className={styles.fieldIcon}>
            {selectedOption ? (
              <div className={styles.checkIcon}>
                <Check size={18} />
              </div>
            ) : isOpen ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>
        )}
      </div>
      
      {isOpen && options && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div 
              key={option.value} 
              className={styles.option}
              onClick={() => handleSelectOption(option)}
            >
              {(option.color || option.gradient) && (
                <span 
                  className={styles.colorDot} 
                  style={
                    option.gradient 
                      ? { background: option.gradient } 
                      : { backgroundColor: option.color }
                  }
                ></span>
              )}
              
              <span>{option.label}</span>
              
              {value === option.label && (
                <div className={styles.checkIconOption}>
                  <Check size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormField;