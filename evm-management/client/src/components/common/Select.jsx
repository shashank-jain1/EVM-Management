import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Search, Loader2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Custom Select dropdown with search, multi-select, and keyboard navigation
 */
export default function Select({
  id,
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  multiple = false,
  loading = false,
  disabled = false,
  error,
  helperText,
  required,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  const filtered = options.filter((o) =>
    !search || o.label?.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = useCallback(
    (val) => (multiple ? (Array.isArray(value) ? value.includes(val) : false) : value === val),
    [value, multiple]
  );

  const handleSelect = (optVal) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.includes(optVal) ? current.filter((v) => v !== optVal) : [...current, optVal]);
    } else {
      onChange(optVal);
      setOpen(false);
      setSearch('');
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      const selected = options.filter((o) => isSelected(o.value));
      if (!selected.length) return placeholder;
      return selected.map((o) => o.label).join(', ');
    }
    return options.find((o) => o.value === value)?.label || placeholder;
  };

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, searchable]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); handleSelect(filtered[focusIdx].value); }
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
  };

  return (
    <div className={clsx('relative flex flex-col gap-1', className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <button
        id={selectId}
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!error}
        className={clsx(
          'w-full flex items-center justify-between gap-2 rounded-md border text-sm text-left',
          'px-3 py-2 h-9 bg-white transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-navy-600 focus:ring-navy-600/20 hover:border-gray-400',
          (disabled || loading) && 'opacity-50 cursor-not-allowed bg-gray-50'
        )}
      >
        <span className={clsx('truncate', !value && !multiple ? 'text-gray-400' : 'text-gray-900')}>
          {getDisplayValue()}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          {multiple && Array.isArray(value) && value.length > 0 && (
            <span
              className="bg-saffron-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              aria-label={`${value.length} selected`}
            >
              {value.length}
            </span>
          )}
          <ChevronDown
            size={14}
            className={clsx('text-gray-400 transition-transform duration-150', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col"
          style={{ top: '100%', left: 0 }}>
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setFocusIdx(-1); }}
                  placeholder="Search..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-600"
                />
              </div>
            </div>
          )}
          <ul role="listbox" className="overflow-y-auto flex-1">
            {!filtered.length ? (
              <li className="px-3 py-6 text-center text-sm text-gray-500">No options found</li>
            ) : (
              filtered.map((opt, idx) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected(opt.value)}
                  onMouseDown={() => handleSelect(opt.value)}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors',
                    isSelected(opt.value) ? 'bg-navy-50 text-navy-700 font-medium' : 'text-gray-700',
                    idx === focusIdx ? 'bg-gray-100' : 'hover:bg-gray-50',
                    opt.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected(opt.value) && <Check size={14} className="text-saffron-500" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error ? (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
