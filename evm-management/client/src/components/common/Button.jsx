import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-9',
  lg: 'px-6 py-2.5 text-base h-11',
};

const variantMap = {
  primary: 'bg-saffron-500 text-white hover:bg-saffron-400 focus-visible:ring-saffron-500 shadow-sm',
  secondary: 'bg-transparent text-navy-700 border border-navy-700 hover:bg-navy-700 hover:text-white focus-visible:ring-navy-700',
  ghost: 'bg-transparent text-navy-700 hover:bg-navy-100 focus-visible:ring-navy-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 shadow-sm',
  'danger-ghost': 'bg-transparent text-red-600 hover:bg-red-50 focus-visible:ring-red-500',
  white: 'bg-white text-navy-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
};

/**
 * Primary Button Component
 * @param {'primary'|'secondary'|'ghost'|'danger'|'white'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  className,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-md',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        sizeMap[size],
        variantMap[variant],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : leftIcon ? (
        <span aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}
