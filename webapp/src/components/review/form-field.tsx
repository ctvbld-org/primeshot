'use client';

import React, { useState, useEffect } from 'react';
import styles from './form-field.module.css';
import { Icon } from '@/components/icons/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@primeshot/common/web/ui/select";

interface Option {
  value: string;
  label: string;
  color?: string;
  gradient?: string;
}

interface FormFieldProps {
  label: string;
  value?: string;
  options?: Option[];
  disabled?: boolean;
  onChange?: (value: string) => void;
  name: string;
  onFieldUpdate?: (name: string, value: string) => void;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value: initialValue = '',
  options = [],
  disabled = false,
  onChange,
  name,
  onFieldUpdate,
}) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);

  const handleSelectOption = (value: string) => {
    if (disabled) return;
    
    setSelectedValue(value);
    if (onChange) {
      onChange(value);
    }
    if (onFieldUpdate) {
      onFieldUpdate(name, value);
    }
  };

  return (
    <>
      <label className={styles.label}>{label}</label>
      
      <div className={`${styles.fieldContainer} ${disabled ? styles.disabled : ''}`}>
        {options.length > 0 ? (
          <>
            {disabled ? (
              <Icon variant='lock' size={16} className={styles.lockIcon} />
            ) : selectedValue ? (
              <div className={styles.checkIcon}>
                <Icon variant="checkOutline" size={16} />
              </div>
            ) : (
              <span className={styles.unchecked}></span>
            )}
            <Select
              disabled={disabled}
              value={selectedValue || ''}
              onValueChange={handleSelectOption}
            >
              <SelectTrigger className={`${styles.fieldValue} ${disabled ? styles.disabled : ''}`} data-placeholder="Select...">
                <SelectValue placeholder="Select...">
                  {selectedValue && (
                    <div className={styles.selectedOption}>
                      {options.find(opt => opt.value === selectedValue)?.color && (
                        <span 
                          className={styles.colorDot}
                          style={
                            options.find(opt => opt.value === selectedValue)?.gradient
                              ? { background: options.find(opt => opt.value === selectedValue)?.gradient }
                              : { backgroundColor: options.find(opt => opt.value === selectedValue)?.color }
                          }
                        />
                      )}
                      {options.find(opt => opt.value === selectedValue)?.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              {!disabled && (
                <SelectContent position="item-aligned">
                  {options.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className={styles.selectItem}
                    >
                      <div className={styles.option}>
                        {(option.color || option.gradient) && (
                          <span 
                            className={styles.colorDot} 
                            style={
                              option.gradient 
                                ? { background: option.gradient } 
                                : { backgroundColor: option.color }
                            }
                          />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
          </>
        ) : (
          <div className={styles.fieldValue + ' ' + styles.input}>
            <Icon variant='lock' size={16} className={styles.lockIcon} /> 
            <span>{selectedValue}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default FormField;