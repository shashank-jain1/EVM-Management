import clsx from 'clsx';

export default function Spinner({ size = 'md', className, label = 'Loading...' }) {
  const sizeClass = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3', xl: 'w-16 h-16 border-4' }[size];
  return (
    <div className={clsx('inline-flex items-center justify-center', className)} role="status" aria-label={label}>
      <div className={clsx('rounded-full border-gray-200 border-t-saffron-500 animate-spin', sizeClass)} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
