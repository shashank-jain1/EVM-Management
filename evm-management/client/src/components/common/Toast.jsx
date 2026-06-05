import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  error:   <XCircle size={16} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  info:    <Info size={16} className="text-blue-500 shrink-0" />,
};

function ToastItem({ id, type, message, duration = 4000, onRemove }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - (100 / (duration / 50));
        if (next <= 0) { clearInterval(interval); setVisible(false); setTimeout(() => onRemove(id), 250); }
        return Math.max(0, next);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [duration, id, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={clsx(
        'relative w-72 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden',
        'transition-all duration-250',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      <div className="flex items-start gap-2.5 p-3 pr-8">
        {ICONS[type]}
        <p className="text-xs text-gray-800 leading-snug">{message}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 250); }}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X size={12} />
      </button>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={clsx('h-full transition-all ease-linear', {
            'bg-green-500': type === 'success',
            'bg-red-500': type === 'error',
            'bg-amber-500': type === 'warning',
            'bg-blue-500': type === 'info',
          })}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration) => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-2), { id, type, message, duration }]); // max 3
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[100] flex flex-col items-center md:items-end gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return {
    addToast: (msg, type = 'info', duration) => ctx.add(type, msg, duration),
    success: (msg, duration) => ctx.add('success', msg, duration),
    error: (msg, duration) => ctx.add('error', msg, duration),
    warning: (msg, duration) => ctx.add('warning', msg, duration),
    info: (msg, duration) => ctx.add('info', msg, duration),
  };
}
