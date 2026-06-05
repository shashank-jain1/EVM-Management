import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Debounced search input with clear button
 * @param {Function} onSearch - called after debounce with current value
 * @param {number} debounceMs - debounce delay (default 300ms)
 */
export default function SearchInput({ onSearch, debounceMs = 300, placeholder = 'Search...', className, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => { onSearch(value); }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className={clsx('relative', className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-8 py-2 h-9 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 hover:border-gray-400 transition-all duration-150"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
