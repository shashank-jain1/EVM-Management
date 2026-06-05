import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Input Component — never uses placeholder as label
 * @param {string} label
 * @param {string} helperText
 * @param {string} error
 * @param {ReactNode} leftIcon
 * @param {ReactNode} rightIcon
 * @param {boolean} showCount
 * @param {number} maxLength
 */
const Input = forwardRef(function Input(
  {
    id,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    showCount = false,
    maxLength,
    className,
    inputClassName,
    required,
    value,
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={clsx(
            'w-full rounded-md border text-sm text-gray-900 bg-white',
            'transition-all duration-150 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            leftIcon ? 'pl-9' : 'pl-3',
            rightIcon ? 'pr-9' : 'pr-3',
            'py-2 h-9',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-navy-600 focus:ring-navy-600/20 hover:border-gray-400',
            inputClassName
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        ) : (
          <span />
        )}
        {showCount && maxLength && (
          <p className="text-xs text-gray-400 shrink-0">
            {(value?.length ?? 0)}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

export default Input;
