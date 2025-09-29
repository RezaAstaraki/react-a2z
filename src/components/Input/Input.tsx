import React, { forwardRef } from 'react';
import { cn } from '../../utils';

type InputProps = {
  label?: string;
  placeholder?: string;
  error?: string;
  errorMessage?: string;
  helperText?: string;
  variant?: 'default' | 'required' | 'disabled' | 'focused' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  isInvalid?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  type?: string;
  maxLength?: number;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  currency?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

export default forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    placeholder,
    error,
    errorMessage,
    helperText,
    variant = 'default',
    size = 'md',
    disabled = false,
    readonly = false,
    required = false,
    isInvalid = false,
    className,
    inputClassName,
    labelClassName,
    startIcon,
    endIcon,
    type = 'text',
    maxLength,
    onInput,
    currency,
    ...props
  },
  ref,
) {
  // Determine if input should be in error state
  const hasError = isInvalid || !!error || !!errorMessage;
  const displayError = error || errorMessage;

  const baseInputClasses = 'w-full transition-all duration-200 focus:outline-none text-right';

  const variantClasses = {
    default:
      'bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    required:
      'bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    disabled: 'bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed opacity-60',
    focused: 'bg-white border border-blue-500 rounded-lg ring-1 ring-blue-500',
    error:
      'bg-white border border-red-500 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-4 text-base',
  };

  const inputClasses = cn(
    baseInputClasses,
    hasError ? variantClasses.error : variantClasses[variant],
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
    readonly && 'bg-gray-50 cursor-default',
    startIcon && 'pl-10',
    endIcon && 'pr-10',
    currency && 'pr-12',
    inputClassName,
  );

  const labelClasses = cn(
    'block text-sm font-medium text-gray-700 mb-2 text-right',
    required && "after:content-['*'] after:text-red-500 after:mr-1",
    disabled && 'text-gray-400',
    hasError && 'text-red-600',
    labelClassName,
  );

  const helperTextClasses = cn(
    'text-xs mt-1 text-right',
    hasError ? 'text-red-600' : disabled ? 'text-gray-400' : 'text-gray-500',
  );

  return (
    <div className={cn('w-full', className)}>
      {label && <label className={labelClasses}>{label}</label>}

      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          maxLength={maxLength}
          onInput={onInput}
          className={inputClasses}
          {...props}
        />

        {currency && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {currency}
          </div>
        )}

        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {endIcon}
          </div>
        )}
      </div>

      {(displayError || helperText) && (
        <div className="mt-1">
          {displayError && <p className={helperTextClasses}>{displayError}</p>}
          {helperText && !displayError && <p className={helperTextClasses}>{helperText}</p>}
        </div>
      )}
    </div>
  );
});
